"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, CircleHelp, Search, TriangleAlert } from "lucide-react";
import type { Recommendation } from "@/lib/matching/engine";
import { COMPONENT_LABELS } from "@/lib/matching/config";
import {
  AudienceChip,
  CompareButton,
  ContactBlock,
  FavoriteButton,
  Location,
  OfficialLink,
  ScoreRing,
  VerificationBadge,
  formatDate,
} from "@/components/institution/bits";

export function RecommendationCard({ rec, rank, aiSummary }: { rec: Recommendation; rank: number; aiSummary?: string }) {
  const { institution: inst } = rec;
  const [open, setOpen] = useState(false);
  const panelId = `details-${inst.id}`;

  return (
    <article
      className="animate-rise overflow-hidden rounded-[28px] border border-sand-200 bg-paper shadow-card"
      style={{ animationDelay: `${rank * 90}ms` }}
      aria-labelledby={`title-${inst.id}`}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex items-start gap-5">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy-900 px-2.5 py-1 text-xs font-semibold text-paper">כיוון {rank + 1}</span>
              <span className="text-sm font-medium text-teal-700">{inst.typeLabel}</span>
            </div>
            <h2 id={`title-${inst.id}`} className="mt-3 font-display text-2xl font-bold leading-tight text-navy-950 sm:text-3xl">
              {inst.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Location inst={inst} />
              <VerificationBadge inst={inst} />
              <AudienceChip inst={inst} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScoreRing score={rec.score} />
            <span className="max-w-[90px] text-center text-[11px] leading-4 text-stone-600">ציון התאמה להעדפות שציינת</span>
          </div>
        </header>

        <p className="leading-8 text-navy-800">{inst.shortDescription}</p>

        {aiSummary && (
          <p className="rounded-2xl bg-mist-100/70 p-4 text-sm leading-7 text-navy-900">
            <span className="font-semibold">בקצרה: </span>
            {aiSummary}
          </p>
        )}

        <section aria-label="למה זה מתאים לך">
          <h3 className="text-sm font-semibold text-navy-950">למה זה מתאים לך</h3>
          <ul className="mt-3 space-y-2.5">
            {rec.reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-3 text-[15px] leading-7 text-navy-900">
                <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </section>

        {inst.highlights.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="דגשים">
            {inst.highlights.map((h) => (
              <li key={h} className="rounded-full bg-sand-100 px-3 py-1.5 text-sm text-navy-800">
                {h}
              </li>
            ))}
          </ul>
        )}

        {rec.concerns.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-100/40 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <TriangleAlert className="size-4" aria-hidden="true" />
              חשוב לדעת
            </h3>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-900">
              {rec.concerns.slice(0, 2).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 border-t border-sand-200 pt-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold text-stone-600">פרטי קשר</h3>
            <ContactBlock inst={inst} compact />
          </div>
          <div className="text-sm text-stone-600 sm:text-end">
            <p>
              עודכן לאחרונה: <time dateTime={inst.lastVerified}>{formatDate(inst.lastVerified)}</time>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/institutions/${inst.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-navy-800"
          >
            לפרטים מלאים<span className="sr-only">: {inst.name}</span>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <CompareButton id={inst.id} name={inst.name} />
          <OfficialLink inst={inst} />
          <FavoriteButton id={inst.id} name={inst.name} />
        </div>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-sand-200 bg-sand-100/50 px-6 py-4 text-sm font-medium text-navy-900 hover:bg-sand-100 sm:px-8"
      >
        <span>
          פירוט ההתאמה, מה לבדוק ומה עוד לא ידוע<span className="sr-only">: {inst.name}</span>
        </span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="grid gap-8 bg-sand-100/30 px-6 py-6 sm:px-8 md:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold text-navy-950">איך חושב הציון</h3>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              הציון משקף התאמה להעדפות שציינת בלבד — לא הסתברות להצלחה ולא דירוג של המוסד. שאלות שדילגת עליהן לא נספרות.
            </p>
            <ul className="mt-4 space-y-3">
              {rec.components.map((c) => (
                <li key={c.key}>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-900">{COMPONENT_LABELS[c.key]}</span>
                    <span className="text-stone-600">{c.score === null ? "לא נענה" : `${Math.round(c.score * 100)}`}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sand-200">
                    {c.score !== null && <div className="h-full rounded-full bg-navy-700" style={{ width: `${Math.round(c.score * 100)}%` }} />}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-600">התשובות שלך כיסו {Math.round(rec.coverage * 100)}% ממשקל הקריטריונים.</p>
          </section>
          <div className="space-y-6">
            {rec.reasons.length > 3 && (
              <section>
                <h3 className="text-sm font-semibold text-navy-950">עוד נקודות התאמה</h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-800">
                  {rec.reasons.slice(3, 7).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                <Search className="size-4 text-mist-500" aria-hidden="true" />
                מה כדאי לבדוק לפני החלטה
              </h3>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-800">
                {rec.verify.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </section>
            {rec.concerns.length > 2 && (
              <section>
                <h3 className="text-sm font-semibold text-navy-950">נקודות נוספות לשקול</h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-800">
                  {rec.concerns.slice(2).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            )}
            {rec.unknowns.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                  <CircleHelp className="size-4 text-mist-500" aria-hidden="true" />
                  מה עוד לא ידוע
                </h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-800">
                  {rec.unknowns.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
