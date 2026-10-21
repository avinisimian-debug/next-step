"use client";

import { useActionState, useState, useTransition } from "react";
import { Flag, ThumbsUp } from "lucide-react";
import { reportContent, setHelpful } from "@/app/community/actions";
import type { FormState } from "@/app/account/actions";
import { REPORT_REASONS } from "@/lib/community/labels";
import { Notice, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function HelpfulButton({
  answerId,
  questionId,
  count,
  marked,
  disabledReason,
}: {
  answerId: string;
  questionId: string;
  count: number;
  marked: boolean;
  /** Set when the viewer can't mark this answer (signed out, or it's their own). */
  disabledReason?: string;
}) {
  const [on, setOn] = useState(marked);
  const [shown, setShown] = useState(count);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setError(null);
      const res = await setHelpful(answerId, questionId, !on);
      if (!res.ok) return setError(res.message);
      setShown((c) => c + (on ? -1 : 1));
      setOn(!on);
    });

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || Boolean(disabledReason)}
        aria-pressed={on}
        title={disabledReason}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-teal-100 text-teal-700" : "text-navy-800 hover:bg-sand-100"}`}
      >
        <ThumbsUp className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden="true" />
        עזר לי
        <span className="tabular-nums" aria-label={`${shown} סימונים`}>
          {shown}
        </span>
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-700">
          {error}
        </span>
      )}
    </span>
  );
}

export function ReportButton({ targetType, targetId }: { targetType: "question" | "answer"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(reportContent, { status: "idle" });
  const formId = `report-${targetId}`;

  if (state.status === "ok") return <Notice tone="success">{state.message}</Notice>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={formId}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-stone-600 hover:bg-sand-100"
      >
        <Flag className="size-4" aria-hidden="true" />
        דיווח
      </button>
      {open && (
        <form id={formId} action={action} className="mt-2 space-y-3 rounded-2xl border border-sand-200 bg-sand-50 p-4">
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />
          <fieldset>
            <legend className="text-sm font-medium text-navy-900">מה הבעיה?</legend>
            <div className="mt-2 space-y-1.5">
              {Object.entries(REPORT_REASONS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-navy-900">
                  <input type="radio" name="reason" value={value} required className="size-4 accent-navy-900" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm text-navy-900">
            פירוט (לא חובה)
            <textarea name="details" maxLength={1000} rows={2} className={`${inputStyles} mt-1`} />
          </label>
          <SubmitButton variant="secondary" pendingLabel="שולח…">
            שליחת דיווח
          </SubmitButton>
          {state.status === "error" && <Notice tone="error">{state.message}</Notice>}
        </form>
      )}
    </div>
  );
}
