"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Trash2 } from "lucide-react";
import { setContentStatus } from "@/app/community/actions";

/** Hide, restore or remove a post. Shown only to moderators; the database checks the role again. */
export function ModerationControls({
  targetType,
  targetId,
  status,
}: {
  targetType: "question" | "answer";
  targetId: string;
  status: "published" | "hidden" | "removed";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (next: "published" | "hidden" | "removed") =>
    startTransition(async () => {
      setError(null);
      const res = await setContentStatus(targetType, targetId, next);
      if (!res.ok) setError(res.message);
      else router.refresh();
    });

  const btn = "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-sand-100 disabled:opacity-50";
  return (
    <span className="inline-flex flex-wrap items-center gap-1 rounded-full border border-dashed border-sand-300 px-1" role="group" aria-label={`פעולות ניהול ל${targetType === "question" ? "שאלה" : "תשובה"}`}>
      {status === "published" ? (
        <button type="button" className={`${btn} text-amber-700`} disabled={pending} onClick={() => run("hidden")}>
          <EyeOff className="size-4" aria-hidden="true" />
          הסתרה
        </button>
      ) : (
        <button type="button" className={`${btn} text-teal-700`} disabled={pending} onClick={() => run("published")}>
          <Eye className="size-4" aria-hidden="true" />
          החזרה לפרסום
        </button>
      )}
      {status !== "removed" && (
        <button
          type="button"
          className={`${btn} text-rose-700`}
          disabled={pending}
          onClick={() => window.confirm("להסיר את התוכן? הוא לא יוצג לאף משתמש.") && run("removed")}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          הסרה
        </button>
      )}
      {error && (
        <span role="alert" className="px-2 text-xs text-rose-700">
          {error}
        </span>
      )}
    </span>
  );
}
