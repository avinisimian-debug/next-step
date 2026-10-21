import type { Institution } from "@/lib/domain/types";
import type { MatchResult, Recommendation } from "@/lib/matching/engine";
import { asArray, type Answers } from "@/lib/questionnaire/questions";

/**
 * Deterministic personal action plan built from the engine's recommendations and the
 * user's answers. Steps only reference facts present in the catalog or its cited sources;
 * everything else is phrased as something to find out.
 */

export interface PlanStep {
  /** Stable id, used to persist check-off state. */
  id: string;
  text: string;
  href?: string;
  /** Where a stated fact comes from, shown next to the step. */
  source?: string;
}

export interface PlanSection {
  id: string;
  title: string;
  subtitle?: string;
  steps: PlanStep[];
}

const IDF_SERVICE_URL = "https://www.idf.il/השירות-שלי/";
const IDF_TYPES_URL = "https://www.idf.il/השירות-שלי/סוגי-השירות-בצה-ל/";

function timingStep(answers: Answers): PlanStep | null {
  const stage = answers.stage;
  if (stage === "grade11")
    return { id: "timing", text: "יש לך זמן: אפשר להתחיל להכיר מקומות כבר השנה — אתרים, שבתות וימים פתוחים — בלי לחץ להחליט." };
  if (stage === "grade12")
    return { id: "timing", text: "בכיתה י״ב מתקיימים רוב תהליכי ההרשמה והמיון. כדאי לבדוק כבר עכשיו את המועדים של המקומות שמעניינים אותך." };
  if (stage === "graduated" || stage === "changing")
    return { id: "timing", text: "כדאי לפנות ישירות למסגרות ולשאול אם אפשר להצטרף באמצע השנה או במחזור הבא." };
  return null;
}

function institutionSteps(rec: Recommendation): PlanStep[] {
  const inst: Institution = rec.institution;
  const steps: PlanStep[] = [];
  const id = (k: string) => `${inst.id}:${k}`;

  if (inst.website) steps.push({ id: id("website"), text: "לעבור על האתר הרשמי", href: inst.website });
  else steps.push({ id: id("website"), text: "לאתר את האתר הרשמי ולוודא שהפרטים כאן נכונים" });

  const phone = inst.contact?.phone[0];
  const email = inst.contact?.email;
  if (inst.kind === "institution") {
    if (phone || email)
      steps.push({
        id: id("contact"),
        text: `ליצור קשר ולשאול על ביקור או שבת פתוחה${phone ? ` — ${phone}` : ""}${email ? ` · ${email}` : ""}`,
      });
    else steps.push({ id: id("contact"), text: "למצוא פרטי קשר רשמיים ולשאול על ביקור או שבת פתוחה" });
  }

  if (inst.id === "idf-midrasha-garin")
    steps.push({
      id: id("deadline"),
      text: "לפי משרד הביטחון, ההרשמה נעשית דרך נציגות המדרשות עד 31 במרץ — לוודא את המועד העדכני",
      source: "משרד הביטחון",
    });
  else if (inst.pathway === "mechina")
    steps.push({
      id: id("deadline"),
      text: "ההרשמה למכינות נעשית בדרך כלל במהלך י״ב, בין ספטמבר למרץ, דרך מערכת ההרשמה של מועצת המכינות — לוודא מול המכינה",
      href: "https://www.kolzchut.org.il/he/מכינה_קדם_צבאית",
      source: "כל־זכות",
    });

  rec.verify.forEach((v, i) => steps.push({ id: id(`verify-${i}`), text: `לברר: ${v}` }));
  return steps;
}

const IDF_GUIDANCE: Record<string, PlanStep> = {
  roles: { id: "idf:roles", text: "לקרוא על סוגי השירות באתר צה״ל", href: IDF_TYPES_URL, source: "צה״ל" },
  process: { id: "idf:process", text: "לקרוא על תהליך הגיוס במדור ״השירות שלי״ באתר צה״ל", href: IDF_SERVICE_URL, source: "צה״ל" },
  physical: { id: "idf:physical", text: "לבנות שגרת כושר הדרגתית, בהתייעצות עם מאמן או גורם מקצועי" },
  talk: { id: "idf:talk", text: "לשוחח עם יועץ/ת בית הספר, ועם חיילים או בוגרים שאתה מכיר, על התפקידים שמעניינים אותך" },
};

export function buildActionPlan(result: MatchResult, answers: Answers): PlanSection[] {
  const sections: PlanSection[] = [];

  const start: PlanStep[] = [];
  const timing = timingStep(answers);
  if (timing) start.push(timing);
  start.push({ id: "talk-home", text: "לשתף את ההמלצות עם ההורים או עם מישהו שמכיר אותך טוב, ולשמוע מה הם חושבים" });
  if (result.needsGuidance)
    start.push({ id: "guidance", text: "לקבוע שיחה עם יועץ/ת בית הספר או גורם מקצועי — ציינת שליווי אישי חשוב לך" });
  if (result.lowConfidence)
    start.push({ id: "complete", text: "להשלים עוד שאלות בשאלון כדי לקבל התאמה מדויקת יותר", href: "/questionnaire?edit=1" });
  if (result.recommendations.length > 1)
    start.push({ id: "compare", text: "להשוות בין הכיוונים ולסמן מה הכי חשוב לך בכל אחד", href: "/compare" });
  sections.push({ id: "start", title: "מתחילים", steps: start });

  for (const rec of result.recommendations) {
    sections.push({
      id: rec.institution.id,
      title: rec.institution.name,
      subtitle: rec.institution.typeLabel,
      steps: institutionSteps(rec),
    });
  }

  const guidance = asArray(answers.idf_guidance)
    .map((g) => IDF_GUIDANCE[g])
    .filter((s): s is PlanStep => Boolean(s));
  if (guidance.length > 0) sections.push({ id: "idf", title: "לקראת גיוס", steps: guidance });

  return sections;
}

export const allStepIds = (plan: PlanSection[]) => plan.flatMap((s) => s.steps.map((x) => x.id));
