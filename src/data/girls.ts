import type { Institution, Region, Source } from "@/lib/domain/types";
import { build, hewiki, type Entry } from "./directory";

/**
 * The girls' track: national service (with komunariyot and service abroad), midrashot and seminaries.
 *
 * Same rules as directory.ts: a place is listed only if a cited source names it, the location only when a
 * source states it, and nothing about the programme is claimed beyond what the source says.
 * Only places that are active today are listed. Places that closed are in docs/girls-track-report.md.
 */

const LISTED_ON = "2026-10-23";
const NV = "המידע עדיין לא אומת";

// ───────────────────────── Sources ─────────────────────────

/** midrashot.co.il, a directory of girls' midrashot. Each place has its own page there. */
const SITE = (slug: string, name: string): Source => ({
  label: `אתר המדרשות לבנות — ${name}`,
  url: `https://midrashot.co.il/midrasha/${encodeURIComponent(slug)}/`,
  kind: "directory",
});
const OFFICIAL = (url: string, name: string): Source => ({ label: `${name} (אתר רשמי)`, url, kind: "official" });

// ───────────────────────── Entry shapes ─────────────────────────

type Mode = "full_year" | "shiluv" | "before_army";

interface MidrashaEntry extends Entry {
  /** The place's own one-line description on midrashot.co.il. */
  tagline?: string;
  /** Programme kinds midrashot.co.il lists the place under. */
  modes?: Mode[];
  haredi?: boolean;
}

const at = (e: Omit<MidrashaEntry, "listedOn">): MidrashaEntry => ({ ...e, listedOn: LISTED_ON });

// ───────────────────────── Builders ─────────────────────────

const midrasha = (e: MidrashaEntry): Institution =>
  build(e, {
    pathway: "midrasha",
    typeLabel: "מדרשה לבנות",
    environments: e.haredi ? ["haredi"] : ["religious_zionist"],
    audience: "women",
    torahIntensity: 3,
    militaryEmphasis: 0,
    militaryModel: "unknown",
    duration: "one_year",
    identity: e.tagline ? `באתר המדרשות לבנות היא מתוארת כך: ״${e.tagline}״.` : "מדרשה תורנית לבנות, לפי המקורות.",
    militaryIntegration: e.modes?.includes("shiluv")
      ? "לפי אתר המדרשות, יש כאן מסלול שילוב — לימוד לצד שירות לאומי, לימודים או עבודה. הפרטים — " + NV + "."
      : e.modes?.includes("before_army")
        ? "לפי אתר המדרשות, יש כאן מסלול לבנות לפני גיוס לצבא. הפרטים — " + NV + "."
        : `איך משתלב כאן שירות לאומי או צבאי — ${NV}.`,
    extraAttributes: e.modes?.length ? { programModes: e.modes } : undefined,
  });

const seminar = (e: Entry): Institution =>
  build(e, {
    pathway: "midrasha",
    typeLabel: "סמינר לבנות",
    environments: ["haredi"],
    audience: "women",
    torahIntensity: 2,
    militaryEmphasis: 0,
    militaryModel: "unknown",
    duration: "multi_year",
    identity: "סמינר חרדי לבנות, לפי המקורות.",
    militaryIntegration: `בסמינרים החרדיים לרוב אין שירות צבאי או לאומי כחלק מהמסגרת. מה נהוג כאן — ${NV}.`,
  });

type Area = NonNullable<Institution["attributes"]["serviceAreas"]>[number];

const nationalService = (
  e: Entry,
  o: { typeLabel: string; identity: string; kind?: Institution["kind"]; areas?: Area[] },
): Institution =>
  build(e, {
    pathway: "national_service",
    kind: o.kind,
    typeLabel: o.typeLabel,
    environments: ["religious_zionist", "open_religious", "mixed_backgrounds", "general"],
    audience: "all",
    torahIntensity: 0,
    militaryEmphasis: 0,
    militaryModel: "national_service",
    duration: "varies",
    identity: o.identity,
    militaryIntegration:
      "לפי ויקיפדיה, השירות הלאומי משמש לרוב שירות תחליפי לשירות צבאי, למי שאינם משרתים בצה״ל. תנאי הזכאות והפטור — כדאי לברר מול רשות השירות הלאומי־אזרחי ומול העמותה.",
    extraAttributes: o.areas ? { serviceAreas: o.areas } : undefined,
  });

// ───────────────────────── שירות לאומי ─────────────────────────

const J: Region = "jerusalem";
const JS: Region = "judea_samaria";

const NATIONAL_SERVICE: Institution[] = [
  nationalService(
    {
      id: "ns-national-service",
      name: "שירות לאומי",
      location: "כל הארץ, לפי שיבוץ",
      region: "nationwide",
      sources: [hewiki("רשות השירות הלאומי-אזרחי")],
      wiki: {
        title: "שירות לאומי",
        facts:
          "שירות לאומי משמש לרוב שירות תחליפי לשירות צבאי, ונעשה לרוב במסגרות חינוכיות, רפואיות או ברווחה. בין תחומי השירות בישראל: חינוך בבתי ספר ובגנים, תנועות נוער, בתי חולים, טיפול באנשים עם מוגבלויות, אזרחים ותיקים, מד״א ואיחוד הצלה, המשטרה, רשות הטבע והגנים וקק״ל, ושירות בתפוצות. את המערך מנהלת רשות השירות הלאומי־אזרחי.",
      },
      listedOn: LISTED_ON,
    },
    {
      typeLabel: "מסלול שירות לאומי",
      kind: "track",
      identity: "שירות אזרחי במקום שירות צבאי, דרך עמותה מוכרת.",
      areas: ["education", "youth", "health", "welfare", "security", "abroad"],
    },
  ),
  nationalService(
    {
      id: "ns-komunarit",
      name: "קומונרית בתנועת נוער",
      location: "סניפי תנועות הנוער ברחבי הארץ",
      region: "nationwide",
      sources: [],
      wiki: {
        title: "קומונר",
        facts:
          "הקומונר אחראי על פעילות התנועה בסניף ובאזור. בתנועות בני עקיבא, עזרא ואריאל הקומונר הוא לרוב בת שירות לאומי.",
      },
      listedOn: LISTED_ON,
    },
    {
      typeLabel: "תפקיד בשירות לאומי",
      kind: "track",
      identity: "תפקיד בשירות לאומי בתנועת נוער.",
      areas: ["youth", "education"],
    },
  ),
  nationalService(
    {
      id: "ns-diaspora",
      name: "שירות לאומי בתפוצות",
      location: "קהילות יהודיות בחו״ל",
      region: "nationwide",
      sources: [],
      wiki: {
        title: "שירות לאומי בתפוצות",
        facts:
          "פרויקט של בת עמי בשיתוף תנועת בני עקיבא העולמית, לבנות שירות שסיימו שנה של שירות לאומי בארץ, בעיקר בחינוך. הבנות נשלחות לקהילות ברחבי העולם, בעיקר בארצות הברית.",
      },
      listedOn: LISTED_ON,
    },
    {
      typeLabel: "מסלול שירות לאומי",
      kind: "track",
      identity: "שנה שנייה של שירות לאומי, בקהילה יהודית בחו״ל.",
      areas: ["abroad", "education", "youth"],
    },
  ),
  nationalService(
    {
      id: "ns-haaguda-lehitnadvut",
      name: "האגודה להתנדבות",
      region: "nationwide",
      website: "https://sherut-leumi.co.il/",
      sources: [OFFICIAL("https://sherut-leumi.co.il/", "האגודה להתנדבות")],
      wiki: {
        title: "האגודה להתנדבות",
        facts:
          "ארגון התנדבותי שהוקם ב־1971 (בשם ״האגודה להתנדבות בעם״) והיה למייסד השירות הלאומי בישראל. האגודה היא העמותה הגדולה והוותיקה במערך השירות הלאומי.",
      },
    },
    { typeLabel: "עמותת שירות לאומי", identity: "עמותה מוכרת שדרכה משתבצים לשירות לאומי." },
  ),
  nationalService(
    {
      id: "ns-bat-ami",
      name: "בת עמי",
      region: "nationwide",
      website: "https://bat-ami.org.il/",
      sources: [OFFICIAL("https://bat-ami.org.il/", "בת עמי")],
      wiki: {
        title: "בת עמי",
        facts:
          "בת עמי (אלומה–אמונה) היא עמותה מוכרת שמפעילה אלפי מתנדבים בשירות לאומי־אזרחי, במסגרות לאוכלוסיות שונות ובתחומים שונים.",
      },
    },
    { typeLabel: "עמותת שירות לאומי", identity: "עמותה מוכרת שדרכה משתבצים לשירות לאומי." },
  ),
  nationalService(
    {
      id: "ns-shlomit",
      name: "שלומית",
      region: "nationwide",
      website: "https://shlomit.org.il/",
      sources: [OFFICIAL("https://shlomit.org.il/", "עמותת שלומית")],
      wiki: {
        title: "שלומית (עמותה)",
        facts: "עמותה שמפעילה מתנדבים בשירות הלאומי. הוקמה ב־1993, ומאז שירתו בה כ־40,000 מתנדבים.",
      },
    },
    { typeLabel: "עמותת שירות לאומי", identity: "עמותה מוכרת שדרכה משתבצים לשירות לאומי." },
  ),
  nationalService(
    {
      id: "ns-aminadav",
      name: "עמינדב",
      region: "nationwide",
      website: "https://aminadav.org.il/",
      sources: [OFFICIAL("https://aminadav.org.il/", "עמינדב")],
      wiki: {
        title: "עמינדב (שירות לאומי)",
        facts:
          "אגודה דתית־לאומית להתנדבות במערך השירות הלאומי, לבנים ולבנות הפטורים משירות צבאי מסיבות רפואיות או דתיות. נרשמה ב־1986 והחלה לפעול ב־1989.",
      },
    },
    { typeLabel: "עמותת שירות לאומי", identity: "עמותה מוכרת שדרכה משתבצים לשירות לאומי." },
  ),
];

// ───────────────────────── מדרשות ─────────────────────────
// Base list: midrashot.co.il (read 2026-10-23: all 66 places on its four regional lists and the explore page), plus every active midrasha in
// Hebrew Wikipedia's category "מדרשות לנשים". Locations are the ones those sources state.

const MIDRASHOT: MidrashaEntry[] = [
  // ירושלים
  at({ id: "midrasha-el-halev", name: "מדרשת אל הלב", location: "ירושלים", region: J, tagline: "מדרשת שילוב לבנות 18+", modes: ["shiluv"], sources: [SITE("מדרשת-אל-הלב", "מדרשת אל הלב")] }),
  at({ id: "midrasha-lindenbaum", name: "מדרשת לינדנבאום", location: "ירושלים", region: J, tagline: "בית מדרש גבוה לבנות בירושלים", modes: ["before_army"], wiki: { title: "מדרשת לינדנבאום", facts: "מדרשה תורנית לנשים בשכונת ארנונה, ברשת אור תורה סטון (בעבר ״מדרשת ברוריה״). אחת המסגרות הגדולות בישראל ללימוד תורה לנשים, והראשונה שבה נלמדה גמרא לנשים בסגנון ישיבתי." }, sources: [SITE("lindenbaum", "מדרשת לינדנבאום")] }),
  at({ id: "midrasha-nishmat", name: "מדרשת נשמת", location: "ירושלים", region: J, tagline: "מדרשה גבוהה ללימודי תורה לנשים בירושלים", modes: ["before_army", "shiluv"], wiki: { title: "מדרשת נשמת", facts: "מדרשה גבוהה ללימודי תורה לנשים בשכונת פת, שהקימו ב־1990 הרבנית חנה הנקין, נשיאת המדרשה, ובעלה הרב יהודה הרצל הנקין." }, sources: [SITE("nishmat", "מדרשת נשמת")] }),
  at({ id: "midrasha-maayanotecha", name: "מדרשת מעיינותיך", location: "ירושלים", region: J, tagline: "הבית שלך ללימוד תורה לאור החסידות", modes: ["shiluv"], sources: [SITE("maynotecha", "מדרשת מעיינותיך")] }),
  at({ id: "midrasha-shirat-yerushalayim", name: "מדרשת שירת ירושלים", location: "ירושלים", region: J, tagline: "מדרשה ללימודי יהדות, צמיחה רוחנית והעצמה אישית", sources: [SITE("shirat-yerushalayim", "מדרשת שירת ירושלים")] }),
  at({ id: "midrasha-tairi-zion", name: "מדרשת תאירי ציון", location: "ירושלים", region: J, tagline: "מדרשת שילוב בירושלים", modes: ["shiluv"], sources: [SITE("tair-zion", "מדרשת תאירי ציון")] }),
  at({ id: "midrasha-maamakim", name: "מדרשת מעמקים", location: "ירושלים", region: J, tagline: "מדרשה חסידית ישראלית: לימוד תורה לשמה, תוכנית חלקית ושילוב", modes: ["shiluv"], sources: [SITE("maamakim", "מדרשת מעמקים")] }),
  at({ id: "midrasha-tal", name: "מדרשת טל", location: "קמפוס טל, ירושלים", region: J, tagline: "שילוב מדרשה עם לימודים אקדמיים בקמפוס טל", modes: ["shiluv"], sources: [SITE("tal", "מדרשת טל")] }),
  at({ id: "midrasha-beit-morasha", name: "בית המדרש לנשים בבית מורשה", location: "ירושלים", region: J, wiki: { title: "בית המדרש לנשים בבית מורשה", facts: "בית המדרש לנשים על שם משה גרין הוא מוסד תורני־אקדמי של המרכז האקדמי בית מורשה בירושלים." }, sources: [] }),
  at({ id: "midrasha-harova", name: "מדרשת הרובע", location: "הרובע היהודי, ירושלים", region: J, tagline: "מדרשה תורנית גבוהה לבנות בעיר העתיקה בירושלים", wiki: { title: "מדרשת הרובע", facts: "מדרשה תורנית לבנות ברובע היהודי, שנוסדה ב־1993 על ידי הרב אוהד תירוש והרבנית דנה סליי. לומדות בה נשים בגילים מגוונים." }, sources: [SITE("harova", "מדרשת הרובע")] }),
  at({ id: "midrasha-bat-zion", name: "מדרשת בת־ציון", location: "קריית משה, ירושלים", region: J, modes: ["shiluv"], wiki: { title: "מדרשת בת-ציון", facts: "מדרשה תורנית לנשים מיסודה של ישיבת מרכז הרב, המיועדת בעיקר לבנות שירות לאומי ולסטודנטיות שרוצות לשלב לימוד תורה בשנות השירות והלימודים." }, sources: [] }),
  at({ id: "midrasha-machon-ora", name: "מכון אורה", location: "גבעת שאול, ירושלים", region: J, tagline: "מדרשה ללימודי יהדות באהבה ובאמונה, ברוח מכון מאיר", wiki: { title: "מכון אורה", facts: "מדרשה ללימודי יהדות לבנות לא־דתיות, דתיות ובעלות תשובה. רוב התלמידות מגיעות אחרי שירות לאומי או צבאי." }, sources: [SITE("ora", "מכון אורה")] }),
  at({ id: "midrasha-matan", name: "מת״ן — מכון תורני לנשים", wiki: { title: "מת\"ן - מכון תורני לנשים", facts: "מכון ללימוד תורה מעמיק לנשים, שהקימה ב־1988 הרבנית מלכה בינה." }, sources: [] }),
  at({ id: "midrasha-neve-yerushalayim", name: "נווה ירושלים", location: "הר נוף, ירושלים", region: J, haredi: true, wiki: { title: "נווה ירושלים", facts: "רשת חרדית של מדרשות לנשים. הסניף הראשי נמצא בשכונת הר נוף בירושלים." }, sources: [] }),

  // יהודה ושומרון
  at({ id: "midrasha-daniali", name: "מדרשת דניאלי", location: "תפוח", region: JS, tagline: "מדרשה לבנות לפני שירות לאומי", sources: [SITE("מדרשת-דניאלי", "מדרשת דניאלי")] }),
  at({ id: "midrasha-shuva", name: "מדרשת שובה", location: "עפרה", region: JS, tagline: "מדרשה ללימודי יהדות לבנות", wiki: { title: "מדרשת שובה", facts: "מדרשה תורנית לנשים ביישוב עפרה." }, sources: [SITE("מדרשת-שובה", "מדרשת שובה")] }),
  at({ id: "midrasha-binat", name: "מדרשת בינת", location: "שבות רחל", region: JS, tagline: "בית מדרש גבוה לבנות", wiki: { title: "מדרשת בינת", facts: "מדרשה תורנית לנשים בשבות רחל שבבנימין, שהוקמה באלול תש״ס (2000). בראשה הרב רונן טמיר ובנשיאותה הרב מיכאל ברום." }, sources: [SITE("binat", "מדרשת בינת")] }),
  at({ id: "midrasha-drisha", name: "ישיבת דרישה", location: "כפר עציון", region: JS, tagline: "בית מדרש לנשים", modes: ["before_army"], wiki: { title: "ישיבת דרישה", facts: "ישיבה לנשים בגילים שאחרי התיכון (לפני או אחרי שירות לאומי או צבאי), שמכוונת ללימוד תורה ברמה מתקדמת ובדגש על לימוד עיון." }, sources: [SITE("drisha", "דרישה")] }),
  at({ id: "midrasha-mabat", name: "מדרשת מבט", location: "אריאל", region: JS, tagline: "מדרשה לבנות", modes: ["before_army"], sources: [SITE("mabat", "מדרשת מבט")] }),
  at({ id: "midrasha-reshit-maon", name: "מכון ראשית — מדרשת מעון", location: "מעון", region: JS, tagline: "מדרשה ללימודי יהדות לבנות", sources: [SITE("reshit", "מכון ראשית — מדרשת מעון")] }),
  at({ id: "midrasha-shirat-hevron", name: "מדרשת שירת חברון", location: "קריית ארבע", region: JS, tagline: "מדרשה לבנות", sources: [SITE("shirat-hevron", "מדרשת שירת חברון")] }),
  at({ id: "midrasha-torat-hayim", name: "מדרשת תורת חיים", location: "הר ברכה", region: JS, tagline: "מדרשה בשילוב תואר או שירות לאומי", modes: ["shiluv"], sources: [SITE("torat-hayim", "מדרשת תורת חיים")] }),
  at({ id: "midrasha-zohar", name: "מדרשת זוהר", location: "בת עין", region: JS, tagline: "בית מדרש לבנייה והתחדשות, לבעלות תשובה ולדתיות מבית, ברוח חסידית ארצישראלית", sources: [SITE("zohar", "מדרשת זוהר")] }),
  at({ id: "midrasha-migdal-oz", name: "בית המדרש לנשים מגדל עוז", location: "מגדל עוז, גוש עציון", region: JS, tagline: "בית מדרש לבנות שרוצות לפתח את אישיותן הרוחנית ולהעמיק את השכלתן התורנית", wiki: { title: "בית המדרש לנשים מגדל עוז", facts: "מדרשה תורנית לבנות ליד ישיבת הר עציון, בקיבוץ מגדל עוז שבגוש עציון, בתוך קמפוס מגדל עוז של המכללה האקדמית הרצוג." }, sources: [SITE("migdal-oz", "מדרשת מגדל עוז")] }),
  at({ id: "midrasha-shilat", name: "מדרשת שיל״ת", location: "אלוני שילה", region: JS, tagline: "מדרשה תורנית לבנות: שנת תורה לשמה, ושילוב עם שירות לאומי, לימודים או עבודה", modes: ["full_year", "shiluv"], wiki: { title: "מדרשת שיל\"ת", facts: "מדרשה תורנית לבנות שהוקמה באלול תשס״א (2001). השם הוא ראשי תיבות של ״שיויתי ה׳ לנגדי תמיד״." }, sources: [SITE("shilat", "מדרשת שיל״ת")] }),

  // מרכז
  at({ id: "midrasha-tohar", name: "מדרשת טהר", location: "יד בנימין", region: "center", tagline: "מדרשה תורנית לבנות, באווירה חסידית חמה ומשפחתית", modes: ["shiluv"], wiki: { title: "מדרשת טהר", facts: "מדרשה תורנית לבנות, חלק ממוסדות ״תורת החיים״. הוקמה ב־תשנ״ט ביישוב גן אור שבגוש קטיף." }, sources: [SITE("מדרשת-טוהר", "מדרשת טהר")] }),
  at({ id: "midrasha-tohar-halev", name: "מדרשת טוהר הלב", location: "יד בנימין", region: "center", tagline: "מדרשה לבעלות תשובה ומתחזקות", modes: ["before_army"], sources: [SITE("tohar-halev", "מדרשת טוהר הלב")] }),
  at({ id: "midrasha-ahava-emuna", name: "מדרשת אהבה ואמונה", location: "בת ים", region: "center", tagline: "מדרשת שילוב לבנות שירות וסטודנטיות", modes: ["shiluv"], sources: [SITE("ahava-emuna", "מדרשת אהבה ואמונה")] }),
  at({ id: "midrasha-aviv", name: "מדרשת אביב", location: "חולון", region: "center", tagline: "לימודי תורה בשילוב תואר אקדמי במכללת תלפיות", modes: ["shiluv"], wiki: { title: "מדרשת אביב", facts: "מדרשה תורנית לנשים שהוקמה ב־1996 בשיתוף מכללת תלפיות. לומדים בה אמונה, תנ״ך, חסידות והלכה לאור תורת הרב קוק." }, sources: [SITE("aviv", "מדרשת אביב")] }),
  at({ id: "midrasha-emuna-beeri", name: "מדרשת אמונה בארי", location: "פרדס חנה", region: "center", tagline: "מדרשה המשלבת לימוד בתוך החיים", modes: ["before_army"], sources: [SITE("beeri", "מדרשת אמונה בארי")] }),
  at({ id: "midrasha-lod", name: "מדרשת לוד — או״ת לינדנבאום", location: "לוד", region: "center", tagline: "שנת מדרשה לפני צבא", modes: ["before_army"], sources: [SITE("lod", "מדרשת לוד")] }),
  at({ id: "midrasha-modiin", name: "מדרשת מודיעין", location: "מודיעין", region: "center", tagline: "לימודי מדרשה ברמה גבוהה, יחס אישי, תוכניות מגוונות", modes: ["before_army", "shiluv"], sources: [SITE("modiin", "מדרשת מודיעין")] }),
  at({ id: "midrasha-oria", name: "מדרשת אוריה", location: "גבעת שמואל", region: "center", tagline: "מדרשה ללימודי יהדות לנשים ונערות", modes: ["before_army", "shiluv"], wiki: { title: "מדרשת אוריה", facts: "מדרשה תורנית לבנות שהקימו ב־2007 הרב יהושע שפירא והרב ברוך סליי, העומדים בראשה. היא משלבת את תורת הרב קוק עם תורת החסידות." }, sources: [SITE("oria", "מדרשת אוריה")] }),
  at({ id: "midrasha-orot-avital", name: "מדרשת אורות אביטל", location: "רחובות", region: "center", tagline: "מדרשת שילוב ברחובות", modes: ["shiluv"], sources: [SITE("orot-avital", "מדרשת אורות אביטל")] }),
  at({ id: "midrasha-orot-etzion", name: "מדרשת אורות עציון", location: "גבעת וושינגטון", region: "center", tagline: "בית מדרש גבוה לבנות", modes: ["before_army", "shiluv"], sources: [SITE("orot-etzion", "מדרשת אורות עציון")] }),
  at({ id: "midrasha-pnimiyut", name: "מדרשת פנימיות (חב״ד)", location: "רמת אביב, תל אביב", region: "center", tagline: "מרכז לימודי יהדות וחסידות לנשים ובנות", sources: [SITE("pnimiyut", "מדרשת פנימיות")] }),
  at({ id: "midrasha-yafo", name: "מדרשת יפו", location: "תל אביב־יפו", region: "center", tagline: "מדרשה ללימודי יהדות לנשים", sources: [SITE("yafo", "מדרשת יפו")] }),
  at({ id: "midrasha-binat-pt", name: "מדרשת בינת פתח תקווה", location: "פתח תקווה", region: "center", tagline: "מדרשת שילוב לבנות שירות לאומי", modes: ["shiluv"], sources: [SITE("binat-pt", "מדרשת בינת פתח תקווה")] }),
  at({ id: "midrasha-nevia", name: "מדרשת נביעה", location: "רמת גן", region: "center", tagline: "מרכז צמיחה רוחנית לבעלות תשובה ומתקרבות", sources: [SITE("nevia", "מדרשת נביעה")] }),
  at({ id: "midrasha-shoshanat-aviv", name: "מדרשת שושנת אביב", location: "תל אביב", region: "center", tagline: "מדרשת ערב לבעלות תשובה", sources: [SITE("shoshanat-aviv", "מדרשת שושנת אביב")] }),
  at({ id: "midrasha-bar-ilan", name: "המכון הגבוה לתורה — המדרשה לנשים", location: "אוניברסיטת בר־אילן, רמת גן", region: "center", tagline: "מדרשה לבנות מכל גווני הקשת הדתית", wiki: { title: "המכון הגבוה לתורה", facts: "המכון הגבוה לתורה (מג״ל) פועל בתוך אוניברסיטת בר־אילן, ולצד המוסד לגברים פועלת בו מדרשה תורנית לנשים." }, sources: [SITE("bar-ilan", "המדרשה בבר־אילן")] }),

  // צפון
  at({ id: "midrasha-baorech", name: "מדרשת באורך", location: "נווה שאנן, חיפה", region: "north", tagline: "מדרשת שילוב בחיפה", modes: ["shiluv"], sources: [SITE("מדרשת-באורך", "מדרשת באורך")] }),
  at({ id: "midrasha-ivria", name: "מדרשת עבריה", location: "ראש פינה", region: "north", tagline: "מדרשה ברוח תורת הרב קוק לבנות שמחפשות עומק וחיים", sources: [SITE("מדרשת-עבריה", "מדרשת עבריה")] }),
  at({ id: "midrasha-ali-beer", name: "מדרשת עלי באר", location: "בית שאן", region: "north", tagline: "מדרשת שילוב בבית שאן", modes: ["shiluv"], sources: [SITE("ali-beer", "מדרשת עלי באר")] }),
  at({ id: "midrasha-ashira", name: "מדרשת אשירה", location: "קריית מוצקין", region: "north", tagline: "מדרשה לבנות בתוך אולפנת ״סגולה״", sources: [SITE("ashira", "מדרשת אשירה")] }),
  at({ id: "midrasha-bat-chen", name: "מדרשת בת חן בגולן", location: "קצרין", region: "north", tagline: "בית מדרש יוצר נשי למחול, מוזיקה ואמנות", sources: [SITE("bat-chen", "מדרשת בת חן בגולן")] }),
  at({ id: "midrasha-ein-hanatziv", name: "מדרשת עין הנצי״ב", location: "עין הנצי״ב", region: "north", tagline: "מדרשה ללימודי יהדות לבוגרות תיכון", wiki: { title: "מדרשת עין הנציב", facts: "מדרשה תורנית לנשים של תנועת הקיבוץ הדתי, בראשות ד״ר אסתר פישר. אחת המדרשות הראשונות שמשלבות שירות בצה״ל או שירות לאומי עם לימוד תורה." }, sources: [SITE("ein-hanatziv", "מדרשת עין הנצי״ב")] }),
  at({ id: "midrasha-maayan-ganim", name: "מדרשת מעין גנים", location: "טבריה", region: "north", tagline: "מדרשת שילוב עם שירות לאומי ובשילוב לימודים אקדמיים במכללת שאנן", modes: ["shiluv"], sources: [SITE("maayan-ganim", "מדרשת מעין גנים")] }),
  at({ id: "midrasha-matat", name: "מדרשת מתת — או״ת לינדנבאום", location: "כרמיאל", region: "north", tagline: "מדרשה תורנית קהילתית", sources: [SITE("matat", "מדרשת מתת")] }),
  at({ id: "midrasha-mevaser-shalom", name: "מדרשת מבשר שלום", location: "חיפה", region: "north", tagline: "מדרשה לבעלות תשובה", sources: [SITE("mevaser-shalom", "מדרשת מבשר שלום")] }),
  at({ id: "midrasha-neta", name: "מדרשת נטע", location: "בית שאן", region: "north", tagline: "מדרשה תורנית קהילתית", modes: ["before_army"], sources: [SITE("neta", "מדרשת נטע")] }),
  at({ id: "midrasha-nov", name: "מדרשת נוב", location: "נוב", region: "north", tagline: "מדרשה תורנית לבנות", modes: ["before_army"], sources: [SITE("nov", "מדרשת נוב")] }),
  at({ id: "midrasha-tachlit", name: "מדרשת תכלית", location: "עכו ושלומי", region: "north", tagline: "מדרשות גליליות בעכו ובשלומי, מיסודן של ישיבות ההסדר עכו ומעלות", sources: [SITE("tachlit", "מדרשת תכלית")] }),
  at({ id: "midrasha-techelet-tzfat", name: "מדרשת תכלת", location: "צפת", region: "north", tagline: "מדרשה ללימודי יהדות", sources: [SITE("techelet", "מדרשת תכלת")] }),
  at({ id: "midrasha-tel-hai", name: "מדרשת תל חי", location: "קריית שמונה", region: "north", tagline: "לימודי תואר ראשון בחינוך בשילוב מדרשה", modes: ["shiluv"], sources: [SITE("tel-hai", "מדרשת תל חי")] }),
  at({ id: "midrasha-uri-tzafon", name: "מדרשת עורי צפון", location: "עכו", region: "north", tagline: "מדרשת שילוב לבנות שירות וסטודנטיות, תוכנית הוראה לתואר ראשון בחינוך", modes: ["shiluv"], sources: [SITE("uri-tzafon", "מדרשת עורי צפון")] }),

  // דרום
  at({ id: "midrasha-maayan-sderot", name: "מדרשת מעיין שדרות", location: "שדרות", region: "south", tagline: "מדרשה לבנות — מכינה לחיים", sources: [SITE("מדרשת-מעיין-שדרות", "מדרשת מעיין שדרות")] }),
  at({ id: "midrasha-rina-shlomit", name: "מדרשת רינה בשלומית", location: "שלומית", region: "south", tagline: "מדרשה בחולות חלוצה, מבית מוסדות ״עצם״", sources: [SITE("מדרשת-רינה-בשלומית", "מדרשת רינה בשלומית")] }),
  at({ id: "midrasha-ashkelon-chabad", name: "מדרשה עם נשמה — חב״ד אשקלון", location: "אשקלון", region: "south", tagline: "מדרשה לבנות ונשים בשילוב לימודי מקצוע הנדסאים", modes: ["shiluv"], sources: [SITE("ashkelon", "מדרשה עם נשמה — חב״ד אשקלון")] }),
  at({ id: "midrasha-beer-ashdod", name: "מדרשת אמי״ת באר — אשדוד", location: "אשדוד", region: "south", tagline: "מדרשה קהילתית לבנות", wiki: { title: "מדרשת באר", facts: "מדרשה תורנית־קהילתית לנשים, שמשלבת לימוד בית־מדרשי עם חיים ועבודה בקהילה, במסלול הכולל שירות צבאי מלא. פועלת בשלוש שלוחות: ירוחם, אשדוד ואופקים." }, modes: ["before_army"], sources: [SITE("beer-ashdod", "מדרשת אמי״ת באר אשדוד")] }),
  at({ id: "midrasha-beer-yerucham", name: "מדרשת באר — ירוחם", location: "ירוחם", region: "south", tagline: "מדרשה קהילתית לבנות", wiki: { title: "מדרשת באר", facts: "מדרשה תורנית־קהילתית לנשים, שמשלבת לימוד בית־מדרשי עם חיים ועבודה בקהילה, במסלול הכולל שירות צבאי מלא. פועלת בשלוש שלוחות: ירוחם, אשדוד ואופקים." }, modes: ["before_army"], sources: [SITE("beer-yerucham", "מדרשת באר ירוחם")] }),
  at({ id: "midrasha-bnot-rachel", name: "מדרשת בנות רחל", location: "אשקלון", region: "south", tagline: "מדרשה בשילוב מגורים", sources: [SITE("bnot-rachel", "מדרשת בנות רחל")] }),
  at({ id: "midrasha-eilat", name: "מדרשת אילת", location: "אילת", region: "south", tagline: "מסע אמוני לחיים", sources: [SITE("eilat", "מדרשת אילת")] }),
  at({ id: "midrasha-mibereshit", name: "מדרשת מבראשית", location: "קריית חינוך שדות נגב, נתיבות", region: "south", tagline: "מדרשת שילוב בדרום", modes: ["shiluv"], sources: [SITE("mibereshit", "מדרשת מבראשית")] }),
  at({ id: "midrasha-siach-hasade", name: "מדרשת שיח השדה", location: "שובה", region: "south", tagline: "מדרשת שילוב ברוח חסידית ארצישראלית", modes: ["shiluv"], sources: [SITE("siach-hasade", "מדרשת שיח השדה")] }),
  at({ id: "midrasha-tairi", name: "מדרשת תאירי", location: "באר שבע", region: "south", tagline: "מדרשת שילוב בבאר שבע", modes: ["before_army", "shiluv"], sources: [SITE("tairi", "מדרשת תאירי")] }),
  at({ id: "midrasha-yeela", name: "מדרשת יעלה", location: "מצפה רמון", region: "south", tagline: "מדרשה ללימודי יהדות לבנות", sources: [SITE("yeela", "מדרשת יעלה")] }),
];

// ───────────────────────── סמינרים ─────────────────────────
// Hebrew Wikipedia's category "סמינרים חרדיים לבנות בישראל": the seminaries with post-high-school years
// (י״ג–י״ד). Schools that are only a high school are left out.

const SEMINARIES: Entry[] = ([
  { id: "seminar-beit-yaakov-teachers", name: "מכון בית יעקב למורות (״הסמינר הישן״)", location: "ירושלים", region: J, wiki: { title: "מכון בית יעקב למורות", facts: "סמינר בית יעקב בירושלים, המוסד החינוכי העל־יסודי החרדי הראשון בעיר, ברשת החינוך ״בית יעקב״." }, sources: [] },
  { id: "seminar-merkaz-beit-yaakov", name: "מרכז בית יעקב למורות (״הסמינר החדש״)", location: "רחוב מלכי ישראל, ירושלים", region: J, wiki: { title: "מרכז בית יעקב למורות", facts: "סמינר בית יעקב ליטאי לבנות חרדיות, שבו מתחנכות כ־2,160 בנות." }, sources: [] },
  { id: "seminar-ofakim", name: "מכללת אופקים (סמינר אופקים)", location: "אופקים", region: "south", wiki: { title: "מכללת אופקים", facts: "מכללה תורנית לבנות. השנתונים בה מקבילים לכיתות י״ג–י״ד בסמינרים החרדיים." }, sources: [] },
  { id: "seminar-or-hachaim", name: "סמינר אור החיים", location: "בני ברק", region: "center", wiki: { title: "סמינר אור החיים", facts: "סמינר בית יעקב בבני ברק לבנות מעדות המזרח, הקרוי על שם רבי חיים אבן עטר." }, sources: [] },
  { id: "seminar-tel-aviv-tchernichovsky", name: "סמינר בית יעקב תל אביב (שצ׳רנסקי)", location: "תל אביב", region: "center", wiki: { title: "סמינר בית יעקב תל אביב (שצ'רנסקי)", facts: "סמינר חרדי שהוא תיכון וסמינר למורות, שנוסד בתל אביב ב־1933." }, sources: [] },
  { id: "seminar-bnot-elisheva", name: "סמינר בנות אלישבע", location: "רמות, ירושלים", region: J, wiki: { title: "סמינר בנות אלישבע", facts: "סמינר חרדי לבנות ברשת בית יעקב, עם יותר מ־1,750 תלמידות." }, sources: [] },
  { id: "seminar-darchei-rachel", name: "סמינר דרכי רחל", location: "הר חוצבים, ירושלים", region: J, wiki: { title: "סמינר דרכי רחל", facts: "סמינר בית יעקב לבנות (״הסניף״) שלומדות בו כ־2,000 תלמידות." }, sources: [] },
  { id: "seminar-wolf", name: "סמינר הרב וולף", location: "בני ברק", region: "center", wiki: { title: "סמינר הרב וולף", facts: "סמינר לבנות חרדיות הכולל בית ספר תיכון וסמינר ללימודי הוראה ומקצועות נוספים." }, sources: [] },
  { id: "seminar-kahana", name: "סמינר הרב כהנא", wiki: { title: "סמינר הרב כהנא", facts: "סמינר בית יעקב לבנות על שם הרב וולף בהנהלת הרב כהנא, הכולל בית ספר תיכון וסמינר ללימודי הוראה ומקצועות נוספים." }, sources: [] },
  { id: "seminar-meir", name: "סמינר הרב מאיר", wiki: { title: "סמינר הרב מאיר", facts: "סמינר בית יעקב לבנות על שם הרב וולף, זיכרון צבי, בהנהלת הרב מאיר, הכולל בית ספר תיכון וסמינר ללימודי הוראה." }, sources: [] },
  { id: "seminar-maalot", name: "סמינר מעלות בית יעקב", location: "רמת שלמה, ירושלים", region: J, wiki: { title: "סמינר מעלות בית יעקב", facts: "סמינר חרדי ליטאי. בתיכון לומדות כ־500 בנות ובסמינר כ־300." }, sources: [] },
  { id: "seminar-netiv-hachinuch", name: "סמינר נתיב החינוך", location: "רמות, ירושלים", region: J, wiki: { title: "סמינר נתיב החינוך", facts: "סמינר לבנות חרדיות מהזרם הליטאי, הספרדי והכלל־חסידי." }, sources: [] },
  { id: "seminar-ateret-rachel", name: "סמינר עטרת רחל", location: "בני ברק", region: "center", wiki: { title: "סמינר עטרת רחל", facts: "תיכון חרדי ומכללת המשך במגמות עיצוב מדיה ואדריכלות, שהחל כסמינר בית יעקב לבנות ספרדיות." }, sources: [] },
] satisfies Entry[]).map((e) => ({ ...e, listedOn: LISTED_ON }));

export const girlsInstitutions: Institution[] = [
  ...NATIONAL_SERVICE,
  ...MIDRASHOT.map(midrasha),
  ...SEMINARIES.map(seminar),
];
