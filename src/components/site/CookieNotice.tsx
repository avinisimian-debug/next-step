"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { KEYS, useStored } from "@/lib/client/store";

/**
 * One-time notice that the site uses only essential cookies. Not a modal: it never blocks the page,
 * sits beside the accessibility button and disappears for good once dismissed.
 */
export function CookieNotice() {
  const pathname = usePathname() ?? "/";
  const [seen, setSeen, hydrated] = useStored<boolean>(KEYS.cookieNotice, false);
  if (!hydrated || seen || pathname === "/cookies") return null;
  // The questionnaire has no bottom tab bar, so the notice sits lower there.
  const bottom = pathname.startsWith("/questionnaire") ? "bottom-[calc(1rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]";
  return (
    <section
      aria-label="הודעה על עוגיות"
      className={`fixed ${bottom} start-3 end-[4.5rem] z-40 mx-auto max-w-md rounded-3xl border border-sand-200 bg-paper p-4 text-sm leading-6 text-navy-900 shadow-lift print:hidden lg:bottom-6 lg:end-24`}
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" />
        <p>
          באתר יש רק עוגיות שנחוצות כדי להתחבר לחשבון, ומדידת כניסות בלי עוגיות. אין עוגיות פרסום או מעקב.{" "}
          <Link href="/cookies" className="font-medium text-teal-700 underline underline-offset-4">
            מדיניות העוגיות
          </Link>
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setSeen(true)}
          className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-paper hover:bg-navy-800"
        >
          הבנתי
        </button>
      </div>
    </section>
  );
}
