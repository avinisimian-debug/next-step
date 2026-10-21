"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { deleteStep, moveStep, setStepStatus } from "@/app/my-path/actions";
import { inputStyles } from "@/components/ui/ui";

export interface StepView {
  id: string;
  title: string;
  detail: string | null;
  status: "todo" | "doing" | "done";
  due_date: string | null;
  institution: { name: string; slug: string } | null;
}

const STATUS_TEXT = { todo: "עוד לא התחלתי", doing: "בתהליך", done: "בוצע" } as const;
const STATUS_TONE = { todo: "border-sand-300", doing: "border-amber-700/40 bg-amber-100/40", done: "border-teal-600/40 bg-teal-100/40" } as const;

const formatDue = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

export function StepList({ steps }: { steps: StepView[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn().catch(() => ({ ok: false, message: "משהו השתבש. אפשר לנסות שוב." }));
      if (!res.ok) setError(res.message ?? "משהו השתבש.");
    });

  const done = steps.filter((s) => s.status === "done").length;

  return (
    <div>
      <p className="text-sm font-medium text-navy-900" aria-live="polite">
        בוצעו {done} מתוך {steps.length} צעדים
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <ol className="mt-4 space-y-3" aria-busy={pending}>
        {steps.map((s, idx) => (
          <li key={s.id} data-step={s.id} className={`rounded-2xl border p-4 ${STATUS_TONE[s.status]}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-navy-950 ${s.status === "done" ? "line-through decoration-stone-600/60" : ""}`}>{s.title}</p>
                {s.detail && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-stone-600">{s.detail}</p>}
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-stone-600">
                  {s.institution && (
                    <Link href={`/institutions/${s.institution.slug}`} className="underline underline-offset-2">
                      {s.institution.name}
                    </Link>
                  )}
                  {s.due_date && <span>יעד: {formatDue(s.due_date)}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <label className="sr-only" htmlFor={`status-${s.id}`}>
                  מצב הצעד: {s.title}
                </label>
                <select
                  id={`status-${s.id}`}
                  value={s.status}
                  disabled={pending}
                  onChange={(e) => run(() => setStepStatus(s.id, e.target.value))}
                  className={`${inputStyles} !w-auto !py-2 text-sm`}
                >
                  {Object.entries(STATUS_TEXT).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
                <IconButton label={`להזיז למעלה: ${s.title}`} disabled={pending || idx === 0} onClick={() => run(() => moveStep(s.id, "up"))}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label={`להזיז למטה: ${s.title}`} disabled={pending || idx === steps.length - 1} onClick={() => run(() => moveStep(s.id, "down"))}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton
                  label={`מחיקה: ${s.title}`}
                  disabled={pending}
                  onClick={() => window.confirm("למחוק את הצעד?") && run(() => deleteStep(s.id))}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full text-navy-800 hover:bg-sand-100 disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}
