"use client";

import { useActionState, useEffect, useRef } from "react";
import { postAnswer } from "@/app/community/actions";
import type { FormState } from "@/app/account/actions";
import { Field, Notice, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFieldErrors } from "@/components/ui/useFieldErrors";

export function AnswerForm({ questionId, canAnswerOfficially, institutionName }: { questionId: string; canAnswerOfficially: boolean; institutionName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(postAnswer, { status: "idle" });
  const { fieldError, formError } = useFieldErrors(state, { body: "answer-body" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "ok") ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="question_id" value={questionId} />
      <Field id="answer-body" label="התשובה שלך" hint="שתפו מניסיון אישי. אם אתם לא בטוחים במשהו — כתבו את זה." error={fieldError("body")}>
        <textarea id="answer-body" name="body" required minLength={2} maxLength={4000} rows={5} className={inputStyles} />
      </Field>
      {canAnswerOfficially && (
        <label className="flex items-center gap-3 text-sm text-navy-900">
          <input type="checkbox" name="official" value="1" className="size-5 accent-teal-700" />
          לפרסם כתשובה רשמית בשם {institutionName ?? "המסגרת"}
        </label>
      )}
      <SubmitButton pendingLabel="מפרסם…">פרסום תשובה</SubmitButton>
      {formError && <Notice tone="error">{formError}</Notice>}
      {state.status === "ok" && <Notice tone="success">{state.message}</Notice>}
    </form>
  );
}
