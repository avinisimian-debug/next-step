import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import "@fontsource/frank-ruhl-libre/500.css";
import "@fontsource/frank-ruhl-libre/700.css";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BottomNav } from "@/components/site/BottomNav";
import { AccessibilityMenu } from "@/components/site/AccessibilityMenu";
import Script from "next/script";
import { A11Y_KEY } from "@/lib/a11y";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "הצעד הבא: מכינות, ישיבות הסדר, ישיבות גבוהות וצה״ל אחרי י״ב",
    template: "%s · הצעד הבא",
  },
  description:
    "מכינה קדם־צבאית, ישיבת הסדר, ישיבה גבוהה או צה״ל? רשימות של המכינות והישיבות בישראל לפי אזור, השוואה ביניהן ושאלון קצר שמתאים לך מסלול ומקום אחרי י״ב.",
  applicationName: "הצעד הבא",
  // Set GOOGLE_SITE_VERIFICATION in Vercel to the code from Google Search Console ("HTML tag" method).
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    title: "הצעד הבא: המסלול שלך אחרי י״ב מתחיל כאן",
    description: "מוצאים את המסלול שמתאים לך אחרי י״ב: צה״ל, מכינה, ישיבת הסדר או ישיבה גבוהה.",
    locale: "he_IL",
    siteName: "הצעד הבא",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2236",
  width: "device-width",
  initialScale: 1,
};

// Applies the visitor's saved accessibility choices before first paint (see AccessibilityMenu).
const A11Y_BOOT = `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_KEY)})||"{}"),e=document.documentElement;if(p.text)e.setAttribute("data-a11y-text",String(p.text));["contrast","links","font","motion"].forEach(function(k){if(p[k])e.setAttribute("data-a11y-"+k,"1")})}catch(_){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT }} />
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
        <AccessibilityMenu />
        {/* Vercel Web Analytics: cookieless page-view counts. Served by Vercel once Analytics is enabled on the project. */}
        {process.env.VERCEL && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
