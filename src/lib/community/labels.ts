import type { Role } from "@/lib/auth/viewer";

export const ROLE_LABELS: Record<Role, string> = {
  member: "חבר/ת קהילה",
  representative: "נציג/ה מאומת/ת של מסגרת",
  moderator: "מנהל/ת קהילה",
  admin: "מנהל/ת מערכת",
};

/** Content labels shown on every post, so readers know what kind of information they are reading. */
export const CONTENT_LABELS = {
  experience: { text: "ניסיון אישי", tone: "bg-sand-100 text-navy-800" },
  official: { text: "תשובה רשמית של המסגרת", tone: "bg-teal-100 text-teal-700" },
  ai: { text: "נוצר בעזרת בינה מלאכותית", tone: "bg-mist-100 text-navy-800" },
  test: { text: "תוכן בדיקה", tone: "bg-amber-100 text-amber-700" },
} as const;

export const REPORT_REASONS = {
  spam: "ספאם או פרסום",
  abuse: "פגיעה, הטרדה או שפה לא ראויה",
  misinformation: "מידע שגוי או מטעה",
  privacy: "חשיפת פרטים אישיים",
  other: "סיבה אחרת",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export const STATUS_LABELS = { published: "מפורסם", hidden: "מוסתר", removed: "הוסר" } as const;
