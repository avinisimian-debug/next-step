"use client";

import { useState, useTransition } from "react";
import { setSaved, updateSavedNote } from "@/app/actions/saved";
import { Button, inputStyles } from "@/components/ui/ui";
import { useRouter } from "next/navigation";

/** Personal note and remove control for one saved institution. */
export function SavedControls({ institutionId, name, note }: { institutionId: string; name: string; note: string | null }) {
  const [value, setValue] = useState(note ?? "");
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const fieldId = `note-${institutionId}`;

  const save = () =>
    startTransition(async () => {
      const res = await updateSavedNote(institutionId, value);
      setStatus(res.ok ? { error: false, text: "ההערה נשמרה." } : { error: true, text: res.message });
    });
  const remove = () =>
    startTransition(async () => {
      const res = await setSaved(institutionId, false);
      if (res.ok) router.refresh();
      else setStatus({ error: true, text: res.message });
    });

  return (
    <div className="mt-4 space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-navy-900">
        הערה אישית (רק את/ה רואה אותה)
      </label>
      <textarea
        id={fieldId}
        value={value}
        maxLength={500}
        rows={2}
        onChange={(e) => setValue(e.target.value)}
        className={inputStyles}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={save} disabled={pending || value === (note ?? "")}>
          שמירת הערה
        </Button>
        <Button variant="ghost" onClick={remove} disabled={pending} aria-label={`הסרה מהשמורים: ${name}`}>
          הסרה
        </Button>
        <span aria-live="polite" className={`text-sm ${status?.error ? "text-rose-700" : "text-teal-700"}`}>
          {status?.text}
        </span>
      </div>
    </div>
  );
}
