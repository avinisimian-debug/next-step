import { PATHWAYS, REGIONS, type Institution, type Pathway, type Region } from "@/lib/domain/types";
import { emphasisLabels } from "@/lib/domain/emphases";

export const AUDIENCE_FILTERS = ["men", "women"] as const;
export type AudienceFilter = (typeof AUDIENCE_FILTERS)[number];

export interface InstitutionQuery {
  q: string;
  pathway: Pathway | null;
  region: Region | null;
  /** Keeps records open to this audience, plus "all" and "unknown" (unknown never excludes). */
  audience: AudienceFilter | null;
  /** true = only fully verified records. */
  verifiedOnly: boolean;
}

const FINAL_LETTERS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

/**
 * Normalizes Hebrew and Latin text for matching: strips niqqud and cantillation, unifies
 * geresh/gershayim and quotes, maps final letters, turns maqaf/hyphens into spaces, lowercases.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u05BE\-\u2013\u2014_/.,:;()?!\u2026]/g, " ") // maqaf, dashes and punctuation; before the niqqud range, which includes the maqaf
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[\u05F3\u05F4"'`]/g, "")
    .replace(/[ךםןףץ]/g, (c) => FINAL_LETTERS[c])
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Hebrew prefixes that commonly attach to a word (ה, ב, ל, ו, מ, ש, כ). Stripped as a fallback only. */
const PREFIX = /^[הבלומשכ]/;

function haystack(i: Institution): string {
  return normalize(
    [i.name, i.typeLabel, i.locationLabel, i.shortDescription, ...i.highlights, ...emphasisLabels(i), i.profile.overview].join(
      " ",
    ),
  );
}

function tokenMatches(token: string, text: string): boolean {
  if (text.includes(token)) return true;
  return token.length > 3 && PREFIX.test(token) && text.includes(token.slice(1));
}

/** Higher = better. Name hits outrank location, which outranks description. */
function score(i: Institution, tokens: string[]): number {
  const name = normalize(i.name);
  const place = normalize(`${i.locationLabel} ${i.typeLabel}`);
  let s = 0;
  for (const t of tokens) {
    if (tokenMatches(t, name)) s += 3;
    else if (tokenMatches(t, place)) s += 2;
    else s += 1;
  }
  return s;
}

export function searchInstitutions(list: Institution[], query: InstitutionQuery): Institution[] {
  const tokens = normalize(query.q).split(" ").filter(Boolean);
  const filtered = list.filter((i) => {
    if (query.pathway && i.pathway !== query.pathway) return false;
    if (query.region && !i.regions.includes(query.region) && !i.regions.includes("nationwide")) return false;
    if (query.audience && !["all", "unknown", query.audience].includes(i.attributes.audience)) return false;
    if (query.verifiedOnly && i.verificationStatus !== "verified") return false;
    if (tokens.length) {
      const text = haystack(i);
      if (!tokens.every((t) => tokenMatches(t, text))) return false;
    }
    return true;
  });
  if (!tokens.length) return filtered;
  return filtered
    .map((i, idx) => ({ i, idx, s: score(i, tokens) }))
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .map((x) => x.i);
}

const pick = <T extends string>(allowed: readonly T[], v: unknown): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;

/** Parses URL search params into a query. Unknown values are ignored rather than trusted. */
export function parseInstitutionQuery(params: Record<string, string | string[] | undefined>): InstitutionQuery {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: (one("q") ?? "").slice(0, 100),
    pathway: pick(PATHWAYS, one("pathway")),
    region: pick(REGIONS, one("region")),
    audience: pick(AUDIENCE_FILTERS, one("audience")),
    verifiedOnly: one("verified") === "1",
  };
}

/** Builds a canonical URL for a query, dropping empty values. */
export function institutionQueryHref(query: Partial<InstitutionQuery>): string {
  const p = new URLSearchParams();
  if (query.q?.trim()) p.set("q", query.q.trim());
  if (query.pathway) p.set("pathway", query.pathway);
  if (query.region) p.set("region", query.region);
  if (query.audience) p.set("audience", query.audience);
  if (query.verifiedOnly) p.set("verified", "1");
  const s = p.toString();
  return s ? `/institutions?${s}` : "/institutions";
}

export const isFiltered = (q: InstitutionQuery) =>
  Boolean(q.q.trim() || q.pathway || q.region || q.audience || q.verifiedOnly);
