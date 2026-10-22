"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStep } from "@/app/my-path/actions";
import type { FormState } from "@/app/account/actions";
import { Field, Notice, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFieldErrors } from "@/components/ui/useFieldErrors";

export function AddStepForm({ institutions }: { institutions: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(addStep, { status: "idle" });
  const { fieldError, formError } = useFieldErrors(state, { title: "step-title", detail: "step-detail", institution_id: "step-inst", due_date: "step-due" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "ok") ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <Field id="step-title" label="מה הצעד?" error={fieldError("title")}>
        <input id="step-title" name="title" required maxLength={200} placeholder="למשל: לבקר בשבת פתוחה" className={inputStyles} />
      </Field>
      <Field id="step-detail" label="פירוט (לא חובה)" error={fieldError("detail")}>
        <textarea id="step-detail" name="detail" maxLength={1000} rows={2} className={inputStyles} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="step-inst" label="קשור למסגרת (לא חובה)" error={fieldError("institution_id")}>
          <select id="step-inst" name="institution_id" defaultValue="" className={inputStyles}>
            <option value="">ללא</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="step-due" label="תאריך יעד (לא חובה)" error={fieldError("due_date")}>
          <input id="step-due" name="due_date" type="date" className={inputStyles} />
        </Field>
      </div>
      <SubmitButton pendingLabel="מוסיף…">הוספת צעד</SubmitButton>
      {formError && <Notice tone="error">{formError}</Notice>}
      {state.status === "ok" && <Notice tone="success">{state.message}</Notice>}
    </form>
  );
}
