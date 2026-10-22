import type { StaticImageData } from "next/image";
import type { Pathway } from "@/lib/domain/types";
import hero from "@/assets/photos/hero.webp";
import idf from "@/assets/photos/idf.webp";
import mechina from "@/assets/photos/mechina.webp";
import hesder from "@/assets/photos/hesder.webp";
import yeshiva from "@/assets/photos/yeshiva.webp";

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

export const HERO_PHOTO: Photo = {
  src: hero,
  alt: "קבוצת צעירים במסע רגלי במדבר",
  author: "Judith89",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  source: "https://commons.wikimedia.org/wiki/File:Youth_hiking.JPG",
};

export const PATHWAY_PHOTOS: Record<Pathway, Photo> = {
  idf: {
    src: idf,
    alt: "לוחמי חטיבת גבעתי בסיום תרגיל מסכם של המסלול",
    author: "טור׳ ספיר סעד, דובר צה״ל",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Flickr_-_Israel_Defense_Forces_-_Soldiers_at_of_End_Combat_Training.jpg",
  },
  mechina: {
    src: mechina,
    alt: "חניכי מכינה קדם־צבאית במסע בין עצי זית",
    author: "אברהם שוורץ",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:%D7%9E%D7%9B%D7%99%D7%A0%D7%AA_%D7%90%D7%A8%D7%96_%D7%91%D7%90%D7%95%D7%A8_%D7%99%D7%94%D7%95%D7%93%D7%94.jpg",
  },
  hesder: {
    src: hesder,
    alt: "בית המדרש של ישיבת ההסדר הר עציון בזמן סדר בוקר",
    author: "מלא כל הארץ כבודי",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:%D7%99%D7%A9%D7%99%D7%91%D7%AA_%D7%94%D7%A8_%D7%A2%D7%A6%D7%99%D7%95%D7%9F_-%D7%A1%D7%93%D7%A8.jpg",
  },
  yeshiva: {
    src: yeshiva,
    alt: "בית המדרש של ישיבת עטרת ירושלים",
    author: "יעקב",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    source: "https://commons.wikimedia.org/wiki/File:Ateret_Yerushalayim_Yeshiva4431.jpg",
  },
};

export const ALL_PHOTOS: Photo[] = [HERO_PHOTO, ...Object.values(PATHWAY_PHOTOS)];
