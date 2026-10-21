/**
 * Questionnaire definition. Pure data + visibility rules, no UI.
 * Option ids are stable keys used by the matching engine; labels are Hebrew UI copy.
 */

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type QuestionKind = "single" | "multi" | "text";

export interface Option {
  id: string;
  label: string;
  hint?: string;
  /** Icon name from lucide-react, resolved in the UI layer. */
  icon?: string;
}

export interface Question {
  id: string;
  section: SectionId;
  kind: QuestionKind;
  title: string;
  subtitle?: string;
  options?: Option[];
  maxSelections?: number;
  optional?: boolean;
  /** When set, the question is shown only if this returns true. */
  showIf?: (answers: Answers) => boolean;
  /** Placeholder for free text. */
  placeholder?: string;
}

export type SectionId = "situation" | "religious" | "military" | "development" | "lifestyle" | "practical";

export const SECTIONS: Record<SectionId, string> = {
  situation: "איפה אתה עומד",
  religious: "לימוד ואווירה",
  military: "שירות",
  development: "צמיחה אישית",
  lifestyle: "מקום ואורח חיים",
  practical: "שיקולים מעשיים",
};

export const asArray = (v: AnswerValue | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const pathsInclude = (a: Answers, id: string) => asArray(a.paths).includes(id);

/** True when the user hasn't committed to specific pathways. */
export const isUndecided = (a: Answers): boolean => {
  const p = asArray(a.paths);
  const specific = p.filter((x) => x !== "not_sure" && x !== "open");
  return specific.length === 0 || p.includes("not_sure");
};

export const QUESTIONS: Question[] = [
  // ── A. Current situation ──
  {
    id: "stage",
    section: "situation",
    kind: "single",
    title: "איפה אתה נמצא היום?",
    subtitle: "זה עוזר לנו להבין כמה זמן יש לך לבדוק אפשרויות.",
    options: [
      { id: "grade11", label: "כיתה י״א", icon: "BookOpen" },
      { id: "grade12", label: "כיתה י״ב", icon: "GraduationCap" },
      { id: "graduated", label: "סיימתי תיכון", icon: "Flag" },
      { id: "changing", label: "כבר במסגרת ושוקל שינוי", icon: "RefreshCw" },
      { id: "other", label: "אחר", icon: "MoreHorizontal" },
    ],
  },
  {
    id: "audience",
    section: "situation",
    kind: "single",
    optional: true,
    title: "לאילו מסגרות לחפש?",
    subtitle: "חלק מהמסגרות מיועדות לבנים בלבד או לבנות בלבד. אפשר לדלג.",
    options: [
      { id: "men", label: "מסגרות לבנים" },
      { id: "women", label: "מסגרות לבנות" },
      { id: "any", label: "לא משנה / מעדיף לא לציין" },
    ],
  },
  {
    id: "paths",
    section: "situation",
    kind: "multi",
    title: "אילו כיוונים אתה שוקל כרגע?",
    subtitle: "אפשר לבחור כמה. אין תשובה לא נכונה.",
    options: [
      { id: "idf", label: "שירות צבאי", icon: "Shield" },
      { id: "mechina", label: "מכינה קדם־צבאית", icon: "Compass" },
      { id: "hesder", label: "ישיבת הסדר", icon: "BookMarked" },
      { id: "yeshiva", label: "ישיבה גבוהה", icon: "Library" },
      { id: "not_sure", label: "עוד לא יודע", icon: "HelpCircle" },
      { id: "open", label: "פתוח לכמה אפשרויות", icon: "Shuffle" },
    ],
  },
  {
    id: "undecided_next_year",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: isUndecided,
    title: "דמיין את השנה הבאה. מה הכי מושך אותך?",
    subtitle: "בלי להתחייב — רק כדי להבין מה מדבר אליך.",
    options: [
      { id: "beit_midrash", label: "ללמוד בבית מדרש, עם זמן להעמיק", icon: "BookOpen" },
      { id: "group_prep", label: "להתכונן עם קבוצה לשירות ולחיים", icon: "Users" },
      { id: "start_service", label: "להתחיל כבר את השירות", icon: "Shield" },
      { id: "combination", label: "שילוב של לימוד ושירות", icon: "Layers" },
    ],
  },
  {
    id: "hesder_balance",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: (a) => pathsInclude(a, "hesder"),
    title: "בישיבת הסדר — איזה איזון בין לימוד לשירות מתאים לך?",
    options: [
      { id: "more_torah", label: "יותר זמן לימוד", hint: "מסלול הסדר קלאסי או ארוך" },
      { id: "balanced", label: "איזון בין השניים" },
      { id: "more_service", label: "שירות ארוך יותר", hint: "למשל מסלולי שילוב" },
    ],
  },
  {
    id: "mechina_focus",
    section: "situation",
    kind: "multi",
    maxSelections: 3,
    optional: true,
    showIf: (a) => pathsInclude(a, "mechina"),
    title: "במכינה — על מה הכי חשוב לך שיהיה דגש?",
    subtitle: "עד 3 בחירות.",
    options: [
      { id: "leadership", label: "מנהיגות ואחריות", icon: "Star" },
      { id: "physical", label: "הכנה גופנית לשירות", icon: "Dumbbell" },
      { id: "volunteering", label: "התנדבות ועשייה בקהילה", icon: "HeartHandshake" },
      { id: "identity", label: "לימוד וזהות יהודית", icon: "BookOpen" },
    ],
  },
  {
    id: "mechina_group",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: (a) => pathsInclude(a, "mechina"),
    title: "איזו קבוצה במכינה מתאימה לך?",
    options: [
      { id: "religious_group", label: "קבוצה דתית" },
      { id: "mixed_group", label: "קבוצה מעורבת — דתיים, מסורתיים וחילונים" },
      { id: "no_pref", label: "לא משנה לי" },
    ],
  },
  {
    id: "yeshiva_style",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: (a) => pathsInclude(a, "yeshiva"),
    title: "בישיבה גבוהה — מה הכי חשוב לך?",
    options: [
      { id: "very_intensive", label: "לימוד אינטנסיבי מאוד, מהבוקר עד הלילה" },
      { id: "breadth", label: "לימוד רחב — גמרא, תנ״ך ומחשבה" },
      { id: "mentorship", label: "קשר אישי קרוב עם רב" },
    ],
  },
  {
    id: "idf_guidance",
    section: "situation",
    kind: "multi",
    optional: true,
    showIf: (a) => pathsInclude(a, "idf"),
    title: "לקראת גיוס ישיר — במה תרצה עזרה?",
    subtitle: "נשתמש בזה כדי להציע צעדים הבאים.",
    options: [
      { id: "roles", label: "להבין אילו תפקידים קיימים" },
      { id: "physical", label: "להתכונן גופנית" },
      { id: "process", label: "להבין את תהליך הגיוס" },
      { id: "talk", label: "לדבר עם מישהו שמכיר" },
    ],
  },

  // ── B. Religious and educational preferences ──
  {
    id: "torah_importance",
    section: "religious",
    kind: "single",
    optional: true,
    title: "כמה חשוב לך לימוד תורה קבוע במסגרת הבאה?",
    subtitle: "זו העדפה, לא שיפוט. אפשר לדלג.",
    options: [
      { id: "central", label: "חלק מרכזי בסדר היום שלי" },
      { id: "alongside", label: "חשוב, לצד דברים אחרים" },
      { id: "explore", label: "רוצה לבדוק ולמצוא את האיזון" },
      { id: "not_major", label: "לא שיקול מרכזי כרגע" },
    ],
  },
  {
    id: "learning_env",
    section: "religious",
    kind: "single",
    title: "איזו סביבה לימודית מושכת אותך יותר?",
    options: [
      { id: "intensive_torah", label: "לימוד תורה אינטנסיבי ומסורתי", icon: "BookMarked" },
      { id: "torah_and_service", label: "לימוד תורה בשילוב שירות צבאי", icon: "Layers" },
      { id: "structured_development", label: "מסגרת חינוכית עם התפתחות אישית", icon: "Sprout" },
      { id: "practical_service", label: "סביבה מעשית, של שירות ועשייה", icon: "Hammer" },
      { id: "not_sure", label: "עוד לא בטוח", icon: "HelpCircle" },
    ],
  },
  {
    id: "religious_env",
    section: "religious",
    kind: "single",
    optional: true,
    title: "איזו אווירה דתית אתה מחפש?",
    subtitle: "שאלה אופציונלית. התשובה משמשת רק להתאמה.",
    options: [
      { id: "religious_zionist", label: "ציונות דתית" },
      { id: "open_religious", label: "דתי־לאומי באווירה פתוחה יותר" },
      { id: "exploring", label: "מסורתי או עדיין מחפש" },
      { id: "other", label: "סביבה אחרת שמתאימה לי" },
      { id: "advisor", label: "מעדיף לדבר על זה עם יועץ" },
    ],
  },

  // ── C. Military service ──
  {
    id: "military_feeling",
    section: "military",
    kind: "single",
    title: "איך אתה מרגיש כרגע לגבי שירות צבאי?",
    options: [
      { id: "motivated", label: "יש לי מוטיבציה לשרת", icon: "Shield" },
      { id: "serve_with_torah", label: "רוצה לשרת ולהמשיך ללמוד תורה", icon: "Layers" },
      { id: "prep_first", label: "שוקל קודם תוכנית הכנה", icon: "Compass" },
      { id: "uncertain", label: "לא בטוח, רוצה להבין את האפשרויות", icon: "HelpCircle" },
      { id: "individual", label: "יש לי נסיבות שדורשות ליווי אישי", icon: "UserRound" },
    ],
  },
  {
    id: "service_interest",
    section: "military",
    kind: "multi",
    maxSelections: 3,
    optional: true,
    title: "מה הכי מעניין אותך בשירות?",
    subtitle: "עד 3 בחירות. השיבוץ בפועל נקבע על ידי צה״ל לפי דרישות ומבדקים רשמיים.",
    options: [
      { id: "combat", label: "לחימה ותפקידי שטח", icon: "Mountain" },
      { id: "tech_intel", label: "טכנולוגיה, מודיעין או סייבר", icon: "Cpu" },
      { id: "leadership_command", label: "פיקוד ומנהיגות", icon: "Star" },
      { id: "education_community", label: "חינוך, אנשים וקהילה", icon: "Users" },
      { id: "professional_technical", label: "תפקידים מקצועיים או טכניים", icon: "Wrench" },
      { id: "other_meaningful", label: "שירות משמעותי בתחום אחר", icon: "Heart" },
      { id: "dont_know", label: "עוד לא יודע", icon: "HelpCircle" },
    ],
  },

  // ── D. Personal development ──
  {
    id: "dev_goals",
    section: "development",
    kind: "multi",
    maxSelections: 3,
    title: "מה הכי היית רוצה לפתח בשנה הקרובה?",
    subtitle: "עד 3 בחירות.",
    options: [
      { id: "independence", label: "עצמאות ובגרות", icon: "Key" },
      { id: "leadership", label: "מנהיגות ואחריות", icon: "Star" },
      { id: "torah_growth", label: "ידע תורני וצמיחה רוחנית", icon: "BookOpen" },
      { id: "fitness", label: "כושר גופני וחוסן", icon: "Dumbbell" },
      { id: "professional", label: "מיומנויות מקצועיות וטכנולוגיות", icon: "Cpu" },
      { id: "social", label: "ביטחון חברתי וחברויות", icon: "Users" },
      { id: "clarity", label: "בהירות לגבי העתיד", icon: "Compass" },
    ],
  },
  {
    id: "best_env",
    section: "development",
    kind: "multi",
    maxSelections: 2,
    title: "באיזו סביבה אתה במיטבך?",
    subtitle: "עד 2 בחירות.",
    options: [
      { id: "structure", label: "מבנה ברור ומשמעת" },
      { id: "freedom", label: "חופש אישי ועצמאות" },
      { id: "mentorship", label: "ליווי אישי קרוב" },
      { id: "teamwork", label: "עבודת צוות וקהילה" },
      { id: "challenge", label: "אתגרים ואחריות" },
      { id: "combination", label: "שילוב של כמה מאלה" },
    ],
  },
  {
    id: "learn_pref",
    section: "development",
    kind: "single",
    title: "איך אתה הכי אוהב ללמוד?",
    options: [
      { id: "intensive_study", label: "לימוד מעמיק ואינטנסיבי" },
      { id: "experiential", label: "דרך התנסות" },
      { id: "practical", label: "פרויקטים וסדנאות מעשיות" },
      { id: "discussion", label: "דיון ולמידה בקבוצה" },
      { id: "mix", label: "שילוב של עיון ומעשה" },
    ],
  },

  // ── E. Lifestyle and location ──
  {
    id: "region",
    section: "lifestyle",
    kind: "multi",
    optional: true,
    title: "באיזה אזור היית מעדיף להיות?",
    subtitle: "אפשר לבחור כמה.",
    options: [
      { id: "north", label: "צפון" },
      { id: "center", label: "מרכז" },
      { id: "jerusalem", label: "ירושלים והסביבה" },
      { id: "south", label: "דרום" },
      { id: "judea_samaria", label: "יהודה ושומרון" },
      { id: "anywhere", label: "בכל מקום בארץ" },
      { id: "near_home", label: "עדיף קרוב לבית" },
    ],
  },
  {
    id: "living_away",
    section: "lifestyle",
    kind: "single",
    optional: true,
    title: "האם מגורים מחוץ לבית מתאימים לך?",
    options: [
      { id: "yes", label: "כן" },
      { id: "prefer_not", label: "עדיף שלא" },
      { id: "depends", label: "תלוי במסגרת" },
      { id: "not_sure", label: "עוד לא בטוח" },
    ],
  },
  {
    id: "social",
    section: "lifestyle",
    kind: "single",
    optional: true,
    title: "איזו סביבה חברתית אתה מעדיף?",
    options: [
      { id: "small", label: "קהילה קטנה ומגובשת" },
      { id: "large", label: "קהילה גדולה ומגוונת" },
      { id: "structured", label: "סביבה מובנית מאוד" },
      { id: "independent", label: "סביבה עצמאית עם ליווי" },
      { id: "no_pref", label: "אין לי העדפה חזקה" },
    ],
  },
  {
    id: "duration",
    section: "lifestyle",
    kind: "single",
    optional: true,
    title: "לכמה זמן אתה רואה את עצמך במסגרת?",
    options: [
      { id: "short", label: "תקופת הכנה קצרה" },
      { id: "one_year", label: "בערך שנה" },
      { id: "multi_year", label: "כמה שנים" },
      { id: "depends", label: "תלוי במסלול" },
      { id: "help", label: "צריך עזרה להבין את ההבדלים" },
    ],
  },

  // ── F. Practical considerations ──
  {
    id: "budget",
    section: "practical",
    kind: "single",
    optional: true,
    title: "יש שיקול כלכלי שכדאי שנתחשב בו?",
    options: [
      { id: "low_cost", label: "מעדיף אפשרויות בעלות נמוכה" },
      { id: "scholarships", label: "מלגות או סיוע כלכלי חשובים לי" },
      { id: "flexible", label: "גמיש, תלוי במסגרת" },
      { id: "none", label: "אין העדפה מיוחדת" },
      { id: "skip", label: "מעדיף לא לענות" },
    ],
  },
  {
    id: "priorities",
    section: "practical",
    kind: "multi",
    maxSelections: 3,
    title: "מה הכי חשוב לך כשאתה בוחר מקום?",
    subtitle: "עד 3 בחירות.",
    options: [
      { id: "torah_quality", label: "איכות לימוד התורה" },
      { id: "military_prep", label: "הכנה לצבא" },
      { id: "personal_attention", label: "יחס אישי" },
      { id: "leadership", label: "פיתוח מנהיגות" },
      { id: "community", label: "קהילה וחברים" },
      { id: "location", label: "מיקום" },
      { id: "academic_professional", label: "התפתחות אקדמית או מקצועית" },
      { id: "spiritual_atmosphere", label: "אווירה רוחנית" },
      { id: "alumni", label: "ניסיון של בוגרים" },
      { id: "guidance", label: "ליווי ותמיכה מעשית" },
    ],
  },
  {
    id: "free_text",
    section: "practical",
    kind: "text",
    optional: true,
    title: "יש משהו שחשוב לך שנדע כדי למצוא לך התאמה טובה יותר?",
    subtitle: "לא חובה. אל תכתוב כאן פרטים מזהים או מידע רפואי.",
    placeholder: "למשל: חשוב לי מקום עם הרבה טבע, או שאני רוצה להמשיך לנגן…",
  },
];

/** The ordered list of questions that apply to the given answers. */
export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** Remove answers to questions that are no longer visible (e.g. after changing `paths`). */
export function pruneAnswers(answers: Answers): Answers {
  const visible = new Set(visibleQuestions(answers).map((q) => q.id));
  return Object.fromEntries(Object.entries(answers).filter(([k]) => visible.has(k)));
}

export function isAnswered(q: Question, answers: Answers): boolean {
  const v = answers[q.id];
  if (v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

export function optionLabel(questionId: string, optionId: string): string {
  const q = QUESTIONS.find((x) => x.id === questionId);
  return q?.options?.find((o) => o.id === optionId)?.label ?? optionId;
}
