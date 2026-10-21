import type { Institution, Pathway } from "@/lib/domain/types";
import { asArray, isUndecided, optionLabel, type Answers } from "@/lib/questionnaire/questions";
import { COMPONENT_KEYS, DEFAULT_CONFIG, type ComponentKey, type EngineConfig } from "./config";

/**
 * Deterministic, explainable matching engine.
 *
 * Each component is built from "signals": one per relevant answer. A signal has a
 * 0–1 score, a relative weight, and optional explanation text. Unanswered questions
 * produce no signal, so they never count against an option — they simply drop out of
 * both the numerator and the denominator.
 */

export interface Signal {
  score: number;
  weight: number;
  /** Shown as a reason when the signal is strong. */
  reason?: string;
  /** Shown as a point to consider when the signal is weak. */
  concern?: string;
  /** Low-information reason (e.g. "you picked this pathway"), listed after specific ones. */
  generic?: boolean;
}

export interface ComponentResult {
  key: ComponentKey;
  score: number | null;
  weight: number;
  signals: Signal[];
}

export interface Recommendation {
  institution: Institution;
  /** Compatibility score with stated preferences, 0–100. Not a probability of success. */
  score: number;
  /** Share (0–1) of the total weight that the user's answers covered for this option. */
  coverage: number;
  components: ComponentResult[];
  reasons: string[];
  concerns: string[];
  unknowns: string[];
  verify: string[];
}

export interface Exclusion {
  institution: Institution;
  reason: string;
}

export interface MatchResult {
  recommendations: Recommendation[];
  /** All scored options, best first — useful for tests and "see more". */
  ranked: Recommendation[];
  excluded: Exclusion[];
  lowConfidence: boolean;
  needsGuidance: boolean;
  /** Set when fewer than `maxResults` options passed the threshold. */
  limitation?: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const overlapScore = (wanted: string[], offered: readonly string[]) => {
  if (wanted.length === 0) return null;
  const hits = wanted.filter((w) => offered.includes(w)).length;
  return { score: 0.2 + 0.8 * (hits / wanted.length), hits: wanted.filter((w) => offered.includes(w)) };
};
const listHe = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")}, וגם ${items[items.length - 1]}`;

const single = (a: Answers, id: string): string | undefined => {
  const v = a[id];
  return typeof v === "string" && v.length > 0 ? v : undefined;
};

// ───────────────────────── Hard constraints ─────────────────────────

export function hardConstraint(inst: Institution, a: Answers): string | null {
  const audience = single(a, "audience");
  const instAudience = inst.attributes.audience;
  if (audience === "men" && instAudience === "women") return "המסגרת מיועדת לבנות.";
  if (audience === "women" && instAudience === "men") return "המסגרת מיועדת לבנים.";
  return null;
}

// ───────────────────────── Components ─────────────────────────

function pathwaySignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const paths = asArray(a.paths);
  const specific = paths.filter((p): p is Pathway => ["idf", "mechina", "hesder", "yeshiva"].includes(p));
  const p = inst.attributes;

  if (specific.length > 0 && !paths.includes("not_sure")) {
    const hit = specific.includes(inst.pathway);
    out.push({
      score: hit ? 1 : paths.includes("open") ? 0.45 : 0.1,
      weight: 3,
      generic: true,
      reason: hit ? `הכיוון ״${optionLabel("paths", inst.pathway)}״ הוא אחד הכיוונים שציינת שאתה שוקל.` : undefined,
      concern: hit ? undefined : `זה לא אחד הכיוונים שבחרת — שווה להכיר בכל זאת, כי שאר ההעדפות שלך מתאימות.`,
    });
  }

  const next = isUndecided(a) ? single(a, "undecided_next_year") : undefined;
  if (next) {
    const table: Record<string, Record<Pathway, number>> = {
      beit_midrash: { yeshiva: 1, hesder: 0.85, mechina: 0.4, idf: 0.1 },
      group_prep: { mechina: 1, hesder: 0.4, idf: 0.4, yeshiva: 0.2 },
      start_service: { idf: 1, mechina: 0.35, hesder: 0.3, yeshiva: 0.1 },
      combination: { hesder: 1, mechina: 0.6, yeshiva: 0.5, idf: 0.3 },
    };
    let s = table[next]?.[inst.pathway] ?? 0.5;
    if (next === "combination" && (p.militaryModel === "shiluv" || p.militaryModel === "hesder")) s = 1;
    out.push({
      score: s,
      weight: 2,
      reason: s >= 0.8 ? `כשדמיינת את השנה הבאה בחרת ״${optionLabel("undecided_next_year", next)}״ — וזה בדיוק מה שהמסגרת מציעה.` : undefined,
    });
  }
  return out;
}

const TORAH_TARGET: Record<string, number> = { central: 4, alongside: 2.5, explore: 2, not_major: 0.5 };

function educationSignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const p = inst.attributes;

  const ti = single(a, "torah_importance");
  if (ti && ti in TORAH_TARGET) {
    const gap = Math.abs(TORAH_TARGET[ti] - p.torahIntensity);
    const tolerance = ti === "explore" ? 1 : 0;
    const s = clamp01(1 - Math.max(0, gap - tolerance) / 4);
    out.push({
      score: s,
      weight: 2,
      reason:
        s >= 0.8
          ? ti === "central"
            ? "חשוב לך שלימוד תורה יהיה במרכז — וכאן הוא חלק מרכזי מסדר היום."
            : ti === "not_major"
              ? "ציינת שלימוד תורה אינו שיקול מרכזי כרגע — והמסגרת הזו לא בנויה סביבו."
              : "רצית לימוד תורה לצד דברים אחרים — והמסגרת הזו משלבת בדיוק את זה."
          : undefined,
      concern:
        s <= 0.4
          ? p.torahIntensity > TORAH_TARGET[ti]
            ? "היקף לימוד התורה כאן גדול ממה שציינת שאתה מחפש."
            : "היקף לימוד התורה כאן קטן ממה שציינת שחשוב לך."
          : undefined,
    });
  }

  const le = single(a, "learning_env");
  if (le && le !== "not_sure") {
    let s = 0.5;
    if (le === "intensive_torah") s = p.torahIntensity >= 4 ? 1 : (p.torahIntensity / 4) * 0.8;
    if (le === "torah_and_service")
      s =
        p.militaryModel === "hesder" || p.militaryModel === "shiluv"
          ? 1
          : p.militaryModel === "individual"
            ? 0.75
            : p.militaryModel === "pre_military" && p.torahIntensity >= 3
              ? 0.7
              : 0.2;
    if (le === "structured_development")
      s = { mechina: 1, idf: 0.4, hesder: 0.4, yeshiva: 0.3 }[inst.pathway];
    if (le === "practical_service") s = { idf: 1, mechina: 0.7, hesder: 0.3, yeshiva: 0.1 }[inst.pathway];
    out.push({
      score: s,
      weight: 2,
      reason: s >= 0.8 ? `חיפשת ${optionLabel("learning_env", le)} — וזה אופי המסגרת.` : undefined,
      concern: s <= 0.3 ? `חיפשת ${optionLabel("learning_env", le)}, ואופי המסגרת הזו שונה.` : undefined,
    });
  }

  const re = single(a, "religious_env");
  if (re && ["religious_zionist", "open_religious", "exploring"].includes(re)) {
    const envScore: Record<string, Record<string, number>> = {
      religious_zionist: { religious_zionist: 1, open_religious: 0.8, mixed_backgrounds: 0.5, general: 0.3 },
      open_religious: { open_religious: 1, religious_zionist: 0.7, mixed_backgrounds: 0.7, general: 0.5 },
      exploring: { mixed_backgrounds: 1, general: 0.9, open_religious: 0.7, religious_zionist: 0.4 },
    };
    const s = Math.max(...p.religiousEnvironments.map((e) => envScore[re][e] ?? 0.3));
    out.push({
      score: s,
      weight: 1.5,
      reason: s >= 0.9 ? `האווירה כאן מתאימה למה שתיארת: ${optionLabel("religious_env", re)}.` : undefined,
      concern: s <= 0.45 ? "האווירה במסגרת שונה מזו שתיארת — כדאי לבקר ולהרגיש בעצמך." : undefined,
    });
  }

  const ys = single(a, "yeshiva_style");
  if (ys && (inst.pathway === "yeshiva" || inst.pathway === "hesder")) {
    const s =
      ys === "very_intensive"
        ? p.torahIntensity >= 4 ? 1 : 0.3
        : ys === "breadth"
          ? p.learningStyles.includes("discussion") ? 1 : 0.5
          : p.environmentStyles.includes("mentorship") ? 1 : 0.4;
    out.push({
      score: s,
      weight: 1,
      reason: s >= 0.9 ? `חשוב לך ${optionLabel("yeshiva_style", ys)} — וזה מאפיין את המקום.` : undefined,
    });
  }

  const mg = single(a, "mechina_group");
  if (mg && mg !== "no_pref" && inst.pathway === "mechina") {
    const mixed = p.religiousEnvironments.includes("mixed_backgrounds");
    const s = mg === "mixed_group" ? (mixed ? 1 : 0.2) : mixed ? 0.3 : 1;
    out.push({
      score: s,
      weight: 1.5,
      reason: s >= 0.9 ? `רצית ${optionLabel("mechina_group", mg)} — וזה הרכב הקבוצה כאן.` : undefined,
      concern: s <= 0.3 ? "הרכב הקבוצה כאן שונה ממה שביקשת." : undefined,
    });
  }
  return out;
}

const MECHINA_FOCUS_MATCH: Record<string, (i: Institution) => boolean> = {
  leadership: (i) => i.attributes.development.includes("leadership"),
  physical: (i) => i.attributes.development.includes("fitness"),
  volunteering: (i) =>
    i.attributes.serviceInterests.includes("education_community") || i.attributes.strengths.includes("community"),
  identity: (i) => i.attributes.torahIntensity >= 2,
};

function developmentSignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const p = inst.attributes;

  const goals = overlapScore(asArray(a.dev_goals), p.development);
  if (goals) {
    const labels = goals.hits.map((g) => optionLabel("dev_goals", g));
    out.push({
      score: goals.score,
      weight: 3,
      reason: goals.hits.length > 0 ? `רצית לפתח ${listHe(labels)} — והמסגרת שמה על זה דגש.` : undefined,
      concern: goals.hits.length === 0 ? "מטרות ההתפתחות שבחרת אינן הדגש המרכזי של המסגרת הזו." : undefined,
    });
  }

  const envs = overlapScore(asArray(a.best_env).filter((e) => e !== "combination"), p.environmentStyles);
  if (envs) {
    out.push({
      score: envs.score,
      weight: 1.5,
      reason:
        envs.hits.length > 0
          ? `אתה במיטבך ב${listHe(envs.hits.map((e) => optionLabel("best_env", e)))} — וזה מה שתמצא כאן.`
          : undefined,
    });
  }

  const lp = single(a, "learn_pref");
  if (lp && lp !== "mix") {
    const hit = p.learningStyles.includes(lp as never);
    out.push({
      score: hit ? 1 : 0.35,
      weight: 1.5,
      reason: hit ? `אתה לומד הכי טוב ב${optionLabel("learn_pref", lp)} — וזו שיטת הלימוד המרכזית כאן.` : undefined,
    });
  }

  const focus = asArray(a.mechina_focus);
  if (focus.length > 0 && inst.pathway === "mechina") {
    const hits = focus.filter((f) => MECHINA_FOCUS_MATCH[f]?.(inst));
    out.push({
      score: 0.2 + 0.8 * (hits.length / focus.length),
      weight: 1.5,
      reason: hits.length > 0 ? `במכינה חיפשת דגש על ${listHe(hits.map((h) => optionLabel("mechina_focus", h)))}.` : undefined,
    });
  }
  return out;
}

const BALANCE_TARGET: Record<string, number> = { more_torah: 0.2, balanced: 0.45, more_service: 0.75 };

function militarySignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const p = inst.attributes;

  const mf = single(a, "military_feeling");
  if (mf && !["uncertain", "individual"].includes(mf)) {
    let s = 0.5;
    if (mf === "motivated") s = 0.2 + 0.8 * (p.militaryEmphasis / 4);
    if (mf === "serve_with_torah")
      s =
        p.militaryModel === "hesder" || p.militaryModel === "shiluv"
          ? 1
          : p.militaryModel === "individual"
            ? 0.7
            : p.militaryModel === "pre_military" && p.torahIntensity >= 3
              ? 0.6
              : p.militaryModel === "unknown"
                ? 0.3
                : 0.25;
    if (mf === "prep_first") s = p.militaryModel === "pre_military" ? 1 : p.militaryModel === "shiluv" ? 0.4 : 0.3;
    out.push({
      score: s,
      weight: 3,
      reason: s >= 0.8 ? `לגבי השירות אמרת: ״${optionLabel("military_feeling", mf)}״ — והמסגרת בנויה לכך.` : undefined,
      concern:
        s <= 0.35
          ? p.militaryModel === "unknown"
            ? "לא אימתנו איך משתלב כאן השירות הצבאי — חשוב לברר."
            : "הדרך שבה המסגרת משלבת שירות צבאי שונה ממה שתיארת."
          : undefined,
    });
  }

  const interests = asArray(a.service_interest).filter((x) => x !== "dont_know");
  if (interests.length > 0) {
    if (p.serviceInterests.length === 0) {
      out.push({ score: 0.25, weight: 2, concern: "המסגרת לא מתמקדת בהכנה לתחומי השירות שעניינו אותך." });
    } else {
      const o = overlapScore(interests, p.serviceInterests)!;
      out.push({
        score: o.score,
        weight: 2,
        reason:
          o.hits.length > 0
            ? `התעניינת ב${listHe(o.hits.map((h) => optionLabel("service_interest", h)))} — כיוון שמתאים למסגרת הזו.`
            : undefined,
      });
    }
  }

  const hb = single(a, "hesder_balance");
  if (hb && p.torahServiceBalance !== null) {
    const s = clamp01(1 - Math.abs(BALANCE_TARGET[hb] - p.torahServiceBalance) * 1.6);
    out.push({
      score: s,
      weight: 1.5,
      reason: s >= 0.8 ? `האיזון בין לימוד לשירות כאן קרוב למה שביקשת (${optionLabel("hesder_balance", hb)}).` : undefined,
      concern: s <= 0.4 ? "האיזון בין לימוד לשירות כאן שונה ממה שביקשת." : undefined,
    });
  }
  return out;
}

function locationSignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const p = inst.attributes;
  const regions = asArray(a.region);
  const concrete = regions.filter((r) => r !== "anywhere" && r !== "near_home");

  if (concrete.length > 0 && !regions.includes("anywhere")) {
    const nationwide = inst.regions.includes("nationwide");
    const hit = inst.regions.some((r) => concrete.includes(r));
    out.push({
      score: hit ? 1 : nationwide ? 0.85 : 0.15,
      weight: 2,
      reason: hit ? `המיקום (${inst.locationLabel}) נמצא באזור שהעדפת.` : undefined,
      concern: !hit && !nationwide ? `המיקום (${inst.locationLabel}) מחוץ לאזורים שהעדפת.` : undefined,
    });
  }

  const la = single(a, "living_away");
  if (la === "yes" || la === "prefer_not") {
    const s = la === "yes" ? (p.residential === "residential" ? 1 : 0.8) : p.residential === "residential" ? 0.3 : 0.6;
    out.push({
      score: s,
      weight: 1,
      concern: s <= 0.3 ? "זו מסגרת עם מגורים במקום, וציינת שעדיף לך לא לגור מחוץ לבית." : undefined,
    });
  }
  return out;
}

function socialSignals(inst: Institution, a: Answers): Signal[] {
  const p = inst.attributes;
  const so = single(a, "social");
  if (!so || so === "no_pref") return [];
  let s: number | null = null;
  if (so === "small") s = { small: 1, medium: 0.7, large: 0.3 }[p.communitySize as string] ?? null;
  if (so === "large") s = { large: 1, medium: 0.6, small: 0.3 }[p.communitySize as string] ?? null;
  if (so === "structured") s = p.environmentStyles.includes("structure") ? 1 : 0.4;
  if (so === "independent")
    s = p.environmentStyles.includes("freedom") || p.environmentStyles.includes("mentorship") ? 1 : 0.45;
  if (s === null) return [];
  return [
    {
      score: s,
      weight: 1,
      reason: s >= 0.9 ? `העדפת ${optionLabel("social", so)} — וזה אופי המקום.` : undefined,
      concern: s <= 0.35 ? `העדפת ${optionLabel("social", so)}, והאופי כאן שונה.` : undefined,
    },
  ];
}

const DURATION_SCORE: Record<string, Record<string, number>> = {
  short: { short: 1, one_year: 0.8, multi_year: 0.2 },
  one_year: { one_year: 1, short: 0.7, multi_year: 0.3 },
  multi_year: { multi_year: 1, one_year: 0.4, short: 0.2 },
};

function practicalSignals(inst: Institution, a: Answers): Signal[] {
  const out: Signal[] = [];
  const p = inst.attributes;

  const du = single(a, "duration");
  const ds = du ? DURATION_SCORE[du]?.[p.duration] : undefined;
  if (du && ds !== undefined) {
    out.push({
      score: ds,
      weight: 1,
      concern: ds <= 0.3 ? `משך המסגרת שונה ממה שציינת (${optionLabel("duration", du)}).` : undefined,
    });
  }

  if (single(a, "budget") === "scholarships" && inst.pathway === "mechina") {
    out.push({ score: 0.8, weight: 1, reason: "לפי ״כל־זכות״, למכינות יש תוכניות מלגה וסיוע למי שזקוק." });
  }

  const pr = overlapScore(asArray(a.priorities), p.strengths);
  if (pr) {
    out.push({
      score: pr.score,
      weight: 2,
      reason:
        pr.hits.length > 0
          ? `מה שהכי חשוב לך — ${listHe(pr.hits.map((h) => optionLabel("priorities", h)))} — הוא מהחוזקות של המסגרת.`
          : undefined,
    });
  }
  return out;
}

const BUILDERS: Record<ComponentKey, (i: Institution, a: Answers) => Signal[]> = {
  pathway: pathwaySignals,
  education: educationSignals,
  development: developmentSignals,
  military: militarySignals,
  location: locationSignals,
  social: socialSignals,
  practical: practicalSignals,
};

// ───────────────────────── Unknowns & verification ─────────────────────────

const VERIFY_BY_PATHWAY: Record<Pathway, string[]> = {
  idf: ["מה דרישות הסף והמבדקים לתפקידים שמעניינים אותך", "לוחות הזמנים של תהליך הגיוס"],
  mechina: ["מועדי ההרשמה ותהליך המיון", "עלות ההשתתפות ואפשרויות מלגה", "איך נראה שבוע טיפוסי"],
  hesder: ["באיזה מסלול הסדר פועלת הישיבה ומה משך השירות", "תהליך הקבלה ומועדי שבתות פתוחות", "סדר היום ותנאי המגורים"],
  yeshiva: ["איך משתלב השירות הצבאי, אם בכלל", "תהליך הקבלה", "סדר היום ותנאי המגורים"],
};

function unknownsFor(inst: Institution): string[] {
  const u: string[] = [];
  if (inst.verificationStatus !== "verified") u.push("חלק מהפרטים מבוססים על מקור משני ולא על האתר הרשמי.");
  if (!inst.website) u.push("האתר הרשמי טרם אומת.");
  if (!inst.contact || (inst.contact.phone.length === 0 && !inst.contact.email)) u.push("פרטי קשר רשמיים טרם אומתו.");
  if (!inst.profile.financial && inst.pathway !== "idf") u.push("עלויות ומלגות — המידע עדיין לא אומת.");
  if (!inst.profile.admissions && inst.pathway !== "idf") u.push("תנאי קבלה — המידע עדיין לא אומת.");
  if (inst.attributes.audience === "unknown") u.push("לא אימתנו למי מיועדת המסגרת (בנים, בנות או שניהם).");
  return u;
}

// ───────────────────────── Scoring ─────────────────────────

export function scoreInstitution(inst: Institution, a: Answers, config: EngineConfig = DEFAULT_CONFIG): Recommendation {
  const components: ComponentResult[] = COMPONENT_KEYS.map((key) => {
    const signals = BUILDERS[key](inst, a);
    const w = signals.reduce((s, x) => s + x.weight, 0);
    const score = w > 0 ? signals.reduce((s, x) => s + x.score * x.weight, 0) / w : null;
    return { key, score, weight: config.weights[key], signals };
  });

  const answered = components.filter((c) => c.score !== null);
  const totalWeight = COMPONENT_KEYS.reduce((s, k) => s + config.weights[k], 0);
  const answeredWeight = answered.reduce((s, c) => s + c.weight, 0);
  const raw = answeredWeight > 0 ? answered.reduce((s, c) => s + c.score! * c.weight, 0) / answeredWeight : 0;

  // Rank explanation text by its actual contribution to the total.
  const contribution = (c: ComponentResult, sig: Signal) => {
    const w = c.signals.reduce((s, x) => s + x.weight, 0);
    return (c.weight * sig.weight * sig.score) / (w || 1);
  };
  const reasons = components
    .flatMap((c) => c.signals.filter((s) => s.reason && s.score >= 0.75).map((s) => ({ text: s.reason!, v: contribution(c, s) * (s.generic ? 0.2 : 1) })))
    .sort((x, y) => y.v - x.v)
    .map((r) => r.text);
  const concerns = components
    .flatMap((c) =>
      c.signals
        .filter((s) => s.concern && s.score <= 0.45)
        .map((s) => ({ text: s.concern!, v: (c.weight * s.weight * (1 - s.score)) / (c.signals.reduce((t, x) => t + x.weight, 0) || 1) })),
    )
    .sort((x, y) => y.v - x.v)
    .map((r) => r.text);

  return {
    institution: inst,
    score: Math.round(raw * 100),
    coverage: totalWeight > 0 ? answeredWeight / totalWeight : 0,
    components,
    reasons: dedupe(reasons),
    concerns: dedupe([...concerns, ...inst.limitations]),
    unknowns: unknownsFor(inst),
    verify: VERIFY_BY_PATHWAY[inst.pathway],
  };
}

const dedupe = (xs: string[]) => [...new Set(xs)];

export function match(catalog: Institution[], a: Answers, config: EngineConfig = DEFAULT_CONFIG): MatchResult {
  const excluded: Exclusion[] = [];
  const eligible: Institution[] = [];
  for (const inst of catalog) {
    // Unpublished or unverified records never reach users.
    if (!inst.published || inst.verificationStatus === "unverified") continue;
    const reason = hardConstraint(inst, a);
    if (reason) excluded.push({ institution: inst, reason });
    else eligible.push(inst);
  }

  const ranked = eligible
    .map((i) => scoreInstitution(i, a, config))
    .sort((x, y) => y.score - x.score || x.institution.id.localeCompare(y.institution.id));

  // Prefer variety across pathways when the user is open to more than one.
  const specific = asArray(a.paths).filter((p) => ["idf", "mechina", "hesder", "yeshiva"].includes(p));
  const wantsVariety = specific.length !== 1;
  const pool = ranked.filter((r) => r.score >= config.minScore);
  const chosen: Recommendation[] = [];
  while (chosen.length < config.maxResults && pool.length > 0) {
    let bestIdx = 0;
    let bestAdj = -Infinity;
    pool.forEach((r, idx) => {
      const same = chosen.filter((c) => c.institution.pathway === r.institution.pathway).length;
      const adj = r.score - (wantsVariety ? same * config.diversityPenalty : 0);
      if (adj > bestAdj) {
        bestAdj = adj;
        bestIdx = idx;
      }
    });
    chosen.push(pool.splice(bestIdx, 1)[0]);
  }
  chosen.sort((x, y) => y.score - x.score);

  const coverage = ranked[0]?.coverage ?? 0;
  const lowConfidence = coverage < config.lowCoverage;
  const needsGuidance = single(a, "military_feeling") === "individual" || single(a, "religious_env") === "advisor";

  let limitation: string | undefined;
  if (chosen.length === 0) {
    limitation =
      "לא מצאנו כרגע אפשרות מאומתת שמתאימה מספיק להעדפות שציינת. אפשר לשנות חלק מהתשובות, או להתייעץ עם יועץ או גורם מקצועי.";
  } else if (chosen.length < config.maxResults) {
    limitation = `מצאנו ${chosen.length === 1 ? "אפשרות אחת" : "שתי אפשרויות"} שמתאימות מספיק. לא נציג התאמות חלשות רק כדי למלא שלושה מקומות.`;
  }

  return { recommendations: chosen, ranked, excluded, lowConfidence, needsGuidance, limitation };
}
