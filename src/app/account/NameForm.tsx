"use client";

import { useActionState } from "react";
import { updateDisplayName, type FormState } from "./actions";
import { Field, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function NameForm({ current }: { current: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateDisplayName, { status: "idle" });
  const error = state.status === "error" ? state.message : undefined;
  return (
    <form action={action} className="space-y-3">
      <Field id="display_name" label="השם שמוצג בקהילה" hint="אפשר להשתמש בשם פרטי או בכינוי. לא מציגים את כתובת המייל." error={error}>
        <input
          id="display_name"
          name="display_name"
          defaultValue={current}
          minLength={2}
          maxLength={40}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "display_name-error" : "display_name-hint"}
          className={inputStyles}
        />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton variant="secondary">שמירה</SubmitButton>
        <span aria-live="polite" className="text-sm text-teal-700">
          {state.status === "ok" ? state.message : null}
        </span>
      </div>
    </form>
  );
}
