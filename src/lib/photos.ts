import type { StaticImageData } from "next/image";
import type { Pathway } from "@/lib/domain/types";
import idf from "@/assets/photos/idf.webp";
import mechina from "@/assets/photos/mechina.webp";
import hesder from "@/assets/photos/hesder.webp";
import yeshiva from "@/assets/photos/yeshiva.webp";
import nationalService from "@/assets/photos/national-service.webp";
import midrasha from "@/assets/photos/midrasha.webp";

/**
 * Real photographs from Wikimedia Commons, each under a free licence that requires (or allows) credit.
 * The credit line is shown on top of every photo; the source page holds the full licence terms.
 * They illustrate a pathway in general. None of them is shown on a specific institution's page,
 * so a photo is never presented as "this is the place you are looking at".
 */
export type Photo = {
  src: StaticImageData;
  alt: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
};

/** A pathway without a free photo shows a tint instead. */
export const PATHWAY_PHOTOS: Partial<Record<Pathway, Photo>> = {
  idf: {
    src: idf,
    alt: "טירונים של חטיבת גולני בטקס ההשבעה ברחבת הכותל",
    author: "אורי שיפרין, דובר צה״ל",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Flickr_-_Israel_Defense_Forces_-_Golani_Swearing-In_Ceremony%2C_Jan_2011_%28cropped%29.jpg",
  },
  mechina: {
    src: mechina,
    alt: "חניכי מכינת הנגב יוצאים למסע עם תרמילים ומזרנים",
    author: "EratosthenesofAlexandria",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:%D7%A4%D7%A2%D7%99%D7%9C%D7%95%D7%AA_%D7%9E%D7%9B%D7%99%D7%A0%D7%AA_%D7%94%D7%A0%D7%92%D7%91.jpg",
  },
  hesder: {
    src: hesder,
    alt: "תלמידי ישיבת הסדר במדים, בזמן השירות הצבאי",
    author: "Igal310",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:SoldiersHesder.jpg",
  },
  yeshiva: {
    src: yeshiva,
    alt: "בית מדרש מלא לומדים",
    author: "דרגון",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    source: "https://commons.wikimedia.org/wiki/File:%D7%91%D7%99%D7%AA_%D7%9E%D7%93%D7%A8%D7%A9_%D7%99%D7%A9%D7%99%D7%91%D7%94_%D7%9C%D7%A6%D7%A2%D7%99%D7%A8%D7%99%D7%9D.jpg",
  },
  national_service: {
    src: nationalService,
    alt: "בנות שירות לאומי רוקדות עם קשישים במועדון בקהילה",
    author: "Michal pu",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:%D7%94%D7%AA%D7%A0%D7%93%D7%91%D7%95%D7%AA_%D7%A9%D7%9C_%D7%91%D7%A0%D7%95%D7%AA_%D7%A9%D7%99%D7%A8%D7%95%D7%AA_%D7%A2%D7%9D_%D7%A7%D7%A9%D7%99%D7%A9%D7%99%D7%9D_%D7%91%D7%A7%D7%94%D7%99%D7%9C%D7%94.jpg",
  },
  midrasha: {
    src: midrasha,
    alt: "שתי תלמידות לומדות יחד מול ספרים פתוחים בספריית מדרשה",
    author: "Shai Grin",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:The_students_a_Midreshet_Shilat.JPG",
  },
};

export const ALL_PHOTOS: Photo[] = Object.values(PATHWAY_PHOTOS).filter((p): p is Photo => !!p);
