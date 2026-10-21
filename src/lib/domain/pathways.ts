import type { Pathway } from "./types";

export interface PathwayInfo {
  id: Pathway;
  name: string;
  short: string;
  description: string;
  goodFor: string[];
}

/** Neutral descriptions of each pathway, based on public sources (IDF, Ministry of Defense, Kol Zchut). */
export const PATHWAY_INFO: Record<Pathway, PathwayInfo> = {
  idf: {
    id: "idf",
    name: "צה״ל",
    short: "שירות צבאי",
    description:
      "גיוס לשירות סדיר ישירות אחרי התיכון. מגוון רחב של תפקידים — לחימה, טכנולוגיה, חינוך ועוד — לפי מיון ושיבוץ של צה״ל.",
    goodFor: ["מי שרוצה להתחיל לשרת כבר עכשיו", "מי שמחפש אחריות ואתגר מוקדם"],
  },
  mechina: {
    id: "mechina",
    name: "מכינה קדם־צבאית",
    short: "שנת הכנה",
    description:
      "כעשרה חודשים של לימוד, התנדבות וחיי קבוצה לפני הגיוס. יש מכינות דתיות, כלליות ומעורבות, והגיוס נדחה לאחר סיום המכינה.",
    goodFor: ["מי שרוצה שנה לגדול לפני השירות", "מי שמחפש מנהיגות וקבוצה"],
  },
  hesder: {
    id: "hesder",
    name: "ישיבת הסדר",
    short: "תורה ושירות",
    description:
      "שילוב של לימוד תורה בישיבה עם שירות צבאי במסגרת דתית, לאורך כמה שנים. יש מסלולים שונים לאיזון בין לימוד לשירות.",
    goodFor: ["מי שרוצה גם ללמוד וגם לשרת", "מי שמחפש קהילה תורנית לאורך השירות"],
  },
  yeshiva: {
    id: "yeshiva",
    name: "ישיבה גבוהה",
    short: "לימוד תורה",
    description:
      "לימוד תורה במרכז, בבית מדרש, עם זמן להעמיק ולצמוח. האופן שבו משתלב שירות צבאי משתנה ממקום למקום וחשוב לברר אותו.",
    goodFor: ["מי שרוצה להעמיק בלימוד", "מי שמחפש צמיחה רוחנית וליווי של רבנים"],
  },
};

export const PATHWAY_ORDER: Pathway[] = ["idf", "mechina", "hesder", "yeshiva"];

export const REGION_LABELS: Record<string, string> = {
  north: "צפון",
  center: "מרכז",
  jerusalem: "ירושלים והסביבה",
  south: "דרום",
  judea_samaria: "יהודה ושומרון",
  nationwide: "בכל הארץ",
};

export const AUDIENCE_LABELS: Record<string, string> = {
  men: "לבנים",
  women: "לבנות",
  all: "לכולם",
  unknown: "לא אומת",
};

export const DURATION_LABELS: Record<string, string> = {
  short: "תקופה קצרה",
  one_year: "כשנה",
  multi_year: "כמה שנים",
  varies: "משתנה / לא אומת",
};

export const MILITARY_MODEL_LABELS: Record<string, string> = {
  direct_service: "גיוס ישיר לשירות סדיר",
  hesder: "מסלול הסדר — לימוד ושירות מקוצר",
  shiluv: "שילוב — לימוד ושירות ארוך יותר",
  pre_military: "שנת הכנה לפני הגיוס",
  individual: "שירות שמתואם באופן אישי",
  unknown: "לא אומת",
};

export const INTENSITY_LABELS = ["ללא", "מעט", "בינוני", "משמעותי", "מרכזי"];
