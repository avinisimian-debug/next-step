import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { safeNext } from "@/lib/auth/redirect";
import { NotConfigured, Notice } from "@/components/ui/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "התחברות", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const viewer = await getViewer();
  const dest = safeNext(next);
  if (viewer.state === "signed_in") redirect(dest);

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950">התחברות</h1>
      <p className="mt-3 leading-7 text-stone-600">
        חשבון מאפשר לשמור מסגרות, לבנות מפת דרך אישית ולשאול ולענות בקהילה. אין סיסמה: שולחים לכם קישור התחברות למייל.
      </p>
      <div className="mt-8">
        {viewer.state === "unconfigured" ? (
          <NotConfigured feature="החשבון האישי" />
        ) : (
          <div className="space-y-4">
            {error && <Notice tone="error">הקישור לא תקף או שפג תוקפו. אפשר לבקש קישור חדש.</Notice>}
            <LoginForm next={dest} />
          </div>
        )}
      </div>
      <p className="mt-8 text-xs leading-5 text-stone-600">
        אנחנו שומרים רק את כתובת המייל, את השם שתבחרו להציג ואת מה שתשמרו או תפרסמו. בכניסה לחשבון אתם מאשרים את{" "}
        <a href="/terms" className="underline">תנאי השימוש</a> ואת <a href="/privacy" className="underline">מדיניות הפרטיות</a>.
      </p>
    </div>
  );
}
