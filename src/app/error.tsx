"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Route-level error boundary: e.g. the catalog source is unreachable or a record fails validation. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
      <h1 className="font-display text-3xl font-bold text-navy-950">משהו השתבש</h1>
      <p className="mt-3 leading-7 text-stone-600">
        לא הצלחנו לטעון את הדף. התשובות שלך שמורות בדפדפן ולא אבדו. אפשר לנסות שוב בעוד רגע.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper">
          לנסות שוב
        </button>
        <Link href="/" className="rounded-full border border-sand-300 px-5 py-2.5 text-sm font-medium text-navy-900">
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
