"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFieldErrors } from "@/components/ui/useFieldErrors";
import { askQuestion, suggestSimilar, type AskState } from "@/app/community/actions";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { Field, Notice, inputStyles } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Similar = { id: string; title: string; answer_count: number };

export function AskForm({ institutions, defaultInstitution }: { institutions: { id: string; name: string }[]; defaultInstitution?: string }) {
  const [state, action] = useActionState<AskState, FormData>(askQuestion, { status: "idle" });
  const v = state.values ?? {};
  const [title, setTitle] = useState(v.title ?? "");
  const [similar, setSimilar] = useState<Similar[]>([]);

  // Suggest existing questions while the title is typed, so people find answers before asking again.
  useEffect(() => {
    const t = title.trim();
    if (t.length < 4) {
      setSimilar([]);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      suggestSimilar(t)
        .then((rows) => live && setSimilar(rows))
        .catch(() => live && setSimilar([]));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [title]);

  const { fieldError, formError } = useFieldErrors(state, { title: "title", body: "body", institution_id: "institution_id", pathway: "pathway" });

  return (
    <form action={action} className="space-y-5">
      <Field id="title" label="השאלה בקצרה" hint="8 עד 160 תווים. למשל: ״איך נראה סדר היום בשנה הראשונה?״" error={fieldError("title")}>
        <input
          id="title"
          name="title"
          required
          minLength={8}
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-describedby="title-hint similar"
          className={inputStyles}
        />
      </Field>

      <div id="similar" aria-live="polite">
        {similar.length > 0 && (
          <div className="rounded-2xl border border-mist-300 bg-mist-100 p-4 text-sm">
            <p className="font-medium text-navy-900">אולי כבר שאלו את זה:</p>
            <ul className="mt-2 space-y-1">
              {similar.map((s) => (
                <li key={s.id}>
                  <Link href={`/community/${s.id}`} className="text-navy-900 underline underline-offset-4" target="_blank">
                    {s.title}
                  </Link>{" "}
                  <span className="text-stone-600">({s.answer_count === 1 ? "תשובה אחת" : `${s.answer_count} תשובות`})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Field id="body" label="פרטים" hint="מה חשוב לך לדעת? בלי פרטים מזהים כמו טלפון או כתובת." error={fieldError("body")}>
        <textarea id="body" name="body" required minLength={10} maxLength={4000} rows={6} defaultValue={v.body} className={inputStyles} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="institution_id" label="על איזו מסגרת? (לא חובה)" error={fieldError("institution_id")}>
          <select id="institution_id" name="institution_id" defaultValue={v.institution_id ?? defaultInstitution ?? ""} className={inputStyles}>
            <option value="">שאלה כללית</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pathway" label="מסלול (לא חובה)" error={fieldError("pathway")}>
          <select id="pathway" name="pathway" defaultValue={v.pathway ?? ""} className={inputStyles}>
            <option value="">לא משנה</option>
            {PATHWAY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PATHWAY_INFO[p].name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {formError && <Notice tone="error">{formError}</Notice>}
      <SubmitButton pendingLabel="מפרסם…">פרסום השאלה</SubmitButton>
      <p className="text-xs leading-5 text-stone-600">
        השאלה תופיע בקהילה עם השם שבחרת בחשבון. תשובות בקהילה הן ניסיון אישי של אנשים, לא מידע רשמי — אלא אם מסומנות כתשובה רשמית של המסגרת.
      </p>
    </form>
  );
}
