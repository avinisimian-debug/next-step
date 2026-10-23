import type { Pathway } from "@/lib/domain/types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "הצעד הבא";

/** One landing page per pathway, written for the words people search for ("מכינות קדם צבאיות", "ישיבות הסדר"). */
export const PATHWAY_PAGES: Record<Pathway, { slug: string; title: string; h1: string; description: string; noun: string }> = {
  idf: {
    slug: "tzahal",
    title: "צה״ל אחרי י״ב: מסלולי שירות ושנת שירות",
    h1: "צה״ל אחרי י״ב: מסלולי שירות",
    description: "גיוס לצה״ל ישר אחרי התיכון או שנת שירות לפני הגיוס: מה כל מסלול כולל, למי הוא מתאים, ואיך משווים אותו למכינה ולישיבה.",
    noun: "מסלולים",
  },
  mechina: {
    slug: "mechinot",
    title: "מכינות קדם־צבאיות: רשימת המכינות בישראל לפי אזור",
    h1: "מכינות קדם־צבאיות: כל המכינות לפי אזור",
    description: "רשימת המכינות הקדם־צבאיות בישראל לפי אזור: מכינות תורניות, כלליות ומעורבות, עם מיקום, מקורות ושאלון שעוזר לבחור מכינה.",
    noun: "מכינות",
  },
  hesder: {
    slug: "yeshivot-hesder",
    title: "ישיבות הסדר: רשימת ישיבות ההסדר בישראל לפי אזור",
    h1: "ישיבות הסדר: כל הישיבות לפי אזור",
    description: "רשימת ישיבות ההסדר בישראל לפי אזור, עם מיקום, פרטי רקע ומקורות. משלבים לימוד תורה ושירות צבאי, ומשווים בין הישיבות במקום אחד.",
    noun: "ישיבות",
  },
  yeshiva: {
    slug: "yeshivot",
    title: "ישיבות גבוהות: רשימת הישיבות הגבוהות לפי אזור",
    h1: "ישיבות גבוהות: כל הישיבות לפי אזור",
    description: "רשימת ישיבות גבוהות ציוניות־דתיות בישראל לפי אזור, עם מיקום ומקורות, ושאלון שעוזר להבין איזו ישיבה מתאימה לך אחרי י״ב.",
    noun: "ישיבות",
  },
};

export const pathwayFromSlug = (slug: string): Pathway | undefined =>
  (Object.keys(PATHWAY_PAGES) as Pathway[]).find((p) => PATHWAY_PAGES[p].slug === slug);

export const pathwayHref = (p: Pathway) => `/maslul/${PATHWAY_PAGES[p].slug}`;
