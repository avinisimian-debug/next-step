"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { match } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";
import { Loading } from "@/components/site/Loading";
import { allStepIds, buildActionPlan, type PlanStep } from "@/lib/plan/actionPlan";

export function PlanView({ catalog }: { catalog: Institution[] }) {
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const [done, setDone] = useStored<string[]>(KEYS.plan, []);
  const plan = useMemo(() => buildActionPlan(match(catalog, answers), answers), [catalog, answers]);

  if (!hydrated) return <Loading label="טוען את התוכנית…" />;

  if (Object.keys(answers).length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-navy-950">תוכנית הפעולה נבנית מההמלצות שלך</h1>
        <p className="mt-4 leading-7 text-stone-600">כדי לבנות תוכנית צריך קודם למלא את השאלון. זה לוקח כמה דקות.</p>
        <Link href="/questionnaire" className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper">
          למעבר לשאלון
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // Only count check-offs that belong to the current plan; old ids stay stored but are ignored.
  const ids = allStepIds(plan);
  const checked = new Set(done.filter((d) => ids.includes(d)));
  const toggle = (id: string, on: boolean) =>
    setDone((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <header>
        <p className="text-sm font-semibold text-teal-700">הצעד הבא</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-bold leading-tight text-navy-950 sm:text-5xl">תוכנית הפעולה שלי</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          צעדים מעשיים לפי ההמלצות שקיבלת. מועדים מופיעים רק כשיש להם מקור — ובכל מקרה כדאי לוודא אותם מול המסגרת.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
          <p className="text-sm text-navy-900" aria-live="polite">
            הושלמו {checked.size} מתוך {ids.length} צעדים
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-sand-300 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-sand-100"
          >
            <Printer className="size-4" aria-hidden="true" />
            הדפסה
          </button>
          <Link href="/results" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-700 underline underline-offset-4">
            חזרה להמלצות
          </Link>
        </div>
      </header>

      <div className="mt-10 space-y-8">
        {plan.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`plan-${section.id}`}
            className="rounded-[28px] border border-sand-200 bg-paper p-6 shadow-card print:break-inside-avoid print:shadow-none sm:p-8"
          >
            <h2 id={`plan-${section.id}`} className="font-display text-xl font-bold text-navy-950">
              {section.title}
            </h2>
            {section.subtitle && <p className="mt-1 text-sm text-stone-600">{section.subtitle}</p>}
            <ul className="mt-5 space-y-4">
              {section.steps.map((step) => (
                <Step key={step.id} step={step} section={section.title} checked={checked.has(step.id)} onChange={(on) => toggle(step.id, on)} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm leading-7 text-stone-600">
        הסימונים נשמרים רק בדפדפן הזה. אפשר למחוק אותם, יחד עם שאר הנתונים, בעמוד{" "}
        <Link href="/privacy" className="font-medium text-teal-700 underline">
          הפרטיות
        </Link>
        .
      </p>
    </div>
  );
}

function Step({ step, section, checked, onChange }: { step: PlanStep; section: string; checked: boolean; onChange: (on: boolean) => void }) {
  const inputId = `step-${step.id}`;
  const external = step.href?.startsWith("http");
  return (
    <li className="flex items-start gap-3" data-step={step.id}>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1.5 size-5 shrink-0 accent-teal-700"
      />
      <div className="leading-7">
        <label htmlFor={inputId} className={`cursor-pointer ${checked ? "text-stone-600 line-through" : "text-navy-900"}`}>
          {step.text}
        </label>
        {(step.href || step.source) && (
          <div className="flex flex-wrap gap-x-3 text-sm">
            {step.href &&
              (external ? (
                <a href={step.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-700 underline underline-offset-4">
                  לקישור<span className="sr-only">: {step.text}, {section}</span>
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(נפתח בלשונית חדשה)</span>
                </a>
              ) : (
                <Link href={step.href} className="font-medium text-teal-700 underline underline-offset-4">
                  לקישור<span className="sr-only">: {step.text}, {section}</span>
                </Link>
              ))}
            {step.source && <span className="text-stone-600">מקור: {step.source}</span>}
          </div>
        )}
      </div>
    </li>
  );
}
