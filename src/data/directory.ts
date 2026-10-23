import type { Institution, Pathway, Region, ReligiousEnvironment, Source } from "@/lib/domain/types";

/**
 * Directory records: institutions whose existence, name and type are confirmed by a public list,
 * but whose program details have not been checked yet.
 *
 * Rules for this file:
 * - An institution is listed here only if a cited list names it. Nothing else about it is claimed.
 * - `location` is set only when a cited source states it (or, marked `fromName`, when the place is part
 *   of the institution's own name). Otherwise the location is shown as not verified.
 * - Region is derived from the stated location (or the hesder association's region). Unknown location
 *   → "nationwide", so the record is never filtered out by a region it may not be in.
 * - Matching attributes are deliberately thin (no strengths, styles or goals), so these records rank
 *   below fully researched ones and never get a "this matches you because…" reason they can't back.
 * - When a record is researched, move it to institutions.ts with full detail and delete it from here.
 */

const LISTED_ON = "2026-10-22";
const WIKI_CHECKED_ON = "2026-10-23";
const NV = "המידע עדיין לא אומת";

// ───────────────────────── Sources ─────────────────────────

const GOV_MECHINOT_2027: Source = {
  label: "משרד ההתיישבות והמשימות הלאומיות — מיקומי מכינות ושלוחות בשנת תשפ״ז",
  url: "https://www.gov.il/BlobFolder/unit/mchiont/he/mchinot_mechinot010926.pdf",
  kind: "government",
};
const GOV_MECHINOT_LIST: Source = {
  label: "משרד ההתיישבות והמשימות הלאומיות — רשימת המכינות והשלוחות המוכרות",
  url: "https://www.gov.il/BlobFolder/unit/mchiont/he/files_mechinot-h.pdf",
  kind: "government",
};
const COUNCIL = (path: string, name: string): Source => ({
  label: `מועצת המכינות — ${name}`,
  url: `https://mechinot.org.il/mechina/list/${path}`,
  kind: "directory",
});
const COUNCIL_EN: Source = {
  label: "The Joint Council of Mechinot — Choose Your Track",
  url: "https://mechinot.org.il/en/yachad/m",
  kind: "directory",
};
const COUNCIL_ORTHODOX_EN: Source = {
  label: "The Joint Council of Mechinot — Orthodox Mechinot",
  url: "https://mechinot.org.il/en/mechinot/orthodox-mechinot",
  kind: "directory",
};
const ENWIKI_MECHINA: Source = { label: "Wikipedia — Mechina", url: "https://en.wikipedia.org/wiki/Mechina", kind: "encyclopedia" };
const HESDER_ASSOC = (slug: string): Source => ({
  label: "איגוד ישיבות ההסדר — דף הישיבה",
  url: `https://hesder.org.il/institute/${slug}`,
  kind: "directory",
});
const MOD_HESDER: Source = {
  label: "משרד הביטחון, האגף הביטחוני־חברתי — מסלול ישיבות ההסדר",
  url: "https://noar.mod.gov.il/Haredim/Pages/מסלול-ישיבות-ההסדר.aspx",
  kind: "government",
};
const A7_TORAH_WORLD: Source = {
  label: "ערוץ 7 — עולם התורה הציוני: מספרי התלמידים בישיבות ובמכינות (24.08.2025)",
  url: "https://www.inn.co.il/news/677167",
  kind: "directory",
};
const A7_NEW_YESHIVOT: Source = {
  label: "ערוץ 7 — שיא בציונות הדתית: עשר ישיבות חדשות (27.06.2025)",
  url: "https://www.inn.co.il/news/672631",
  kind: "directory",
};
const SCIENCE_YESHIVOT: Source = {
  label: "science.co.il — Yeshiva programs in Israel",
  url: "https://www.science.co.il/jewish-studies/Yeshivot.php",
  kind: "directory",
};
const ENWIKI_HESDER: Source = { label: "Wikipedia — Hesder", url: "https://en.wikipedia.org/wiki/Hesder", kind: "encyclopedia" };
const KOLZCHUT_SERVICE_YEAR: Source = {
  label: "כל־זכות — התנדבות לשנת שירות",
  url: "https://www.kolzchut.org.il/he/התנדבות_לשנת_שירות",
  kind: "directory",
};

// ───────────────────────── Entry shape ─────────────────────────

type Stream = "torani" | "torani_girls" | "general" | "unclassified";

export interface Entry {
  id: string;
  name: string;
  /** Location as stated by a source. Omit when no source states it. */
  location?: string;
  /** The location is taken from the institution's own name, not stated separately. */
  fromName?: boolean;
  region?: Region | Region[];
  sources: Source[];
  /** Extra sentence for the verification notes. */
  note?: string;
  /** Facts summarized from the institution's Hebrew Wikipedia article (title as on he.wikipedia.org). */
  wiki?: { title: string; facts: string; location?: string };
  /** The official site, set only when it was opened and its title matched the institution. */
  website?: string;
  /** When the cited list was read, if not LISTED_ON. */
  listedOn?: string;
}
interface MechinaEntry extends Entry {
  stream: Stream;
  /** A half-year programme, as stated by its Wikipedia article. */
  halfYear?: boolean;
  /** Co-ed, as stated by the council's English directory. */
  coed?: boolean;
}

// ───────────────────────── Builders ─────────────────────────

const BASE_LIMITATION =
  "סדר היום, תוכנית הלימודים, העלויות ותנאי הקבלה — המידע עדיין לא אומת. כדאי לפנות ישירות למוסד לפני קבלת החלטה.";

const toRegions = (r: Entry["region"]): Region[] => (r === undefined ? ["nationwide"] : Array.isArray(r) ? r : [r]);

export const hewiki = (title: string): Source => ({
  label: `ויקיפדיה — ${title}`,
  url: `https://he.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  kind: "encyclopedia",
});

function locationOf(e: Entry): { label: string; regions: Region[]; note: string } {
  if (!e.location && e.wiki?.location) {
    return { label: e.wiki.location, regions: toRegions(e.region), note: "המיקום לפי ויקיפדיה." };
  }
  if (!e.location) {
    return {
      label: `מיקום — ${NV}`,
      regions: toRegions(e.region),
      note: "המיקום לא צוין במקורות שבדקנו.",
    };
  }
  return {
    label: e.location,
    regions: toRegions(e.region),
    note: e.fromName ? "המיקום נלקח משם המוסד ולא אומת בנפרד." : "המיקום מופיע במקור המצוטט.",
  };
}

export function build(
  e: Entry,
  opts: {
    pathway: Pathway;
    /** A pathway/track (e.g. national service through any association) rather than one institution. */
    kind?: Institution["kind"];
    /** Extra matching attributes (serviceAreas, programModes) the sources support. */
    extraAttributes?: Partial<Institution["attributes"]>;
    typeLabel: string;
    environments: ReligiousEnvironment[];
    audience: Institution["attributes"]["audience"];
    torahIntensity: number;
    militaryEmphasis: number;
    militaryModel: Institution["attributes"]["militaryModel"];
    duration: Institution["attributes"]["duration"];
    identity: string;
    militaryIntegration?: string;
    extraNote?: string;
  },
): Institution {
  const loc = locationOf(e);
  const place = e.location ?? e.wiki?.location;
  const where = place ? ` ב${place}` : "";
  const wikiFacts = e.wiki ? ` לפי ויקיפדיה: ${e.wiki.facts}` : "";
  return {
    id: e.id,
    slug: e.id,
    name: e.name,
    pathway: opts.pathway,
    typeLabel: opts.typeLabel,
    kind: opts.kind ?? "institution",
    regions: loc.regions,
    locationLabel: loc.label,
    shortDescription: e.wiki ? `${opts.typeLabel}${where}.${wikiFacts}` : `${opts.typeLabel}${where}. ${opts.identity} פרטי התוכנית — ${NV}.`,
    highlights: [],
    limitations: [BASE_LIMITATION],
    attributes: {
      torahIntensity: opts.torahIntensity,
      militaryEmphasis: opts.militaryEmphasis,
      militaryModel: opts.militaryModel,
      torahServiceBalance: null,
      religiousEnvironments: opts.environments,
      development: [],
      serviceInterests: [],
      environmentStyles: [],
      learningStyles: [],
      strengths: [],
      residential: "varies",
      duration: opts.duration,
      communitySize: "unknown",
      audience: opts.audience,
      ...opts.extraAttributes,
    },
    profile: {
      overview: `${e.name} — ${opts.typeLabel}${where}. ${opts.identity}${wikiFacts} מעבר לכך, ${NV}: אין כאן עדיין מידע על הגישה החינוכית, סדר היום, המגורים, העלויות או תנאי הקבלה.`,
      militaryIntegration: opts.militaryIntegration,
      faq: [],
    },
    sources: e.wiki ? [...e.sources, hewiki(e.wiki.title)] : e.sources,
    website: e.website,
    lastVerified: e.wiki ? WIKI_CHECKED_ON : (e.listedOn ?? LISTED_ON),
    verificationStatus: "partial",
    verificationNotes: [
      `${e.sources.length ? "אומתו שם המוסד וסוגו מול הרשימה שבמקורות." : "שם המוסד וסוגו לפי ויקיפדיה בלבד."} ${loc.note}`,
      opts.extraNote,
      e.note,
      e.wiki ? "תיאור הרקע (שנת הייסוד, המייסדים וראשי המוסד) לקוח מוויקיפדיה ולא נבדק מול המוסד." : undefined,
      "שאר הפרטים לא נבדקו.",
    ]
      .filter(Boolean)
      .join(" "),
    published: true,
  };
}

const HESDER_MILITARY =
  "לפי משרד הביטחון, ישיבות ההסדר משלבות לימודים תורניים לצד שירות צבאי מקוצר במסגרת דתית. באיזה מסלול שירות פועלת הישיבה הזו — המידע עדיין לא אומת.";

const hesder = (e: Entry): Institution =>
  build(e, {
    pathway: "hesder",
    typeLabel: "ישיבת הסדר",
    environments: ["religious_zionist"],
    audience: "men",
    torahIntensity: 3,
    militaryEmphasis: 2,
    militaryModel: "hesder",
    duration: "multi_year",
    identity: "ישיבה במסלול ההסדר, המשלב לימוד תורה ושירות צבאי.",
    militaryIntegration: HESDER_MILITARY,
  });

const yeshiva = (e: Entry): Institution =>
  build(e, {
    pathway: "yeshiva",
    typeLabel: "ישיבה גבוהה",
    environments: ["religious_zionist"],
    audience: "men",
    torahIntensity: 4,
    militaryEmphasis: 1,
    militaryModel: "unknown",
    duration: "multi_year",
    identity: "ישיבה גבוהה מעולם התורה של הציונות הדתית, לפי המקורות.",
    militaryIntegration: `האם ואיך משולב שירות צבאי — ${NV}.`,
  });

const MECHINA_TYPE: Record<Stream, string> = {
  torani: "מכינה קדם־צבאית תורנית",
  torani_girls: "מכינה קדם־צבאית תורנית לבנות",
  general: "מכינה קדם־צבאית כללית",
  unclassified: "מכינה קדם־צבאית",
};

const mechina = (e: MechinaEntry): Institution =>
  build(e, {
    pathway: "mechina",
    typeLabel: MECHINA_TYPE[e.stream],
    environments:
      e.stream === "torani" || e.stream === "torani_girls" ? ["religious_zionist"] : ["mixed_backgrounds", "general"],
    audience: e.stream === "torani_girls" ? "women" : e.coed ? "all" : "unknown",
    torahIntensity: e.stream === "torani" || e.stream === "torani_girls" ? 2 : 1,
    militaryEmphasis: 3,
    militaryModel: "pre_military",
    duration: e.halfYear ? "short" : "one_year",
    identity: e.sources.length
      ? "מכינה קדם־צבאית המופיעה ברשימת המכינות המוכרות של המדינה לשנת תשפ״ז."
      : "מכינה קדם־צבאית שלא מופיעה ברשימת המכינות המוכרות של המדינה לשנת תשפ״ז.",
    militaryIntegration: `מכינה קדם־צבאית היא שנת הכנה לפני הגיוס. פרטי ההכנה לשירות במכינה הזו — ${NV}.`,
    extraNote:
      e.stream === "unclassified"
        ? "אופי המכינה (תורנית, כללית או מעורבת) והאם היא לבנים, לבנות או מעורבת — לא אומת."
        : e.stream === "general" && !e.coed
          ? "האם המכינה לבנים, לבנות או מעורבת — לא אומת."
          : undefined,
  });

// ───────────────────────── מכינות קדם־צבאיות ─────────────────────────
// Base list: the state's list of recognized mechinot for תשפ״ז (62 names). Locations from that list,
// or from the ministry's earlier list where the תשפ״ז extraction was unclear. Stream (torani/general)
// from the council's own section pages, its English directory, or English Wikipedia; otherwise unclassified.
// Already in institutions.ts with full detail: בני דוד, עין פרת, רבין, קשת יהודה, עצם.

const G = [GOV_MECHINOT_2027, GOV_MECHINOT_LIST];
const GOV_2027_ONLY = [GOV_MECHINOT_2027];

const MECHINOT: MechinaEntry[] = [
  { id: "mechina-avner", name: "מכינת אבנר", location: "עכו", region: "north", stream: "torani", sources: G, note: "ברשימה הממשלתית מופיע הכיתוב ״מכינה תורנית״." },
  { id: "mechina-aderet", name: "מכינת אדרת", location: "עינות, כפר סילבר, בן שמן, הדסה נעורים", region: "center", stream: "general", coed: true, wiki: { title: "מכינה קדם-צבאית אדרת", facts: "המכינה מגדירה את עצמה ״בית מדרש ישראלי לחברה וסביבה״, ונוסדה בשנת תש״ס (2000) במושב אדרת שבעמק האלה." }, sources: [...G, COUNCIL_EN] },
  { id: "mechina-ofakim-lemada", name: "מכינת אופקים למדע", location: "אופקים, נתיבות", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-orot-talmon", name: "מכינת אורות", location: "טלמון", region: "judea_samaria", stream: "torani", sources: [...G, A7_TORAH_WORLD], note: "ערוץ 7 מונה את ״מכינת טלמון״ בין המכינות התורניות." },
  { id: "mechina-echad-mishelanu", name: "מכינת אחד משלנו", location: "הדסה נעורים, מצפה אילן", region: "center", stream: "unclassified", wiki: { title: "מכינה קדם-צבאית אחד משלנו", facts: "המכינה נקראת על שם פיני כהן, ומיועדת בעיקר לבנים ולבנות יוצאי פנימיות וכפרי נוער מהפריפריה." }, sources: G },
  { id: "mechina-eitan", name: "מכינת איתן", location: "מעלה אדומים", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/eitan", "מכינת איתן")] },
  { id: "mechina-elisha", name: "מכינת אלישע", location: "נווה צוף", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/elisha", "מכינת אלישע")] },
  { id: "mechina-arzei-halevanon", name: "מכינת ארזי הלבנון", location: "תל אביב־יפו, גבעת וושינגטון", region: "center", stream: "torani", sources: [...G, ENWIKI_MECHINA], note: "ויקיפדיה האנגלית מונה אותה בין המכינות הדתיות." },
  { id: "mechina-beer-ora", name: "מכינת באר אורה", location: "באר אורה", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-beeri", name: "מכינת בארי", location: "בית ברל, כנות", region: "center", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-beit-yisrael", name: "מכינת בית ישראל", location: "ירושלים", region: "jerusalem", stream: "general", wiki: { title: "מכינה קדם-צבאית בית ישראל", facts: "המכינה הוקמה ב־1997 על ידי הושע פרידמן בן־שלום, בקיבוץ העירוני בית ישראל בשכונת גילה בירושלים." }, sources: [...G, ENWIKI_MECHINA] },
  { id: "mechina-beit-yatir", name: "מכינת בית יתיר", location: "בית יתיר", region: "judea_samaria", stream: "torani", wiki: { title: "מכינה קדם-צבאית יתיר", facts: "מכינה דתית שהוקמה בשנת תשנ״א (1991) ביישוב בית יתיר בדרום הר חברון, במבנה משטרה מתקופת המנדט. בראשה עומד הרב איתן שליו." }, sources: [...G, ENWIKI_MECHINA] },
  { id: "mechina-gal", name: "מכינת גל", location: "עכו, חיפה, קרית ביאליק", region: "north", stream: "general", wiki: { title: "מכינה קדם צבאית גל", facts: "מכינה כללית שהוקמה בספטמבר 2008, ומטרתה לפתח מנהיגות מקומית ושוויון הזדמנויות בקרב צעירים מהפריפריה החברתית־כלכלית." }, sources: [...G, COUNCIL("general/gal", "מכינת גל")] },
  { id: "mechina-galil-elyon", name: "מכינת גליל עליון", location: "כפר הנשיא, עמיר, שדה נחמיה, אפיקים", region: "north", stream: "general", wiki: { title: "מכינת גליל עליון", facts: "מכינה כללית שפועלות בה כמה קבוצות שנתיות בקיבוצים עמיר וכפר הנשיא ובמושבה מטולה שבגליל העליון." }, sources: [...G, COUNCIL_EN] },
  { id: "mechina-dror", name: "מכינת דרור", location: "יד מרדכי, שדרות", region: "south", stream: "general", coed: true, sources: [...G, COUNCIL("general/dror", "מכינת דרור"), COUNCIL_EN] },
  { id: "mechina-derech-eretz", name: "מכינת דרך ארץ", location: "ערד, אשקלון", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-hadar", name: "מכינת הדר", location: "סופה, ניר עם", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-hayerushalmit", name: "המכינה הירושלמית", location: "ירושלים (קריית היובל, הגבעה הצרפתית)", region: "jerusalem", stream: "general", wiki: { title: "המכינה הירושלמית", facts: "מכינה פלורליסטית וליברלית שהוקמה ב־2010, עם דגש על היכרות עם ירושלים ועם החברה הישראלית. בראשה עומדת יעל ברמן־דומב." }, sources: [...G, COUNCIL("general/yerushalmit", "המכינה הירושלמית")] },
  { id: "mechina-hanegev", name: "מכינת הנגב", location: "שדה בוקר", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-haemek", name: "מכינת העמ״ק", location: "בית שאן", region: "north", stream: "general", coed: true, wiki: { title: "מכינה קדם-צבאית העמק", facts: "מכינה קהילתית לזהות יהודית, מעורבת לדתיים ולחילונים, בקיבוצים כפר רופין ושלוחות שבעמק המעיינות. במרכזה בית מדרש לזהות יהודית ולמנהיגות." }, sources: [...G, COUNCIL("general/emek", "מכינת העמ״ק"), COUNCIL_EN] },
  { id: "mechina-hashomer-hachadash", name: "מכינת השומר החדש", location: "חוות רון (מבואות ערד)", region: "south", stream: "unclassified", sources: G },
  { id: "mechina-haviva-reik", name: "מכינת חביבה רייק", location: "גבעת חביבה", region: "north", stream: "unclassified", sources: G },
  { id: "mechina-hevruta", name: "מכינת חברותא", location: "טלביה, ירושלים", region: "jerusalem", stream: "unclassified", sources: GOV_2027_ONLY },
  { id: "mechina-hosen-peduel", name: "מכינת חוסן", location: "פדואל", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/hosen-peduel", "מכינת חוסן")] },
  { id: "mechina-hemdat", name: "מכינת חמדת", location: "חמדת", region: "judea_samaria", stream: "torani", wiki: { title: "מכינה קדם צבאית חמדת", facts: "מכינה תורנית לבנים ביישוב חמדת בצפון בקעת הירדן, שהוקמה ב־1997. בראשה עומד הרב ינון מדר." }, sources: [...G, ENWIKI_MECHINA] },
  { id: "mechina-five-fingers", name: "מכינת חמש אצבעות", location: "זכרון יעקב", region: "north", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-hannaton", name: "מכינת חנתון", location: "חנתון", region: "north", stream: "general", coed: true, wiki: { title: "מכינה קדם-צבאית חנתון", facts: "מכינה מעורבת לדתיים ולחילונים בחנתון שבגליל התחתון, שהוקמה ב־2012. ערכיה מושפעים מהיהדות הקונסרבטיבית, ובראשה עומד הרב יואב אנדי." }, sources: [...G, COUNCIL_EN, ENWIKI_MECHINA] },
  { id: "mechina-yedidya", name: "מכינת ידידיה", location: "בית שמש", region: "jerusalem", stream: "torani", sources: [...G, COUNCIL("torani/yedidya", "מכינת ידידיה")] },
  { id: "mechina-yonatan", name: "מכינת יונתן", location: "עלומים, סעד", region: "south", stream: "torani_girls", sources: [...G, COUNCIL("torani-banot/yonatan", "מכינת יונתן — עלומים וסעד")] },
  { id: "mechina-yemin-orde", name: "מכינת ימין אורד", location: "חצור הגלילית", region: "north", stream: "unclassified", wiki: { title: "מכינה קדם-צבאית ימין אורד", facts: "מכינה בחצור הגלילית שמתמקדת בנוער עולה, ומסייעת לו להשתלב בחברה." }, sources: G },
  { id: "mechina-yesodot", name: "מכינת יסודות", location: "יד השמונה", region: "jerusalem", stream: "unclassified", sources: G },
  { id: "mechina-yiftach", name: "מכינת יפתח", location: "רביד", region: "north", stream: "unclassified", sources: G },
  { id: "mechina-kerem-el", name: "מכינת כרם אל", location: "דליית אל כרמל", region: "north", stream: "general", wiki: { title: "מכינה קדם-צבאית כרם אל", facts: "מכינה דרוזית בדליית אל־כרמל שהוקמה ב־2008. בראשה עומד סא״ל מוניר מאדי." }, sources: [...G, COUNCIL("general/kerem-el", "מכינת כרם אל")] },
  { id: "mechina-lapidot", name: "מכינת לפידות", location: "מעלה מכמש", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/lapidot-emuna", "מכינת לפידות — אמונה")], note: "מועצת המכינות מציגה אותה גם ברשימת המכינות התורניות לבנים וגם בזו לבנות." },
  { id: "mechina-migdalor", name: "מכינת מגדלור", location: "בית ברל, תל יצחק", region: "center", stream: "unclassified", sources: G },
  { id: "mechina-magen-shaul", name: "מכינת מגן שאול", location: "נוקדים", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/magen-shaul", "מכינת מגן שאול — נוקדים")] },
  { id: "mechina-midreshet-hashiluv", name: "מדרשת השילוב", location: "נטור", region: "north", stream: "unclassified", sources: G },
  { id: "mechina-meitzar", name: "מכינת מיצר", location: "מיצר", region: "north", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-meitarim-lachish", name: "מכינת מיתרים לכיש", location: "בית גוברין, נחל עוז, דורות, גבים", region: "south", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-melach-haaretz", name: "מכינת מלח הארץ", location: "מצפה שלם, עין גדי", region: ["judea_samaria", "south"], stream: "unclassified", sources: G },
  { id: "mechina-mimaamakim", name: "מכינת ממעמקים", location: "מועצה אזורית אשכול (בסמוך לקיבוץ מגן)", region: "south", stream: "general", sources: [...G, COUNCIL("general/2023-08-29-08-47-18", "מכינת מעמקים")] },
  { id: "mechina-menashrim", name: "מכינת מנשרים", location: "קלו, קיבוץ אילון", region: "north", stream: "unclassified", sources: GOV_2027_ONLY },
  { id: "mechina-maoz-lod", name: "מכינת מעוז", location: "לוד", region: "center", stream: "torani", sources: [...G, COUNCIL("torani/maoz", "מכינת מעוז")] },
  { id: "mechina-maskiot", name: "מכינת משכיות", location: "משכיות", region: "judea_samaria", stream: "torani", sources: [...G, COUNCIL("torani/mashahiyot", "מכינת משכיות")] },
  { id: "mechina-nachshon", name: "מכינת נחשון", location: "מקווה ישראל, שובל, שדרות", region: ["center", "south"], stream: "general", coed: true, sources: [...G, COUNCIL_EN, ENWIKI_MECHINA], note: "ויקיפדיה האנגלית מתארת אותה כמכינה חילונית." },
  { id: "mechina-oz-shlomo", name: "מכינת עז שלמה", location: "מרכז שפירא, אור יהודה", region: ["south", "center"], stream: "torani", sources: [...G, COUNCIL("torani/oz-shlomo", "מכינת עז שלמה")] },
  { id: "mechina-ateret-yerushalayim", name: "מכינת עטרת ירושלים", location: "העיר העתיקה, ירושלים", region: "jerusalem", stream: "torani", sources: [...G, A7_TORAH_WORLD] },
  { id: "mechina-amichai", name: "מכינת עמיחי", location: "כרמים, באר שבע", region: "south", stream: "general", sources: [...G, COUNCIL("general/ami-hai", "מכינת עמי־חי")] },
  { id: "mechina-arava", name: "מכינת ערבה", location: "חצבה, עין יהב, פארן, צופר", region: "south", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-tzahali", name: "מכינת צהלי", location: "עין צורים, קבוצת יבנה", region: ["south", "center"], stream: "torani_girls", sources: [...G, COUNCIL_ORTHODOX_EN] },
  { id: "mechina-ruach-hasade", name: "מכינת רוח השדה", location: "בארות יצחק", region: "center", stream: "torani", sources: [...G, COUNCIL("torani/windfield", "רוח השדה")] },
  { id: "mechina-ruach-nachon", name: "מכינת רוח נכון", location: "ירושלים", region: "jerusalem", stream: "unclassified", sources: G },
  { id: "mechina-rakia", name: "מכינת רקיע", location: "חריש", region: "north", stream: "general", coed: true, sources: [...G, COUNCIL_EN] },
  { id: "mechina-shuvu-achim", name: "מכינת שובו אחים", location: "רחובות", region: "center", stream: "torani", sources: [...G, A7_TORAH_WORLD], note: "ערוץ 7 מונה אותה בין המכינות התורניות." },
  { id: "mechina-tavor", name: "מכינת תבור", location: "נוף הגליל, רמת השופט", region: "north", stream: "general", coed: true, wiki: { title: "המדרשה למנהיגות ציונית תבור", facts: "המדרשה למנהיגות ציונית תבור הוקמה ב־2010 בנוף הגליל. השלוחה הראשית של המכינה פועלת שם, ויש שלוחות נוספות ברמת השופט, במסדה ובקריית שמונה.", location: "נוף הגליל" }, sources: [...G, COUNCIL_EN] },
  { id: "mechina-telem", name: "מכינת תל״ם", location: "תל אביב־יפו, חולון", region: "center", stream: "general", coed: true, wiki: { title: "המכינה ביפו", facts: "מכינת תל״ם נוסדה ביפו ב־2003 על ידי התנועה הרפורמית בישראל.", location: "יפו" }, sources: [...G, COUNCIL_EN] },
  { id: "mechina-tamir", name: "מכינת תמיר", location: "קצרין", region: "north", stream: "torani", sources: [...G, COUNCIL("torani/tamir", "מכינת תמיר")] },
  // Not on the state's list for תשפ״ז; found through Hebrew Wikipedia (checked 2026-10-23).
  { id: "mechina-yeruham", name: "מכינת ירוחם", region: "south", stream: "unclassified", wiki: { title: "מכינת ירוחם", facts: "מכינה בירוחם שהוקמה ב־2012 על ידי הסוכנות היהודית, מכינות ״אופק״, עמותת ״דרך ארץ״ ועמותת ״צעירים בירוחם״.", location: "ירוחם" }, sources: [], note: "המכינה לא מופיעה ברשימת המכינות המוכרות לתשפ״ז. מצאנו אותה רק בוויקיפדיה, ולא בדקנו מול המכינה שהיא פועלת היום." },
  { id: "mechina-gvana", name: "מכינת גוונא", region: "jerusalem", stream: "unclassified", halfYear: true, wiki: { title: "מכינת גוונא", facts: "מכינה חצי־שנתית בקיבוץ קריית ענבים שנוסדה ב־2023, לצעירים וצעירות יוצאי החברה החרדית.", location: "קריית ענבים" }, sources: [], note: "המכינה לא מופיעה ברשימת המכינות המוכרות לתשפ״ז, והיא חצי־שנתית. מצאנו אותה רק בוויקיפדיה, ולא בדקנו מול המכינה שהיא פועלת היום." },
  { id: "mechina-shachar", name: "מכינת שחר", stream: "unclassified", halfYear: true, wiki: { title: "מכינה קדם-צבאית שחר", facts: "מכינה חצי־שנתית עם שלוחות רבות ברחבי הארץ; שנת הלימודים מסתיימת בסוף פברואר או בתחילת מרץ. יוזם הרעיון הוא אוריאל אלדד." }, sources: [], note: "המכינה לא מופיעה ברשימת המכינות המוכרות לתשפ״ז, והיא חצי־שנתית. מצאנו אותה רק בוויקיפדיה, ולא בדקנו מול המכינה שהיא פועלת היום." },
];

// ───────────────────────── ישיבות הסדר ─────────────────────────
// Base list: members of the Hesder Yeshivot Association (hesder.org.il, 62 names). Already in
// institutions.ts: הר עציון, הכותל, הר ברכה, ירוחם, שעלבים, ברכת משה, עתניאל (= ״בית ועד הר חברון״),
// בית אל (as a higher yeshiva), and שדרות (probably ״אפיקי דעת״ — not added again until confirmed).
// Then hesder yeshivot named by Arutz 7's 2025 survey that the association list does not include.

const HESDER: Entry[] = [
  { id: "hesder-nahariya", name: "ישיבת ההסדר נהר דעה — נהריה", location: "נהריה", fromName: true, region: "north", wiki: { title: "ישיבת נהריה", facts: "״נהר דעה״, נוסדה בשנת תשנ״ה (1995) על ידי הרב ישעיהו מייטליס והרב חיים רטיג.", location: "נהריה" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%a0%d7%94%d7%a8-%d7%93%d7%a2%d7%94-%d7%a0%d7%94%d7%a8%d7%99%d7%94"), A7_TORAH_WORLD] },
  { id: "hesder-binot-raanana", name: "ישיבת ההסדר בינות, רעננה", location: "רעננה", fromName: true, region: "center", wiki: { title: "ישיבת בינות", facts: "ישיבת הסדר וישיבה גבוהה שהוקמה בשנת תשס״ב (2002) ברעננה. בראשה הרב חיים רטיג." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%91%d7%99%d7%a0%d7%95%d7%aa-%d7%a8%d7%a2%d7%a0%d7%a0%d7%94"), A7_TORAH_WORLD] },
  { id: "hesder-akko", name: "ישיבת ההסדר עכו — רוח צפונית", location: "עכו", fromName: true, region: "north", wiki: { title: "ישיבת ההסדר עכו", facts: "ישיבת הסדר שהוקמה בשנת תשס״ג (2003) בעכו, בראשות הרב יוסי שטרן." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%95%d7%97-%d7%a6%d7%a4%d7%95%d7%a0%d7%99%d7%aa"), A7_TORAH_WORLD] },
  { id: "hesder-or-vishua-haifa", name: "ישיבת ההסדר אור וישועה, חיפה", location: "חיפה", fromName: true, region: "north", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8-%d7%95%d7%99%d7%a9%d7%95%d7%a2%d7%94"), SCIENCE_YESHIVOT] },
  { id: "hesder-maalot", name: "ישיבת ההסדר מעלות יעקב הרצוג", location: "מעלות", region: "north", wiki: { title: "ישיבת מעלות", facts: "״מעלות יעקב״, ישיבת הסדר של מרכז ישיבות בני עקיבא. בראשה הרב יהושע ויצמן.", location: "מעלות-תרשיחא" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%9e%d7%a2%d7%9c%d7%95%d7%aa-%d7%99%d7%a2%d7%a7%d7%91-%d7%94%d7%a8%d7%a6%d7%95%d7%92"), SCIENCE_YESHIVOT, A7_TORAH_WORLD] },
  { id: "hesder-orot-shaul", name: "ישיבת ההסדר אורות שאול", region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8%d7%95%d7%aa-%d7%a9%d7%90%d7%95%d7%9c"), A7_TORAH_WORLD], note: "איגוד ישיבות ההסדר משייך אותה לאזור גוש דן; היישוב עצמו לא אומת." },
  { id: "hesder-shavei-shomron", name: "ישיבת ההסדר נחלת יוסף — שבי שומרון", location: "שבי שומרון", fromName: true, region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%9b%d7%95%d7%9c%d7%9c-%d7%a9%d7%91%d7%99-%d7%a9%d7%95%d7%9e%d7%a8%d7%95%d7%9f"), A7_TORAH_WORLD] },
  { id: "hesder-orot-yaakov-rehovot", name: "ישיבת ההסדר אורות יעקב, רחובות", location: "רחובות", region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8%d7%95%d7%aa-%d7%99%d7%a2%d7%a7%d7%91-%d7%a8%d7%97%d7%95%d7%91%d7%95%d7%aa"), SCIENCE_YESHIVOT] },
  { id: "hesder-lev-tel-aviv", name: "ישיבת ההסדר לב תל אביב", location: "תל אביב", fromName: true, region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%9c%d7%91-%d7%aa%d7%9c-%d7%90%d7%91%d7%99%d7%91"), A7_TORAH_WORLD] },
  { id: "hesder-or-meofir", name: "ישיבת ההסדר אור מאופיר", region: "center", wiki: { title: "אור מאופיר", facts: "מסגרת ישיבתית שפועלת כמכינה קדם־אקדמית וקדם־צבאית לצעירים יוצאי אתיופיה. הוקמה ב־1995 ביישוב מרכז שפירא, בחסות ישיבת אור עציון.", location: "מרכז שפירא" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8-%d7%9e%d7%90%d7%95%d7%a4%d7%99%d7%a8"), A7_TORAH_WORLD], note: "איגוד ישיבות ההסדר משייך אותה לאזור השפלה; היישוב עצמו לא אומת. לפי ערוץ 7 (2025) לא נפתח בה שיעור א׳ באותה שנה." },
  { id: "hesder-orot-ashkelon", name: "ישיבת ההסדר אורות התורה והחסד, אשקלון", location: "אשקלון", fromName: true, region: "south", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8%d7%95%d7%aa-%d7%90%d7%a9%d7%a7%d7%9c%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-hameiri", name: "ישיבת ההסדר המאירי", region: "jerusalem", wiki: { title: "ישיבת המאירי", facts: "ישיבת הסדר שהוקמה בשנת תשנ״ה (1995) בחסות המכללה האקדמית ליפשיץ. לומדים בה כ־80 תלמידים.", location: "קריית משה, ירושלים" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%94%d7%9e%d7%90%d7%99%d7%a8%d7%99"), ENWIKI_HESDER, A7_TORAH_WORLD], note: "איגוד ישיבות ההסדר משייך אותה לאזור ירושלים; הכתובת לא אומתה." },
  { id: "hesder-avinoam", name: "ישיבת אבינועם", location: "אביתר", region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%90%d7%91%d7%99%d7%a0%d7%95%d7%a2%d7%9d"), A7_TORAH_WORLD], note: "המיקום לפי ערוץ 7 (״ישיבת ההסדר אבינועם באביתר״)." },
  { id: "hesder-maale-efraim", name: "ישיבת ההסדר מעלה אפרים", location: "מעלה אפרים", fromName: true, region: "judea_samaria", wiki: { title: "ישיבת ההסדר מעלה אפרים", facts: "״אוצרות אפרים״, ישיבת הסדר בבקעת הירדן.", location: "מעלה אפרים" }, sources: [HESDER_ASSOC("%d7%9e%d7%a2%d7%9c%d7%94-%d7%90%d7%a4%d7%a8%d7%99%d7%9d"), ENWIKI_HESDER] },
  { id: "hesder-nof-hagalil", name: "מרכז תורני נוף הגליל", location: "נוף הגליל", fromName: true, region: "north", wiki: { title: "ישיבת ההסדר נוף הגליל", facts: "ישיבת הסדר של מרכז ישיבות ואולפנות בני עקיבא. בראשה הרב דני סגליס.", location: "נוף הגליל" }, sources: [HESDER_ASSOC("%d7%a0%d7%95%d7%a3-%d7%94%d7%92%d7%9c%d7%99%d7%9c"), SCIENCE_YESHIVOT] },
  { id: "hesder-hagolan", name: "ישיבת ההסדר הגולן", location: "אבני איתן", region: "north", wiki: { title: "ישיבת הגולן", facts: "ישיבת הסדר של מרכז ישיבות בני עקיבא. בראשה הרב יואל מנוביץ." }, note: "לפי ויקיפדיה הישיבה שוכנת בחיספין, ולפי איגוד ישיבות ההסדר באבני איתן. לא בדקנו מול הישיבה איזה מהם נכון היום.", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%94%d7%92%d7%95%d7%9c%d7%9f"), SCIENCE_YESHIVOT, A7_TORAH_WORLD] },
  { id: "hesder-reuta", name: "ישיבת ההסדר רעותא", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%a2%d7%95%d7%aa%d7%90"), A7_TORAH_WORLD], note: "המקורות סותרים לגבי המיקום: איגוד ישיבות ההסדר משייך אותה לאזור הדרום, וערוץ 7 כותב ״רעותא בכרמל״." },
  { id: "hesder-tzfat", name: "ישיבת ההסדר צפת", location: "צפת", fromName: true, region: "north", wiki: { title: "ישיבת ההסדר צפת", facts: "נוסדה בשנת 1997 על ידי הרב בניהו ברונר. בראשה הרב איל יעקבוביץ׳, ונשיאה הרב שמואל אליהו." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a6%d7%a4%d7%aa"), A7_TORAH_WORLD] },
  { id: "hesder-ramla", name: "ישיבת ההסדר רמלה", location: "רמלה", fromName: true, region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%9e%d7%9c%d7%94"), SCIENCE_YESHIVOT] },
  { id: "hesder-dimona", name: "ישיבת ההסדר דימונה", location: "דימונה", fromName: true, region: "south", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%93%d7%99%d7%9e%d7%95%d7%a0%d7%94"), A7_TORAH_WORLD] },
  { id: "hesder-lev-hatorah", name: "ישיבת לב התורה", region: "jerusalem", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%9c%d7%91-%d7%94%d7%aa%d7%95%d7%a8%d7%94"), A7_TORAH_WORLD], note: "איגוד ישיבות ההסדר משייך אותה לאזור ירושלים; הכתובת לא אומתה." },
  { id: "hesder-kerem-beyavneh", name: "ישיבת כרם ביבנה", location: "חבל יבנה", region: "center", wiki: { title: "ישיבת כרם ביבנה", facts: "ישיבת ההסדר הראשונה והישיבה הגבוהה הראשונה של בני עקיבא.", location: "ליד קבוצת יבנה" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%9b%d7%a8%d7%9d-%d7%93%d7%99%d7%91%d7%a0%d7%94"), SCIENCE_YESHIVOT, ENWIKI_HESDER] },
  { id: "hesder-karnei-shomron", name: "ישיבת ההסדר קרני שומרון", location: "קרני שומרון", region: "judea_samaria", wiki: { title: "ישיבת ההסדר קרני שומרון", facts: "ישיבת הסדר שנוסדה ב־1980 על ידי הרב שמואל הבר והרב אברהם קורצווייל, שעומדים בראשה. ידועה בשיטת הלימוד ״אסוקי שמעתתא אליבא דהלכתא״." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%a7%d7%a8%d7%a0%d7%99-%d7%a9%d7%95%d7%9e%d7%a8%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-or-akiva", name: "ישיבת ההסדר אור עקיבא", location: "אור עקיבא", fromName: true, region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8-%d7%a2%d7%a7%d7%99%d7%91%d7%90"), A7_TORAH_WORLD] },
  { id: "hesder-ramat-gan", name: "ישיבת ההסדר רמת גן", location: "רמת גן", region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%9e%d7%aa-%d7%92%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-tekoa", name: "ישיבת ההסדר תקוע", location: "תקוע", region: "judea_samaria", wiki: { title: "ישיבת תקוע", facts: "ישיבת הסדר ברוח חסידית שפועלת בתקוע מאז הקמתה בשנת תשנ״ט (1999). בראשה עומד הרב מיכל פאלק." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%aa%d7%a7%d7%95%d7%a2"), SCIENCE_YESHIVOT] },
  { id: "hesder-or-etzion", name: "ישיבת אור עציון", location: "מרכז שפירא", region: "south", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%90%d7%95%d7%a8-%d7%a2%d7%a6%d7%99%d7%95%d7%9f"), SCIENCE_YESHIVOT, A7_TORAH_WORLD] },
  { id: "hesder-givat-olga", name: "ישיבת ההסדר גבעת אולגה", location: "גבעת אולגה", fromName: true, region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%92%d7%91%d7%a2%d7%aa-%d7%90%d7%95%d7%9c%d7%92%d7%94"), A7_TORAH_WORLD] },
  { id: "hesder-rishon-letzion", name: "ישיבת ההסדר ראשון לציון", location: "ראשון לציון", region: "center", wiki: { title: "ישיבת ההסדר ראשון לציון", facts: "״אורות הראיה״, ישיבת הסדר וישיבה גבוהה שהוקמה בשנת תשנ״ו (1996). בראשה הרב שלמה לוי." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%90%d7%a9%d7%95%d7%9f-%d7%9c%d7%a6%d7%99%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-shilo", name: "ישיבת ההסדר שילה", location: "שילה", region: "judea_samaria", wiki: { title: "ישיבת שילה", facts: "ישיבת הסדר שהוקמה בשנת תשל״ט (1979). ראש הישיבה הרב אביב גמליאל, ונשיאה הרב מיכאל ברום." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a9%d7%99%d7%9c%d7%94"), A7_TORAH_WORLD] },
  { id: "hesder-shirat-moshe-jaffa", name: "ישיבת ההסדר פעמי יפו — שירת משה", location: "יפו", region: "center", wiki: { title: "ישיבת שירת משה", facts: "ישיבת הסדר וישיבה גבוהה ביפו, חלק מעמותת מאירים. בראשה הרב אליהו מאלי." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%a4%d7%a2%d7%9e%d7%99-%d7%99%d7%a4%d7%95-%d7%a9%d7%99%d7%a8%d7%aa-%d7%9e%d7%a9%d7%94"), SCIENCE_YESHIVOT] },
  { id: "hesder-birkat-yosef", name: "ישיבת ברכת יוסף", location: "אלון מורה", region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%91%d7%a8%d7%9b%d7%aa-%d7%99%d7%95%d7%a1%d7%a3"), SCIENCE_YESHIVOT] },
  { id: "hesder-nir-kiryat-arba", name: "ישיבת ניר קריית ארבע", location: "קריית ארבע", region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a0%d7%99%d7%a8-%d7%a7%d7%a8%d7%99%d7%99%d7%aa-%d7%90%d7%a8%d7%91%d7%a2-%d7%97%d7%91%d7%a8%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-kiryat-shmona", name: "ישיבת ההסדר קריית שמונה", location: "קריית שמונה", region: "north", wiki: { title: "ישיבת ההסדר קריית שמונה", facts: "ישיבת הסדר שנוסדה ב־1977 על ידי הרב צפניה דרורי, ולומדים בה כ־220 תלמידים." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a7%d7%a8%d7%99%d7%aa-%d7%a9%d7%9e%d7%95%d7%a0%d7%94"), SCIENCE_YESHIVOT] },
  { id: "hesder-neve-dekalim", name: "ישיבת ההסדר נווה דקלים", location: "אשדוד", region: "south", wiki: { title: "ישיבת נוה דקלים", facts: "שכנה בעבר בימית ובנוה דקלים שבגוש קטיף, וכיום באשדוד. בראשה הרב דוד גבריאלי.", location: "אשדוד" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%a0%d7%95%d7%94-%d7%93%d7%a7%d7%9c%d7%99%d7%9d"), SCIENCE_YESHIVOT, ENWIKI_HESDER] },
  { id: "hesder-netivot", name: "ישיבת ההסדר אהבת ישראל, נתיבות", location: "נתיבות", region: "south", wiki: { title: "ישיבת ההסדר נתיבות", facts: "״אהבת ישראל״, הוקמה בשנת תש״ס (2000). לומדים בה כחמישים תלמידים.", location: "נתיבות" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%94%d7%91%d7%aa-%d7%99%d7%a9%d7%a8%d7%90%d7%9c"), SCIENCE_YESHIVOT] },
  { id: "hesder-holon", name: "ישיבת ההסדר חולון", location: "חולון", region: "center", wiki: { title: "ישיבת הסדר חולון", facts: "ישיבת הסדר וגבוהה של מרכז ישיבות בני עקיבא, שהוקמה בשנת תשס״ד (2004).", location: "חולון" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%97%d7%95%d7%9c%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-ramat-hasharon", name: "ישיבת ההסדר רמת השרון", location: "רמת השרון", region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%a8%d7%9e%d7%aa-%d7%94%d7%a9%d7%a8%d7%95%d7%9f"), SCIENCE_YESHIVOT] },
  { id: "hesder-shadmot-neria", name: "ישיבת ההסדר הבקעה — שדמות נריה", location: "בקעת הירדן", region: "judea_samaria", wiki: { title: "ישיבת שדמות נריה", facts: "ישיבת הסדר ביישוב שדמות מחולה שבצפון בקעת הירדן, על שם הרב משה צבי נריה." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a9%d7%93%d7%9e%d7%95%d7%aa-%d7%a0%d7%a8%d7%99%d7%94"), ENWIKI_HESDER], note: "האזור (בקעת הירדן) לפי איגוד ישיבות ההסדר; היישוב עצמו לא אומת." },
  { id: "hesder-karmiel", name: "ישיבת ההסדר כרמיאל", location: "כרמיאל", region: "north", wiki: { title: "ישיבת כרמיאל", facts: "נוסדה באלול תשס״ג (2003), עם מסלולי ישיבה גבוהה והסדר. בראשה הרב יעקב ידיד.", location: "כרמיאל" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%9b%d7%a8%d7%9e%d7%99-%d7%90%d7%9c"), SCIENCE_YESHIVOT] },
  { id: "hesder-tefachot", name: "ישיבת ההסדר נתיב טפחות", location: "טפחות", region: "north", wiki: { title: "ישיבת נתיב טפחות", facts: "ישיבת הסדר במושב טפחות שבמרום הגליל. בראשה עומד הרב אייל גריינר." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a0%d7%aa%d7%99%d7%91-%d7%98%d7%a4%d7%97%d7%95%d7%aa"), SCIENCE_YESHIVOT] },
  { id: "hesder-lev-ladaat-sderot", name: "ישיבת ההסדר לב לדעת, שדרות", location: "שדרות", region: "south", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%9c%d7%91-%d7%9c%d7%93%d7%a2%d7%aa-%d7%a9%d7%93%d7%a8%d7%95%d7%aa"), A7_TORAH_WORLD], note: "ישיבה נפרדת מישיבת ההסדר שדרות (״אפיקי דעת״) — שתיהן מופיעות ברשימת האיגוד." },
  { id: "hesder-derech-chaim", name: "ישיבת ההסדר דרך חיים", location: "קריית גת", region: "south", wiki: { title: "ישיבת ההסדר דרך חיים", facts: "ישיבת הסדר דתית לאומית שנוסדה בשנת תשס״ו (2006).", location: "קריית גת" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%93%d7%a8%d7%9a-%d7%97%d7%99%d7%99%d7%9d"), A7_TORAH_WORLD], note: "המיקום לפי ערוץ 7 (״דרך חיים בקרית גת״)." },
  { id: "hesder-orot-moshe", name: "ישיבת ההסדר אורות משה", location: "ראש העין", region: "center", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%95%d7%a8%d7%95%d7%aa-%d7%9e%d7%a9%d7%94"), A7_TORAH_WORLD, ENWIKI_HESDER] },
  { id: "hesder-heichal-eliyahu", name: "ישיבת היכל אליהו, כוכב יעקב", location: "כוכב יעקב", region: "judea_samaria", wiki: { title: "ישיבת היכל אליהו", facts: "נוסדה בשם ״עץ חיים״ בשנת תרפ״ז (1927) במונטרה שבשווייץ על ידי הרב ירחמיאל אליהו בוצ׳קו, ועברה לישראל בשנת 1985.", location: "כוכב יעקב" }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a2%d7%a5-%d7%97%d7%99%d7%99%d7%9d-%d7%94%d7%99%d7%9b%d7%9c-%d7%90%d7%9c%d7%99%d7%94%d7%95"), SCIENCE_YESHIVOT] },
  { id: "hesder-afula", name: "ישיבת ההסדר חיבורים, עפולה", location: "עפולה", region: "north", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%9e%d7%99%d7%aa-%d7%a2%d7%a4%d7%95%d7%9c%d7%94"), SCIENCE_YESHIVOT] },
  { id: "hesder-ayelet-hashachar-eilat", name: "ישיבת ההסדר איילת השחר", location: "אילת", region: "south", wiki: { title: "ישיבת איילת השחר", facts: "ישיבה גבוהה וישיבת הסדר באילת, מקבוצת ״ישיבות הקו״, שהוקמה באלול תשנ״ז (1997). בראשה עומד הרב יוסי רודריגז." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%90%d7%99%d7%99%d7%9c%d7%aa-%d7%94%d7%a9%d7%97%d7%a8"), SCIENCE_YESHIVOT, A7_TORAH_WORLD] },
  { id: "hesder-har-shalom-homesh", name: "ישיבת ההסדר הר שלום (חומש)", location: "חומש", fromName: true, region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a8-%d7%a9%d7%9c%d7%95%d7%9d-%d7%97%d7%95%d7%9e%d7%a9")] },
  { id: "hesder-kiryat-gat", name: "ישיבת ההסדר קריית גת", location: "קריית גת", region: "south", wiki: { title: "ישיבת ההסדר קריית גת", facts: "נוסדה בשנת תשס״ו (2006) על ידי הרב שלמה לוי. בראשה הרב שמעון פרץ." }, sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%a7%d7%a8%d7%99%d7%aa-%d7%92%d7%aa"), SCIENCE_YESHIVOT] },
  { id: "hesder-itamar", name: "ישיבת ההסדר איתמר", location: "איתמר", region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%a1%d7%93%d7%a8-%d7%90%d7%99%d7%aa%d7%9e%d7%a8"), SCIENCE_YESHIVOT] },
  { id: "hesder-mitzpe-ramon", name: "ישיבת ההסדר מצפה רמון", location: "מצפה רמון", region: "south", wiki: { title: "ישיבת מדברה כעדן", facts: "ישיבת ״מדברה כעדן״ במצפה רמון, מזרם ״ישיבות הקו״ והראשונה מבין הישיבות הציוניות בעיירות הפיתוח בנגב. יש בה מסלול ישיבה גבוהה ומסלול הסדר." }, sources: [HESDER_ASSOC("%d7%9e%d7%a6%d7%a4%d7%94-%d7%a8%d7%9e%d7%95%d7%9f"), A7_TORAH_WORLD, ENWIKI_HESDER] },
  { id: "hesder-netzer-matai", name: "ישיבת נצר מטעי", location: "אריאל", region: "judea_samaria", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%a0%d7%a6%d7%a8-%d7%9e%d7%98%d7%a2%d7%99"), A7_TORAH_WORLD] },
  { id: "hesder-beit-shean", name: "ישיבת ההסדר בית שאן", location: "בית שאן", region: "north", sources: [HESDER_ASSOC("%d7%99%d7%a9%d7%99%d7%91%d7%aa-%d7%94%d7%94%d7%a1%d7%93%d7%a8-%d7%91%d7%99%d7%aa-%d7%a9%d7%90%d7%9f"), SCIENCE_YESHIVOT] },
  // Not on the association's list; named as hesder yeshivot by Arutz 7 (2025).
  { id: "hesder-orot-netanya", name: "ישיבת ההסדר אורות נתניה", location: "נתניה", region: "center", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-beer-hatchiya", name: "ישיבת ההסדר באר התחיה", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-tirat-hacarmel", name: "ישיבת ההסדר טירת הכרמל (שלוחת גבעת אולגה)", location: "טירת הכרמל", region: "north", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-machanayim", name: "ישיבת ההסדר מחניים", region: "judea_samaria", wiki: { title: "ישיבת מחנים", facts: "״אור תורה מחנים״, של מוסדות אור תורה סטון, ברוח האורתודוקסיה המודרנית. בראשה הרב יוסי פרומן.", location: "מגדל עוז" }, sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-merchav-am", name: "ישיבת ההסדר מרחב עם", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-sdot-negev", name: "ישיבת ההסדר שדות נגב", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-siach-yitzchak", name: "ישיבת שיח יצחק", location: "אפרת", region: "judea_samaria", wiki: { title: "ישיבת שיח יצחק", facts: "ישיבת הסדר בגבעת הדגן באפרת. בראשה עומדים הרב יאיר דרייפוס, הרב ד״ר נעם סמט והרב ד״ר אורי ליפשיץ." }, sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT, ENWIKI_HESDER] },
  { id: "hesder-torah-betzion", name: "ישיבת תורה בציון", location: "אפרת", region: "judea_samaria", sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "hesder-or-torah-karmiel", name: "ישיבת ההסדר אור תורה מטיבתא, כרמיאל", location: "כרמיאל", region: "north", sources: [A7_TORAH_WORLD, MOD_HESDER] },
  { id: "hesder-ramat-arbel", name: "ישיבת ההסדר רמת ארבל (שלוחת טפחות)", location: "רמת ארבל", region: "north", sources: [A7_TORAH_WORLD] },
  { id: "hesder-shiluvim-pisgat-zeev", name: "ישיבת ההסדר שילובים, פסגת זאב", location: "פסגת זאב, ירושלים", region: "jerusalem", sources: [A7_NEW_YESHIVOT] },
  // Not on the association's list or in Arutz 7's survey; found through Hebrew Wikipedia (checked 2026-10-23).
  { id: "hesder-mishmar-hatorah", name: "ישיבת ההסדר משמר התורה", region: "jerusalem", wiki: { title: "ישיבת ההסדר משמר התורה", facts: "ישיבת הסדר חרדית בירושלים. בראשה הרב דוד לייבל.", location: "ירושלים" }, sources: [], note: "הישיבה לא מופיעה ברשימת איגוד ישיבות ההסדר ולא בסקירת ערוץ 7. מצאנו אותה רק בוויקיפדיה, ולא בדקנו מול הישיבה שהיא פועלת היום." },
];

// ───────────────────────── ישיבות גבוהות ─────────────────────────
// No official list exists. Names from Arutz 7's 2025 survey of the Religious-Zionist yeshiva world and
// its June 2025 report on new yeshivot, with locations from those articles or the science.co.il
// directory. Already in institutions.ts: מרכז הרב, הר המור, בית אל.

const A7 = [A7_TORAH_WORLD];

const YESHIVOT: Entry[] = [
  { id: "yeshiva-orot-ashkelon", name: "ישיבת אורות אשקלון", location: "אשקלון", fromName: true, region: "south", sources: A7 },
  { id: "yeshiva-bnei-dekalim", name: "ישיבת בני דקלים", sources: A7 },
  { id: "yeshiva-bnei-rachel", name: "ישיבת בני רחל", region: "judea_samaria", wiki: { title: "ישיבת בני רחל", facts: "ישיבה גבוהה במתחם קבר רחל בבית לחם, ברוח הראי״ה קוק. לומדים בה כ־40 תלמידים וכ־40 אברכים.", location: "קבר רחל, בית לחם" }, sources: A7 },
  { id: "yeshiva-binyan-ariel", name: "ישיבת בניין אריאל", location: "פתח תקווה", region: "center", sources: A7 },
  { id: "yeshiva-bruchin", name: "ישיבת ברוכין", location: "ברוכין", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-bruchin-lod", name: "ישיבת לוד (שלוחת ברוכין)", location: "לוד", region: "center", sources: A7 },
  { id: "yeshiva-bruchin-tiberias", name: "ישיבת טבריה (שלוחת ברוכין)", location: "טבריה", region: "north", sources: [A7_TORAH_WORLD, A7_NEW_YESHIVOT] },
  { id: "yeshiva-gimzo", name: "ישיבת גמזו", location: "גמזו", fromName: true, region: "center", sources: A7 },
  { id: "yeshiva-dror-hiran", name: "ישיבת דרור", location: "חירן", region: "south", sources: A7, note: "המיקום לפי ערוץ 7 (״ישיבת דרור בחירן״)." },
  { id: "yeshiva-hamikdash", name: "ישיבת המקדש", sources: A7 },
  { id: "yeshiva-herzliya", name: "ישיבת הרצליה", location: "הרצליה", fromName: true, region: "center", sources: A7 },
  { id: "yeshiva-zimrat-haaretz", name: "ישיבת זמרת הארץ", location: "קריית ארבע", region: "judea_samaria", sources: A7 },
  { id: "yeshiva-homesh", name: "ישיבת חומש", location: "חומש", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-chomot-yerushalayim", name: "ישיבת חומות ירושלים", location: "ירושלים", region: "jerusalem", sources: A7 },
  { id: "yeshiva-yinon-shmo", name: "ישיבת ינון שמו", sources: A7 },
  { id: "yeshiva-kochav-hashachar", name: "ישיבת כוכב השחר", location: "כוכב השחר", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-mor-dror-katzrin", name: "ישיבת מור דרור", location: "קצרין", region: "north", sources: A7 },
  { id: "yeshiva-moriah", name: "ישיבת מוריה", sources: A7 },
  { id: "yeshiva-machon-meir", name: "ישיבת מכון מאיר", location: "ירושלים", region: "jerusalem", sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-mimidbar-matana", name: "ישיבת ממדבר מתנה", sources: A7 },
  { id: "yeshiva-maale-eliyahu", name: "ישיבת מעלה אליהו", location: "תל אביב", region: "center", wiki: { title: "ישיבת מעלה אליהו", facts: "ישיבה גבוהה ציונית דתית בתל אביב־יפו, על שם עו״ד אליהו מירון. בראשה עומד הרב חיים גנץ." }, sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-mitzpe-yericho", name: "ישיבת נתיבות יוסף, מצפה יריחו", location: "מצפה יריחו", region: "judea_samaria", wiki: { title: "ישיבת נתיבות יוסף", facts: "מרכז תורני ביישוב מצפה יריחו בראשות הרב שבתי סבתו, הכולל ישיבה תיכונית, את הישיבה הגבוהה ״מאור טוביה״ וכולל אברכים." }, sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-noam-hashem-ramot", name: "ישיבת נועם ה׳", location: "רמות", sources: A7, note: "ערוץ 7 כותב ״נועם השם ברמות״; לא אומת לאיזה יישוב או שכונה בשם רמות הכוונה." },
  { id: "yeshiva-nachliel", name: "ישיבת נחליאל", location: "נחליאל", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-neta-yeminecha", name: "ישיבת נטע ימינך", sources: A7 },
  { id: "yeshiva-netiv-aryeh", name: "ישיבת נתיב אריה", location: "ירושלים", region: "jerusalem", sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-netivot-dror-telem", name: "ישיבת נתיבות דרור", location: "תלם", region: "judea_samaria", sources: A7 },
  { id: "yeshiva-netivot-yisrael-bat-yam", name: "ישיבת נתיבות ישראל", location: "בת ים", region: "center", sources: A7 },
  { id: "yeshiva-netivot-neria", name: "ישיבת נתיבות נריה", sources: A7 },
  { id: "yeshiva-nachalat-yisrael-migdal-haemek", name: "ישיבת נחלת ישראל", location: "מגדל העמק", region: "north", sources: A7 },
  { id: "yeshiva-oz-veemuna", name: "ישיבת עוז ואמונה", sources: A7 },
  { id: "yeshiva-eli", name: "ישיבת עלי", location: "עלי", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-ateret-cohanim", name: "ישיבת עטרת כהנים", sources: A7 },
  { id: "yeshiva-ateret-mordechai-tzfat", name: "ישיבת עטרת מרדכי", location: "צפת", region: "north", sources: A7 },
  { id: "yeshiva-ateret-nechemia", name: "ישיבת עטרת נחמיה", sources: A7 },
  { id: "yeshiva-od-yosef-chai", name: "ישיבת עוד יוסף חי", location: "יצהר", region: "judea_samaria", wiki: { title: "ישיבת עוד יוסף חי", facts: "ישיבה גבוהה חרדית־לאומית ברוח חסידית, שהוקמה בשנת תשמ״ב (1982)." }, sources: A7 },
  { id: "yeshiva-kedumim", name: "ישיבת קדומים", location: "קדומים", fromName: true, region: "judea_samaria", sources: A7 },
  { id: "yeshiva-rosh-pina", name: "ישיבת ראש פינה", location: "ראש פינה", fromName: true, region: "north", sources: A7 },
  { id: "yeshiva-roeh-yisrael", name: "ישיבת רועה ישראל", location: "יצהר", region: "judea_samaria", sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-ramot", name: "ישיבת רמות", sources: A7 },
  { id: "yeshiva-shavei-hevron", name: "ישיבת שבי חברון", location: "חברון", region: "judea_samaria", wiki: { title: "ישיבת שבי חברון", facts: "ישיבה גבוהה מבית המדרש של הרב קוק ובנו הרב צבי יהודה קוק. הוקמה בשנת תש״מ (1980) ככולל, ולאחר שנתיים הפכה לישיבה.", location: "בית רומנו, חברון" }, sources: [A7_TORAH_WORLD, SCIENCE_YESHIVOT] },
  { id: "yeshiva-shavei-hevron-yokneam", name: "ישיבת יקנעם (שלוחת שבי חברון)", location: "יקנעם", region: "north", sources: [A7_TORAH_WORLD, A7_NEW_YESHIVOT] },
  { id: "yeshiva-shalom-banayich", name: "ישיבת שלום בניך הגבוהה (שלום ירושלים)", location: "ירושלים", region: "jerusalem", sources: A7 },
  { id: "yeshiva-torat-hachaim", name: "ישיבת תורת החיים", sources: A7 },
  { id: "yeshiva-tiferet-yisrael-yad-binyamin", name: "ישיבת תפארת ישראל", location: "יד בנימין", region: "center", sources: A7 },
  { id: "yeshiva-netanya", name: "הישיבה הגבוהה בנתניה (שלוחת ישיבת בית אל)", location: "נתניה", region: "center", sources: [A7_NEW_YESHIVOT, A7_TORAH_WORLD] },
  { id: "yeshiva-magen-shaul-nokdim", name: "ישיבת מגן שאול", location: "נוקדים", region: "judea_samaria", sources: [A7_NEW_YESHIVOT, A7_TORAH_WORLD] },
  { id: "yeshiva-rvava", name: "ישיבת רבבה", location: "רבבה", region: "judea_samaria", sources: [A7_NEW_YESHIVOT] },
  { id: "yeshiva-gofna", name: "ישיבת גופנה", location: "גופנה", sources: [A7_NEW_YESHIVOT], note: "לא אומת באיזה אזור נמצא המקום." },
  { id: "yeshiva-heichal-meir-yehuda", name: "ישיבת היכל מאיר יהודה", location: "העיר העתיקה, ירושלים", region: "jerusalem", sources: [A7_NEW_YESHIVOT] },
  { id: "yeshiva-ramla", name: "הישיבה הגבוהה ברמלה", location: "רמלה", region: "center", sources: [A7_NEW_YESHIVOT] },
  { id: "yeshiva-kumi-ori-harish", name: "ישיבת קומי אורי", location: "חריש", region: "north", sources: [A7_NEW_YESHIVOT] },
  { id: "yeshiva-etz-efraim", name: "בית המדרש עץ אפרים", location: "מעלה חלחול", region: "judea_samaria", sources: A7 },
  { id: "yeshiva-ateret-yerushalayim", name: "ישיבת עטרת ירושלים", location: "ירושלים", region: "jerusalem", sources: [SCIENCE_YESHIVOT] },
];

// ───────────────────────── מסלולי צה״ל ─────────────────────────

const SERVICE_YEAR: Institution = {
  id: "idf-service-year",
  slug: "service-year",
  name: "שנת שירות לפני הגיוס",
  pathway: "idf",
  typeLabel: "שנת התנדבות לפני השירות",
  kind: "track",
  regions: ["nationwide"],
  locationLabel: "במסגרות שונות ברחבי הארץ",
  shortDescription:
    "שנה של התנדבות למען הקהילה אחרי י״ב, שדוחה את הגיוס בשנה — לא מחליפה אותו. המתנדבים גרים לרוב בקומונות.",
  highlights: ["התנדבות בקהילה לפני הגיוס", "דוחה את הגיוס בשנה אחת"],
  limitations: [
    "שנת השירות לא מחליפה את הגיוס — היא דוחה אותו בשנה. התנאים הספציפיים של כל מסגרת לא אומתו כאן.",
  ],
  attributes: {
    torahIntensity: 0,
    militaryEmphasis: 1,
    militaryModel: "direct_service",
    torahServiceBalance: null,
    religiousEnvironments: ["religious_zionist", "open_religious", "mixed_backgrounds", "general"],
    development: ["independence", "social"],
    serviceInterests: ["education_community"],
    environmentStyles: ["teamwork"],
    learningStyles: ["experiential"],
    strengths: ["community"],
    residential: "varies",
    duration: "one_year",
    communitySize: "varies",
    audience: "all",
  },
  profile: {
    overview:
      "לפי ״כל־זכות״, בוגרות ובוגרי י״ב יכולים לדחות את גיוסם בשנה ולהתנדב למען הקהילה — בפנימיות, בכפרי נוער, בבתי ספר שדה, בתנועות נוער, בשכונות ובמועדוניות. המתנדבים מתגוררים בקומונות ביישובים שונים, ומתחייבים לשירות צבאי או לאומי בתום השנה.",
    militaryIntegration: "שנת השירות ״איננה מחליפה את הגיוס, אלא דוחה אותו בשנה״ (כל־זכות).",
    admissions:
      "לפי ״כל־זכות״, נרשמים במהלך י״ב, בדרך כלל עד פברואר, ישירות למסגרת שבוחרים, ועוברים מיון. אחר כך חותמים על טופס דחיית שירות שנשלח במועד שקובע משרד הביטחון.",
    faq: [],
  },
  sources: [KOLZCHUT_SERVICE_YEAR],
  lastVerified: LISTED_ON,
  verificationStatus: "partial",
  verificationNotes: "המידע הכללי על שנת שירות מבוסס על ״כל־זכות״. אין כאן מידע על מסגרות ספציפיות, ומי מממן את השנה לא צוין במקור.",
  published: true,
};

export const directoryInstitutions: Institution[] = [
  SERVICE_YEAR,
  ...MECHINOT.map(mechina),
  ...HESDER.map(hesder),
  ...YESHIVOT.map(yeshiva),
];
