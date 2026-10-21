"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Institution } from "@/lib/domain/types";
import { match } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";
import { buildActionPlan } from "@/lib/plan/actionPlan";
import { importPlanSteps } from "@/app/my-path/actions";
import { Button, Notice } from "@/components/ui/ui";

/** Offers to copy the questionnaire-based action plan (kept on this device) into the account. */
export function ImportFromPlan({ catalog }: { catalog: Institution[] }) {
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const ids = useMemo(() => new Set(catalog.map((i) => i.id)), [catalog]);
  const steps = useMemo(() => {
    if (!Object.keys(answers).length) return [];
    return buildActionPlan(match(catalog, answers), answers).flatMap((section) =>
      section.steps.map((s) => ({
        title: s.text.slice(0, 200),
        detail: s.href && /^https?:/.test(s.href) ? s.href : null,
        institution_id: ids.has(section.id) ? section.id : null,
      })),
    );
  }, [answers, catalog, ids]);

  if (!hydrated || !steps.length) return null;

  const run = () =>
    startTransition(async () => {
      const res = await importPlanSteps(steps.slice(0, 40));
      if (!res.ok) return setMessage({ tone: "error", text: res.message });
      setMessage({
        tone: "success",
        text: res.imported ? `נוספו ${res.imported} צעדים מתוכנית הפעולה.` : "כל הצעדים מתוכנית הפעולה כבר נמצאים במפה.",
      });
      router.refresh();
    });

  return (
    <div className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
      <p className="font-medium text-navy-950">יש לך תוכנית פעולה מהשאלון ({steps.length} צעדים)</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">אפשר להעתיק אותה למפת הדרך בחשבון, ואז לעדכן, להוסיף ולסדר.</p>
      <Button className="mt-3" variant="secondary" onClick={run} disabled={pending} aria-busy={pending}>
        {pending ? "מעתיק…" : "העתקה למפת הדרך"}
      </Button>
      {message && (
        <div className="mt-3">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </div>
  );
}
