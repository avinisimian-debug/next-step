"use client";

import Link from "next/link";
import { Route } from "lucide-react";
import { KEYS, useStored } from "@/lib/client/store";

/** For a returning visitor with saved answers or places: a direct way back into their journey. */
export function ResumeLink() {
  const [answers, , hydrated] = useStored<Record<string, unknown>>(KEYS.answers, {});
  const [favs] = useStored<string[]>(KEYS.favorites, []);
  if (!hydrated || (Object.keys(answers).length === 0 && favs.length === 0)) return null;
  return (
    <Link
      href="/journey"
      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-teal-600/30 bg-teal-100/70 px-4 py-3 text-sm font-medium text-teal-700 hover:bg-teal-100"
    >
      <Route className="size-4" aria-hidden="true" />
      כבר התחלת? להמשיך במסע שלי
    </Link>
  );
}
