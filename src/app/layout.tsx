import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import "@fontsource/frank-ruhl-libre/500.css";
import "@fontsource/frank-ruhl-libre/700.css";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BottomNav } from "@/components/site/BottomNav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXT STEP — הצעד הבא שלך אחרי התיכון",
    template: "%s · NEXT STEP",
  },
  description:
    "צה״ל, מכינה, ישיבת הסדר או ישיבה גבוהה? עונים על כמה שאלות קצרות ומקבלים שלושה כיוונים מותאמים אישית, עם הסבר שקוף ומידע מאומת.",
  openGraph: {
    title: "NEXT STEP — הצעד הבא שלך מתחיל כאן",
    description: "מוצאים את המסלול שמתאים לך אחרי י״ב: צה״ל, מכינה, ישיבת הסדר או ישיבה גבוהה.",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2236",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh flex flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-paper"
        >
          דילוג לתוכן הראשי
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
