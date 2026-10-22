import type { Institution } from "@/lib/domain/types";

/**
 * The personal journey from first questions to a placement. Everything here is derived
 * from what the user did on the site (answers, saved places, the stage they set for each
 * place). Nothing is inferred about the user and no institution facts are invented: the
 * "next action" texts are generic process advice, and contact details come from the catalog.
 */

export const STAGES = ["interested", "contacted", "visited", "applied", "screening", "accepted", "chosen", "dropped"] as const;
export type Stage = (typeof STAGES)[number];

export const isStage = (v: unknown): v is Stage => typeof v === "string" && (STAGES as readonly string[]).includes(v);

/** Order used for "how far along" comparisons. `dropped` sits outside the line. */
const RANK: Record<Stage, number> = {
  interested: 0,
  contacted: 1,
  visited: 2,
  applied: 3,
  screening: 4,
  accepted: 5,
  chosen: 6,
  dropped: -1,
};
export const stageRank = (s: Stage) => RANK[s];

type Kind = Institution["kind"];

/**
 * Stages offered for a place. IDF tracks are not applied to like an institution: the
 * public process is first call-up (צו ראשון), screening and an assignment by the IDF.
 */
export function stagesFor(kind: Kind): Stage[] {
  return kind === "track"
    ? ["interested", "contacted", "screening", "accepted", "chosen"]
    : ["interested", "contacted", "visited", "applied", "screening", "accepted", "chosen"];
}

const INSTITUTION_LABELS: Record<Stage, string> = {
  interested: "מתעניין",
  contacted: "יצרתי קשר",
  visited: "ביקרתי",
  applied: "הגשתי מועמדות",
  screening: "בתהליך קבלה",
  accepted: "התקבלתי",
  chosen: "זו הבחירה שלי",
  dropped: "לא ממשיך",
};

const TRACK_LABELS: Record<Stage, string> = {
  ...INSTITUTION_LABELS,
  interested: "לומד על המסלול",
  contacted: "עברתי צו ראשון",
  screening: "במיונים",
  accepted: "קיבלתי שיבוץ",
  chosen: "זה המסלול שלי",
};

export const stageLabel = (stage: Stage, kind: Kind) => (kind === "track" ? TRACK_LABELS : INSTITUTION_LABELS)[stage];

export interface NextAction {
  text: string;
  href?: string;
}

/** What to do next for one place, given where the user marked it. */
export function nextActionFor(inst: Pick<Institution, "kind" | "website" | "contact" | "slug">, stage: Stage): NextAction | null {
  const phone = inst.contact?.phone[0];
  const email = inst.contact?.email;
  if (inst.kind === "track") {
    switch (stage) {
      case "interested":
        return { text: "לקרוא על תהליך הגיוס באתר צה״ל, ולשאול חיילים ובוגרים על המסלול", href: "https://www.idf.il/השירות-שלי/" };
      case "contacted":
        return { text: "לברר מה צפוי במיונים למסלול שמעניין אותך, ולהתכונן בהתאם" };
      case "screening":
        return { text: "לחכות לתשובה. מה שקובע בסוף הוא השיבוץ של צה״ל, לפי הדרישות והצרכים" };
      case "accepted":
        return { text: "לסמן אם זה המסלול שלך, ולעדכן את המסגרות האחרות שאתה בודק" };
      default:
        return null;
    }
  }
  switch (stage) {
    case "interested":
      if (phone || email)
        return { text: `ליצור קשר ולשאול על ביקור או שבת פתוחה${phone ? ` · ${phone}` : ""}${email ? ` · ${email}` : ""}` };
      return inst.website
        ? { text: "לעבור על האתר הרשמי ולמצוא איך יוצרים קשר", href: inst.website }
        : { text: "למצוא פרטי קשר רשמיים ולשאול על ביקור", href: `/institutions/${inst.slug}` };
    case "contacted":
      return { text: "לתאם ביקור, שבת או יום פתוח, ולהכין שאלות מראש" };
    case "visited":
      return inst.website
        ? { text: "לברר באתר הרשמי או בטלפון איך ומתי מגישים מועמדות", href: inst.website }
        : { text: "לברר איך ומתי מגישים מועמדות" };
    case "applied":
      return { text: "לשאול מה כולל תהליך הקבלה (ראיון, יום מיונים) ומתי צפויה תשובה" };
    case "screening":
      return { text: "לחכות לתשובה. בינתיים כדאי להמשיך לבדוק עוד מקום אחד לפחות" };
    case "accepted":
      return { text: "להשוות מול שאר האפשרויות ולהחליט. כשבחרת, לסמן ״זו הבחירה שלי״", href: "/compare" };
    default:
      return null;
  }
}

export interface JourneyInput {
  /** Number of questionnaire answers saved on this device. */
  answered: number;
  /** Stage of every place on the user's list. */
  places: { stage: Stage }[];
  /** Places picked for side-by-side comparison. */
  compared: number;
}

export const MILESTONES = ["discover", "shortlist", "explore", "compare", "apply", "placement"] as const;
export type MilestoneId = (typeof MILESTONES)[number];
export type MilestoneStatus = "done" | "current" | "upcoming";

export interface Milestone {
  id: MilestoneId;
  title: string;
  /** One line on what this milestone means. */
  blurb: string;
  status: MilestoneStatus;
  /** A short, factual line on what the user has done here (e.g. "3 מקומות ברשימה"). */
  evidence?: string;
  action: { label: string; href: string };
}

const placesWord = (n: number) => (n === 1 ? "מקום אחד" : `${n} מקומות`);

export function computeJourney({ answered, places, compared }: JourneyInput): Milestone[] {
  const active = places.filter((p) => p.stage !== "dropped");
  const atLeast = (s: Stage) => active.filter((p) => stageRank(p.stage) >= stageRank(s)).length;

  const done: Record<MilestoneId, boolean> = {
    discover: answered > 0,
    shortlist: active.length > 0,
    explore: atLeast("contacted") > 0,
    compare: compared >= 2 || atLeast("contacted") >= 2,
    apply: atLeast("applied") > 0,
    placement: active.some((p) => p.stage === "chosen"),
  };

  const evidence: Partial<Record<MilestoneId, string>> = {
    discover: answered > 0 ? `${answered} תשובות שמורות` : undefined,
    shortlist: active.length ? `${placesWord(active.length)} ברשימה` : undefined,
    explore: atLeast("contacted") ? `${placesWord(atLeast("contacted"))} בקשר` : undefined,
    compare: compared >= 2 ? `${compared} בהשוואה` : undefined,
    apply: atLeast("applied") ? `${placesWord(atLeast("applied"))} בתהליך` : undefined,
    placement: atLeast("accepted") ? (done.placement ? "נבחר מקום" : `${placesWord(atLeast("accepted"))} עם תשובה חיובית`) : undefined,
  };

  const base: Omit<Milestone, "status" | "evidence">[] = [
    { id: "discover", title: "מכירים את עצמך", blurb: "שאלון קצר על מה שחשוב לך", action: { label: answered ? "לעדכן תשובות" : "להתחיל את השאלון", href: answered ? "/questionnaire?edit=1" : "/questionnaire" } },
    { id: "shortlist", title: "בוחרים כיוונים", blurb: "שומרים את המקומות שמעניינים אותך", action: { label: answered ? "לראות את ההמלצות" : "לחפש מסגרות", href: answered ? "/results" : "/institutions" } },
    { id: "explore", title: "בודקים מקרוב", blurb: "יוצרים קשר, מבקרים, שואלים", action: { label: "לשאול בקהילה", href: "/community" } },
    { id: "compare", title: "משווים", blurb: "שמים את האפשרויות זו לצד זו", action: { label: "להשוואה", href: "/compare" } },
    { id: "apply", title: "מגישים מועמדות", blurb: "הרשמה, ראיונות ומיונים", action: { label: "לתוכנית הפעולה", href: "/plan" } },
    { id: "placement", title: "שיבוץ", blurb: "יודעים לאן הולכים", action: { label: "לרשימה שלי", href: "#places" } },
  ];

  const firstOpen = MILESTONES.findIndex((id) => !done[id]);
  return base.map((m, i) => ({
    ...m,
    status: done[m.id] ? "done" : i === firstOpen ? "current" : "upcoming",
    evidence: evidence[m.id],
  }));
}

/** Share of milestones done, 0–100, for a compact progress indicator. */
export const journeyPercent = (ms: Milestone[]) => Math.round((ms.filter((m) => m.status === "done").length / ms.length) * 100);
