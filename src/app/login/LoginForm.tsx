"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestLoginLink, type LoginState } from "./actions";
import { Field, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(requestLoginLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="rounded-3xl border border-teal-600/30 bg-teal-100 p-6 text-teal-700" role="status">
        <MailCheck className="size-8" aria-hidden="true" />
        <p className="mt-3 font-display text-2xl font-bold">בדקו את תיבת המייל</p>
        <p className="mt-2 leading-7">
          שלחנו קישור התחברות אל <span className="ltr font-medium">{state.email}</span>. הקישור תקף לזמן קצר. אם הוא לא מגיע תוך כמה דקות,
          כדאי לבדוק בתיקיית הספאם.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : undefined;
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="כתובת מייל" error={error}>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          defaultValue={state.status === "error" ? state.email : ""}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "email-error" : undefined}
          className={`${inputStyles} text-left`}
        />
      </Field>
      <SubmitButton pendingLabel="שולח…" className="w-full">
        שלחו לי קישור התחברות
      </SubmitButton>
    </form>
  );
}
