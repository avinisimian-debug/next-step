import type { Gender } from "@/lib/domain/types";

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
  /** Wording when the questionnaire is filled in for a girl. */
  labelF?: string;
  /** Shown only for this gender (answer to `audience`). */
  for?: Gender;
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
  /** Wording when the questionnaire is filled in for a girl. */
  titleF?: string;
  subtitleF?: string;
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

/** The gender the questionnaire is filled in for, from the first question. */
export const genderOf = (a: Answers): Gender | undefined =>
  a.audience === "men" || a.audience === "women" ? a.audience : undefined;
const isGirl = (a: Answers) => genderOf(a) === "women";

/** True when the user hasn't committed to specific pathways. */
export const isUndecided = (a: Answers): boolean => {
  const p = asArray(a.paths);
  const specific = p.filter((x) => x !== "not_sure" && x !== "open");
  return specific.length === 0 || p.includes("not_sure");
};

export const QUESTIONS: Question[] = [
  // ── A. Current situation ──
  {
    id: "audience",
    section: "situation",
    kind: "single",
    title: "בשביל מי השאלון?",
    subtitle: "לבנים ולבנות יש מסלולים שונים אחרי י״ב, ולכן מתחילים מכאן.",
    options: [
      { id: "men", label: "בן", hint: "מכינות, ישיבות הסדר, ישיבות גבוהות וצה״ל" },
      { id: "women", label: "בת", hint: "שירות לאומי וקומונריות, מדרשות וסמינרים, מכינות לבנות וצה״ל" },
    ],
  },
  {
    id: "stage",
    section: "situation",
    kind: "single",
    title: "איפה אתה נמצא היום?",
    titleF: "איפה את נמצאת היום?",
    subtitle: "זה עוזר לנו להבין כמה זמן יש לך לבדוק אפשרויות.",
    options: [
      { id: "grade11", label: "כיתה י״א", icon: "BookOpen" },
      { id: "grade12", label: "כיתה י״ב", icon: "GraduationCap" },
      { id: "graduated", label: "סיימתי תיכון", icon: "Flag" },
      { id: "changing", label: "כבר במסגרת ושוקל שינוי", labelF: "כבר במסגרת ושוקלת שינוי", icon: "RefreshCw" },
      { id: "other", label: "אחר", icon: "MoreHorizontal" },
    ],
  },
  {
    id: "paths",
    section: "situation",
    kind: "multi",
    title: "אילו כיוונים אתה שוקל כרגע?",
    titleF: "אילו כיוונים את שוקלת כרגע?",
    subtitle: "אפשר לבחור כמה. אין תשובה לא נכונה.",
    options: [
      { id: "national_service", label: "שירות לאומי", hint: "כולל קומונריות בתנועות נוער", for: "women", icon: "HeartHandshake" },
      { id: "midrasha", label: "מדרשה או סמינר", for: "women", icon: "BookOpen" },
      { id: "idf", label: "שירות צבאי", icon: "Shield" },
      { id: "mechina", label: "מכינה קדם־צבאית", labelF: "מכינה קדם־צבאית לבנות", icon: "Compass" },
      { id: "hesder", label: "ישיבת הסדר", for: "men", icon: "BookMarked" },
      { id: "yeshiva", label: "ישיבה גבוהה", for: "men", icon: "Library" },
      { id: "not_sure", label: "עוד לא יודע", labelF: "עוד לא יודעת", icon: "HelpCircle" },
      { id: "open", label: "פתוח לכמה אפשרויות", labelF: "פתוחה לכמה אפשרויות", icon: "Shuffle" },
    ],
  },
  {
    id: "undecided_next_year",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: isUndecided,
    title: "דמיין את השנה הבאה. מה הכי מושך אותך?",
    titleF: "דמייני את השנה הבאה. מה הכי מושך אותך?",
    subtitle: "בלי להתחייב — רק כדי להבין מה מדבר אליך.",
    options: [
      { id: "beit_midrash", label: "ללמוד בבית מדרש, עם זמן להעמיק", icon: "BookOpen" },
      { id: "group_prep", label: "להתכונן עם קבוצה לשירות ולחיים", icon: "Users" },
      { id: "start_service", label: "להתחיל כבר את השירות", labelF: "להתחיל כבר לשרת, בצבא או בשירות לאומי", icon: "Shield" },
      { id: "give", label: "לתת שנה לקהילה ולחברה", for: "women", icon: "HeartHandshake" },
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

  {
    id: "ns_area",
    section: "situation",
    kind: "multi",
    maxSelections: 3,
    optional: true,
    showIf: (a) => pathsInclude(a, "national_service"),
    title: "בשירות לאומי — באיזה תחום היית רוצה לשרת?",
    subtitle: "עד 3 בחירות. השיבוץ בפועל נעשה דרך העמותה ולפי המקומות הפנויים.",
    options: [
      { id: "education", label: "חינוך — בית ספר, גן או פנימייה", icon: "GraduationCap" },
      { id: "youth", label: "תנועת נוער — קומונרית", icon: "Users" },
      { id: "health", label: "בריאות ורפואה", icon: "Heart" },
      { id: "welfare", label: "רווחה, קהילה ואוכלוסיות מיוחדות", icon: "HeartHandshake" },
      { id: "security", label: "ביטחון, משטרה והצלה", icon: "Shield" },
      { id: "abroad", label: "שליחות בקהילה יהודית בחו״ל", icon: "Compass" },
    ],
  },
  {
    id: "midrasha_mode",
    section: "situation",
    kind: "single",
    optional: true,
    showIf: (a) => pathsInclude(a, "midrasha"),
    title: "במדרשה — איזו מסגרת מתאימה לך?",
    options: [
      { id: "full_year", label: "שנה מלאה של לימוד", hint: "לפני השירות או אחריו" },
      { id: "shiluv", label: "מדרשת שילוב", hint: "לומדים לצד שירות לאומי, לימודים או עבודה" },
      { id: "before_army", label: "שנת הכנה לפני צבא", hint: "מדרשה או מכינה לבנות לפני גיוס" },
      { id: "no_pref", label: "עוד לא יודעת" },
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
      { id: "torah_and_service", label: "לימוד תורה בשילוב שירות צבאי", labelF: "לימוד תורה בשילוב שירות", icon: "Layers" },
      { id: "structured_development", label: "מסגרת חינוכית עם התפתחות אישית", icon: "Sprout" },
      { id: "practical_service", label: "סביבה מעשית, של שירות ועשייה", icon: "Hammer" },
      { id: "not_sure", label: "עוד לא בטוח", labelF: "עוד לא בטוחה", icon: "HelpCircle" },
    ],
  },
  {
    id: "religious_env",
    section: "religious",
    kind: "single",
    optional: true,
    title: "איזו אווירה דתית אתה מחפש?",
    titleF: "איזו אווירה דתית את מחפשת?",
    subtitle: "שאלה אופציונלית. התשובה משמשת רק להתאמה.",
    options: [
      { id: "religious_zionist", label: "ציונות דתית" },
      { id: "open_religious", label: "דתי־לאומי באווירה פתוחה יותר" },
      { id: "exploring", label: "מסורתי או עדיין מחפש", labelF: "מסורתית או עדיין מחפשת" },
      { id: "haredi", label: "חרדי" , labelF: "חרדית" },
      { id: "other", label: "סביבה אחרת שמתאימה לי" },
      { id: "advisor", label: "מעדיף לדבר על זה עם יועץ", labelF: "מעדיפה לדבר על זה עם יועצת" },
    ],
  },

  // ── C. Military service ──
  {
    id: "military_feeling",
    section: "military",
    kind: "single",
    title: "איך אתה מרגיש כרגע לגבי שירות צבאי?",
    titleF: "איך את מרגישה כרגע לגבי שירות — צבאי או לאומי?",
    options: [
      { id: "motivated", label: "יש לי מוטיבציה לשרת", labelF: "יש לי מוטיבציה לשרת בצבא", icon: "Shield" },
      { id: "national_service", label: "מעדיפה שירות לאומי", for: "women", icon: "HeartHandshake" },
      { id: "serve_with_torah", label: "רוצה לשרת ולהמשיך ללמוד תורה", icon: "Layers" },
      { id: "prep_first", label: "שוקל קודם תוכנית הכנה", labelF: "שוקלת קודם שנת מדרשה או מכינה", icon: "Compass" },
      { id: "uncertain", label: "לא בטוח, רוצה להבין את האפשרויות", labelF: "לא בטוחה, רוצה להבין את האפשרויות", icon: "HelpCircle" },
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
    subtitleF: "עד 3 בחירות, בצבא או בשירות לאומי. השיבוץ בפועל נקבע על ידי הגוף המשבץ.",
    options: [
      { id: "combat", label: "לחימה ותפקידי שטח", icon: "Mountain" },
      { id: "tech_intel", label: "טכנולוגיה, מודיעין או סייבר", icon: "Cpu" },
      { id: "leadership_command", label: "פיקוד ומנהיגות", icon: "Star" },
      { id: "education_community", label: "חינוך, אנשים וקהילה", icon: "Users" },
      { id: "professional_technical", label: "תפקידים מקצועיים או טכניים", icon: "Wrench" },
      { id: "other_meaningful", label: "שירות משמעותי בתחום אחר", icon: "Heart" },
      { id: "dont_know", label: "עוד לא יודע", labelF: "עוד לא יודעת", icon: "HelpCircle" },
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
    titleF: "באיזו סביבה את במיטבך?",
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
    titleF: "איך את הכי אוהבת ללמוד?",
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
    titleF: "באיזה אזור היית מעדיפה להיות?",
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
      { id: "not_sure", label: "עוד לא בטוח", labelF: "עוד לא בטוחה" },
    ],
  },
  {
    id: "social",
    section: "lifestyle",
    kind: "single",
    optional: true,
    title: "איזו סביבה חברתית אתה מעדיף?",
    titleF: "איזו סביבה חברתית את מעדיפה?",
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
    titleF: "לכמה זמן את רואה את עצמך במסגרת?",
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
      { id: "low_cost", label: "מעדיף אפשרויות בעלות נמוכה", labelF: "מעדיפה אפשרויות בעלות נמוכה" },
      { id: "scholarships", label: "מלגות או סיוע כלכלי חשובים לי" },
      { id: "flexible", label: "גמיש, תלוי במסגרת" },
      { id: "none", label: "אין העדפה מיוחדת" },
      { id: "skip", label: "מעדיף לא לענות", labelF: "מעדיפה לא לענות" },
    ],
  },
  {
    id: "priorities",
    section: "practical",
    kind: "multi",
    maxSelections: 3,
    title: "מה הכי חשוב לך כשאתה בוחר מקום?",
    titleF: "מה הכי חשוב לך כשאת בוחרת מקום?",
    subtitle: "עד 3 בחירות.",
    options: [
      { id: "torah_quality", label: "איכות לימוד התורה" },
      { id: "military_prep", label: "הכנה לצבא", labelF: "הכנה לשירות" },
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
    subtitleF: "לא חובה. אל תכתבי כאן פרטים מזהים או מידע רפואי.",
    placeholder: "למשל: חשוב לי מקום עם הרבה טבע, או שאני רוצה להמשיך לנגן…",
  },
];

/** The options of a question that apply to the chosen gender, in that gender's wording. */
function localizeOptions(options: Option[] | undefined, a: Answers): Option[] | undefined {
  const g = genderOf(a);
  return options
    ?.filter((o) => !o.for || o.for === g)
    .map((o) => (g === "women" && o.labelF ? { ...o, label: o.labelF } : o));
}

/** A question in the wording for the chosen gender, with only the options that apply to it. */
export function localize(q: Question, a: Answers): Question {
  const girl = isGirl(a);
  return {
    ...q,
    title: girl && q.titleF ? q.titleF : q.title,
    subtitle: girl && q.subtitleF ? q.subtitleF : q.subtitle,
    options: localizeOptions(q.options, a),
  };
}

/** The ordered list of questions that apply to the given answers, worded for the chosen gender. */
export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)).map((q) => localize(q, answers));
}

/**
 * Remove answers to questions that are no longer visible (e.g. after changing `paths`), and choices
 * that don't apply to the chosen gender (e.g. "ישיבת הסדר" after switching to the girls' track).
 */
export function pruneAnswers(answers: Answers): Answers {
  let current = answers;
  // Dropping a choice can hide a follow-up question, so repeat until nothing changes.
  for (let i = 0; i < 3; i++) {
    const visible = new Map(visibleQuestions(current).map((q) => [q.id, q]));
    const next: Answers = {};
    for (const [k, v] of Object.entries(current)) {
      const q = visible.get(k);
      if (!q) continue;
      if (!q.options || v === undefined) {
        next[k] = v;
        continue;
      }
      const allowed = new Set(q.options.map((o) => o.id));
      if (Array.isArray(v)) {
        const kept = v.filter((x) => allowed.has(x));
        if (kept.length > 0) next[k] = kept;
      } else if (allowed.has(v)) next[k] = v;
    }
    const same = JSON.stringify(next) === JSON.stringify(current);
    current = next;
    if (same) break;
  }
  return current;
}

export function isAnswered(q: Question, answers: Answers): boolean {
  const v = answers[q.id];
  if (v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

export function optionLabel(questionId: string, optionId: string, answers: Answers = {}): string {
  const q = QUESTIONS.find((x) => x.id === questionId);
  const o = q?.options?.find((x) => x.id === optionId);
  if (!o) return optionId;
  return isGirl(answers) && o.labelF ? o.labelF : o.label;
}
