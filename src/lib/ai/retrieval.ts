import type { Institution } from "@/lib/domain/types";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { normalize } from "@/lib/search/institutions";

/**
 * Retrieval for the assistant. Everything the model may say must come from one of these
 * sources, and every source carries what kind of information it is.
 */

export type SourceKind = "institution" | "pathway" | "community";

export interface AssistantSource {
  id: string; // S1, S2, …
  kind: SourceKind;
  title: string;
  href: string;
  /** Shown to the reader next to the source: how much to trust it. */
  trust: "verified" | "partial" | "overview" | "personal_experience" | "official_answer";
  text: string;
}

export interface CommunityDoc {
  id: string;
  title: string;
  body: string;
  answers: { body: string; kind: "experience" | "official" }[];
}

const STOP = new Set(
  ["מה", "מי", "איך", "איפה", "מתי", "למה", "האם", "יש", "של", "את", "על", "עם", "או", "גם", "זה", "זו", "אני", "לי", "כמה", "אפשר", "צריך", "רוצה", "הכי", "בין", "לא", "כן", "אם", "כל", "the", "a", "is", "what", "how"].map(normalize),
);

/** Content words of a question, normalized, without very short or very common words. */
export function keywords(question: string): string[] {
  return [...new Set(normalize(question).split(" ").filter((t) => t.length >= 2 && !STOP.has(t)))].slice(0, 12);
}

const PREFIX = /^[הבלומשכ]/;
const hit = (t: string, text: string) => text.includes(t) || (t.length > 3 && PREFIX.test(t) && text.includes(t.slice(1)));

function institutionText(i: Institution) {
  const p = i.profile;
  return [
    `שם: ${i.name}`,
    `סוג: ${i.typeLabel} (${PATHWAY_INFO[i.pathway].name})`,
    `מיקום: ${i.locationLabel}`,
    i.shortDescription,
    p.overview,
    p.philosophy,
    p.programStructure,
    p.dailyRoutine,
    p.militaryIntegration,
    p.livingArrangements,
    p.admissions,
    p.financial,
    i.limitations.length ? `מגבלות ידועות: ${i.limitations.join(" ")}` : "",
    i.contact?.phone.length ? `טלפון: ${i.contact.phone.join(", ")}` : "",
    i.contact?.email ? `מייל: ${i.contact.email}` : "",
    i.website ? `אתר: ${i.website}` : "",
    `מצב אימות: ${i.verificationStatus === "verified" ? "אומת מול מקור רשמי" : "אומת חלקית"} (${i.lastVerified}). ${i.verificationNotes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function scoreText(tokens: string[], name: string, body: string) {
  let s = 0;
  for (const t of tokens) {
    if (hit(t, name)) s += 3;
    else if (hit(t, body)) s += 1;
  }
  return s;
}

export function retrieve(
  question: string,
  catalog: Institution[],
  community: CommunityDoc[],
  limits = { institutions: 5, community: 3 },
): AssistantSource[] {
  const tokens = keywords(question);
  if (!tokens.length) return [];

  const pathways = PATHWAY_ORDER.map((p) => {
    const info = PATHWAY_INFO[p];
    const text = `${info.name} (${info.short}): ${info.description} מתאים ל: ${info.goodFor.join("; ")}`;
    return { p, text, s: scoreText(tokens, normalize(`${info.name} ${info.short}`), normalize(text)) };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2);

  const insts = catalog
    .map((i, idx) => {
      const text = institutionText(i);
      return { i, idx, text, s: scoreText(tokens, normalize(`${i.name} ${i.locationLabel}`), normalize(text)) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .slice(0, limits.institutions);

  const docs = community
    .map((d) => ({ d, s: scoreText(tokens, normalize(d.title), normalize(`${d.body} ${d.answers.map((a) => a.body).join(" ")}`)) }))
    .filter((x) => x.s > 0 && x.d.answers.length > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limits.community);

  const out: Omit<AssistantSource, "id">[] = [
    ...pathways.map(({ p, text }) => ({ kind: "pathway" as const, title: `המסלול: ${PATHWAY_INFO[p].name}`, href: `/institutions?pathway=${p}`, trust: "overview" as const, text })),
    ...insts.map(({ i, text }) => ({
      kind: "institution" as const,
      title: i.name,
      href: `/institutions/${i.slug}`,
      trust: i.verificationStatus === "verified" ? ("verified" as const) : ("partial" as const),
      text,
    })),
    ...docs.map(({ d }) => ({
      kind: "community" as const,
      title: `שאלה בקהילה: ${d.title}`,
      href: `/community/${d.id}`,
      trust: d.answers.some((a) => a.kind === "official") ? ("official_answer" as const) : ("personal_experience" as const),
      text: [
        `שאלה: ${d.title}\n${d.body}`,
        ...d.answers.slice(0, 4).map((a) => `${a.kind === "official" ? "תשובה רשמית של המסגרת" : "תשובה מניסיון אישי"}: ${a.body}`),
      ]
        .join("\n")
        .slice(0, 2500),
    })),
  ];
  return out.map((s, n) => ({ ...s, id: `S${n + 1}` }));
}

export interface ModelAnswer {
  status: "answered" | "insufficient";
  answer: string;
  citations: string[];
  confidence: "high" | "medium" | "low";
}

export type AssistantResult =
  | { status: "answered"; answer: string; confidence: ModelAnswer["confidence"]; sources: AssistantSource[] }
  | { status: "insufficient"; sources: AssistantSource[] };

/**
 * Accepts a model answer only if it cites at least one source that was actually provided.
 * Unknown citation ids are dropped; an answer left with no valid citation is not shown.
 */
export function acceptAnswer(model: ModelAnswer, provided: AssistantSource[]): AssistantResult {
  const known = new Map(provided.map((s) => [s.id, s]));
  const cited = [...new Set(model.citations)].map((id) => known.get(id)).filter((s): s is AssistantSource => Boolean(s));
  if (model.status !== "answered" || !model.answer.trim() || cited.length === 0) return { status: "insufficient", sources: provided };
  // Remove citation markers that point at sources we did not provide.
  const answer = model.answer.replace(/\[(S\d+)\]/g, (m, id: string) => (known.has(id) ? m : "")).trim();
  return { status: "answered", answer, confidence: model.confidence, sources: cited };
}
