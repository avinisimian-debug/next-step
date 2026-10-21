"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveRegistryEntry } from "@/app/registry-review/actions";
import { Button, inputStyles } from "@/components/ui/ui";

const DECISIONS = {
  matched: "זו אותה מסגרת",
  not_applicable: "לא רלוונטי למאגר",
  inactive: "לא פעילה",
  unresolved: "חסרה במאגר — להוסיף אחרי אימות",
} as const;

export function ReviewRow({
  id,
  candidates,
  options,
  notes,
}: {
  id: string;
  candidates: string[];
  options: { id: string; name: string }[];
  notes: string | null;
}) {
  const [decision, setDecision] = useState<keyof typeof DECISIONS>(candidates.length ? "matched" : "unresolved");
  const [inst, setInst] = useState(candidates[0] ?? "");
  const [note, setNote] = useState(notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      setError(null);
      const res = await resolveRegistryEntry({ id, status: decision, institution_id: decision === "matched" ? inst || null : null, notes: note || null });
      if (!res.ok) setError(res.message);
      else router.refresh();
    });

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
      <label className="text-sm text-navy-900" htmlFor={`d-${id}`}>
        החלטה
      </label>
      <select id={`d-${id}`} value={decision} onChange={(e) => setDecision(e.target.value as keyof typeof DECISIONS)} className={inputStyles}>
        {Object.entries(DECISIONS).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      {decision === "matched" && (
        <>
          <label className="text-sm text-navy-900" htmlFor={`i-${id}`}>
            רשומה במאגר
          </label>
          <select id={`i-${id}`} value={inst} onChange={(e) => setInst(e.target.value)} className={inputStyles}>
            <option value="">בחירה…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {candidates.includes(o.id) ? "★ " : ""}
                {o.name}
              </option>
            ))}
          </select>
        </>
      )}
      <label className="text-sm text-navy-900" htmlFor={`n-${id}`}>
        הערה
      </label>
      <input id={`n-${id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className={inputStyles} />
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={pending}>
          {pending ? "שומר…" : "שמירת החלטה"}
        </Button>
        {error && (
          <span role="alert" className="text-sm text-rose-700">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
