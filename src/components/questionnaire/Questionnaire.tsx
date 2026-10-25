"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, Save } from "lucide-react";
import {
  SECTIONS,
  asArray,
  isAnswered,
  optionLabel,
  pruneAnswers,
  visibleQuestions,
  type Answers,
  type Question,
} from "@/lib/questionnaire/questions";
import { KEYS, clearAllStored, useStored } from "@/lib/client/store";
import { ICONS } from "./icons";
import { Loading } from "@/components/site/Loading";

interface Progress {
  index: number;
  phase: "questions" | "summary";
  returnToSummary?: boolean;
}

const START: Progress = { index: 0, phase: "questions" };
const MAX_TEXT = 500;

export function Questionnaire() {
  const router = useRouter();
  const params = useSearchParams();
  const [answers, setAnswers, hydrated] = useStored<Answers>(KEYS.answers, {});
  const [progress, setProgress] = useStored<Progress>(KEYS.progress, START);
  // Asked once per visit: only if there was saved progress when the page loaded.
  const [resume, setResume] = useState<"pending" | "ask" | "done">("pending");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const index = Math.min(progress.index, questions.length - 1);
  const q = questions[index];
  const showResume = resume === "ask";

  useEffect(() => {
    if (!hydrated || resume !== "pending") return;
    const saved = Object.keys(answers).length > 0 && (progress.index > 0 || progress.phase === "summary");
    setResume(saved && params.get("edit") === null ? "ask" : "done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // "I'm not sure yet" entry point: preselect the undecided option for a fresh start.
  useEffect(() => {
    if (hydrated && params.get("mode") === "explore" && Object.keys(answers).length === 0) {
      setAnswers({ paths: ["not_sure"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Move focus to the new question heading for screen-reader and keyboard users.
  useEffect(() => {
    if (resume !== "pending") headingRef.current?.focus();
  }, [index, progress.phase, resume]);

  if (!hydrated || resume === "pending") {
    return <Loading title="השאלון" label="טוען את השאלון…" />;
  }

  const setAnswer = (id: string, value: string | string[] | undefined) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      if (value === undefined || (Array.isArray(value) && value.length === 0)) delete next[id];
      return pruneAnswers(next);
    });
  };

  const goTo = (i: number, extra: Partial<Progress> = {}) =>
    setProgress({ index: Math.max(0, i), phase: "questions", ...extra });

  const next = () => {
    if (progress.returnToSummary || index >= questions.length - 1) setProgress({ index, phase: "summary" });
    else goTo(index + 1);
  };
  const back = () => {
    if (index === 0) return;
    goTo(index - 1, { returnToSummary: progress.returnToSummary });
  };

  const restart = () => {
    clearAllStored();
    setResume("done");
  };

  if (showResume) {
    return (
      <Shell>
        <div className="rounded-3xl border border-sand-200 bg-paper p-8 shadow-card">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-bold text-navy-950">
            ברוך שובך
          </h1>
          <p className="mt-3 leading-7 text-stone-600">
            שמרנו את התשובות שלך בדפדפן הזה בלבד. אפשר להמשיך מאיפה שעצרת או להתחיל מחדש.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setResume("done")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper hover:bg-navy-800"
            >
              להמשיך מאיפה שעצרתי
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sand-300 px-6 py-3 font-medium text-navy-900 hover:bg-sand-100"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              להתחיל מחדש
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (progress.phase === "summary") {
    return (
      <Shell>
        <Summary
          answers={answers}
          questions={questions}
          headingRef={headingRef}
          onEdit={(i) => goTo(i, { returnToSummary: true })}
          onSubmit={() => router.push("/results")}
          onRestart={restart}
        />
      </Shell>
    );
  }

  const answered = isAnswered(q, answers);
  const canContinue = answered || q.optional;
  const pct = Math.round((index / questions.length) * 100);

  return (
    <Shell>
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-stone-600">
          <span className="font-medium text-teal-700">{SECTIONS[q.section]}</span>
          <span>
            שאלה {index + 1} מתוך {questions.length}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="התקדמות בשאלון"
        >
          <div className="h-full rounded-full bg-navy-800 transition-[width] duration-500" style={{ width: `${Math.max(pct, 3)}%` }} />
        </div>
      </div>

      <form
        key={q.id}
        className="animate-rise"
        onSubmit={(e) => {
          e.preventDefault();
          if (canContinue) next();
        }}
      >
        <fieldset>
          <legend className="contents">
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-[1.9rem] font-bold leading-tight text-navy-950 sm:text-4xl">
              {q.title}
            </h1>
          </legend>
          {q.subtitle && <p className="mt-3 leading-7 text-stone-600">{q.subtitle}</p>}
          {q.optional && <p className="mt-2 text-sm text-mist-500">שאלה לא חובה</p>}

          <div className="mt-8">
            <QuestionInput q={q} answers={answers} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        </fieldset>

        <div className="sticky bottom-0 -mx-4 mt-10 flex items-center justify-between gap-3 border-t border-sand-200 bg-paper/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          <button
            type="button"
            onClick={back}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-3 font-medium text-navy-800 hover:bg-sand-100 disabled:invisible"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            הקודם
          </button>
          <div className="flex items-center gap-2">
            {q.optional && !answered && (
              <button type="button" onClick={next} className="rounded-full px-4 py-3 font-medium text-stone-600 hover:bg-sand-100">
                דלג
              </button>
            )}
            <button
              type="submit"
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-stone-600"
            >
              {progress.returnToSummary ? "חזרה לסיכום" : index === questions.length - 1 ? "לסיכום" : "המשך"}
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 flex items-center gap-2 text-xs text-mist-500">
        <Save className="size-3.5" aria-hidden="true" />
        התשובות נשמרות רק בדפדפן שלך. <Link href="/privacy" className="inline-flex min-h-6 items-center underline">מה נשמר ולמה</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 pb-10 pt-8 sm:px-6 sm:pt-14">{children}</div>;
}

function QuestionInput({
  q,
  answers,
  onChange,
}: {
  q: Question;
  answers: Answers;
  onChange: (v: string | string[] | undefined) => void;
}) {
  if (q.kind === "text") {
    const v = (answers[q.id] as string | undefined) ?? "";
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="sr-only">
          {q.title}
        </label>
        <textarea
          id={`q-${q.id}`}
          value={v}
          maxLength={MAX_TEXT}
          rows={5}
          placeholder={q.placeholder}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-2xl border border-sand-300 bg-paper p-4 text-base leading-7 text-navy-950 shadow-sm placeholder:text-mist-500 focus:border-navy-600"
        />
        <p className="mt-2 text-end text-xs text-mist-500" aria-live="polite">
          {v.length}/{MAX_TEXT}
        </p>
      </div>
    );
  }

  const multi = q.kind === "multi";
  const selected = asArray(answers[q.id]);
  const atMax = multi && q.maxSelections !== undefined && selected.length >= q.maxSelections;
  // "Not sure"-type options are exclusive in multi-select questions.
  const exclusive = new Set(["not_sure", "dont_know", "anywhere"]);

  const toggle = (id: string) => {
    if (!multi) return onChange(id);
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (exclusive.has(id)) return onChange([id]);
    const base = selected.filter((x) => !exclusive.has(x));
    if (q.maxSelections && base.length >= q.maxSelections) return;
    onChange([...base, id]);
  };

  const twoCol = (q.options?.length ?? 0) > 5;

  return (
    <div>
      <div className={`grid gap-3 ${twoCol ? "sm:grid-cols-2" : ""}`}>
        {q.options!.map((o) => {
          const checked = selected.includes(o.id);
          const disabled = !checked && atMax && !exclusive.has(o.id);
          const Icon = o.icon ? ICONS[o.icon] : null;
          return (
            <label
              key={o.id}
              className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl border bg-paper px-4 py-4 transition
                ${checked ? "border-navy-800 bg-mist-100/50 shadow-card ring-1 ring-navy-800" : "border-sand-300 hover:border-navy-600/50 hover:bg-sand-100/60"}
                ${disabled ? "cursor-not-allowed opacity-45" : ""}
                has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600`}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={q.id}
                value={o.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(o.id)}
                className="peer sr-only"
              />
              {Icon && (
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${checked ? "bg-navy-900 text-paper" : "bg-sand-100 text-navy-700"}`}
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
              )}
              <span className="flex-1">
                <span className="block font-medium text-navy-950">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-sm text-stone-600">{o.hint}</span>}
              </span>
              <span
                className={`flex size-6 shrink-0 items-center justify-center border-2 transition ${multi ? "rounded-md" : "rounded-full"} ${checked ? "border-navy-900 bg-navy-900 text-paper" : "border-sand-300"}`}
                aria-hidden="true"
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
      {multi && q.maxSelections && (
        <p className="mt-3 text-sm text-stone-600" aria-live="polite">
          נבחרו {selected.length} מתוך {q.maxSelections}
        </p>
      )}
    </div>
  );
}

function Summary({
  answers,
  questions,
  headingRef,
  onEdit,
  onSubmit,
  onRestart,
}: {
  answers: Answers;
  questions: Question[];
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onEdit: (i: number) => void;
  onSubmit: () => void;
  onRestart: () => void;
}) {
  const display = (q: Question) => {
    const v = answers[q.id];
    if (v === undefined || (Array.isArray(v) && v.length === 0)) return null;
    if (q.kind === "text") return v as string;
    return asArray(v)
      .map((id) => optionLabel(q.id, id, answers))
      .join(" · ");
  };

  return (
    <div className="animate-rise">
      <p className="text-sm font-medium text-teal-700">כמעט סיימנו</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-3xl font-bold text-navy-950 sm:text-4xl">
        זה מה שסיפרת לנו
      </h1>
      <p className="mt-3 leading-7 text-stone-600">אפשר לשנות כל תשובה לפני שנחפש התאמות.</p>

      <dl className="mt-8 divide-y divide-sand-200 rounded-3xl border border-sand-200 bg-paper">
        {questions.map((q, i) => {
          const val = display(q);
          // dt and dd sit directly in the row's div, as a description list requires; the edit button is a second dd.
          return (
            <div key={q.id} className="grid grid-cols-[1fr_auto] items-start gap-x-4 px-5 py-4">
              <dt className="text-sm text-stone-600">{q.title}</dt>
              <dd className={`col-start-1 mt-1 ${val ? "font-medium text-navy-950" : "text-mist-500"}`}>{val ?? "דילגת"}</dd>
              <dd className="col-start-2 row-span-2 row-start-1">
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100"
                  aria-label={`שינוי התשובה: ${q.title}`}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  שינוי
                </button>
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 font-medium text-stone-600 hover:bg-sand-100"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          ניקוי והתחלה מחדש
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-7 py-4 font-semibold text-paper shadow-lift hover:bg-navy-800"
        >
          לקבלת ההמלצות שלי
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
