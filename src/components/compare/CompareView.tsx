"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Info, X } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { match, scoreInstitution } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";
import { DURATION_LABELS, INTENSITY_LABELS, MILITARY_MODEL_LABELS, PATHWAY_INFO } from "@/lib/domain/pathways";
import { OfficialLink, VerificationBadge, formatDate } from "@/components/institution/bits";

const NV = "המידע עדיין לא אומת";

interface Row {
  label: string;
  value: (i: Institution, fit: string | null) => string;
}

const ROWS: Row[] = [
  { label: "סוג המסגרת", value: (i) => `${PATHWAY_INFO[i.pathway].name} · ${i.typeLabel}` },
  { label: "לימוד תורה", value: (i) => INTENSITY_LABELS[i.attributes.torahIntensity] },
  { label: "שירות צבאי", value: (i) => i.profile.militaryIntegration ?? MILITARY_MODEL_LABELS[i.attributes.militaryModel] },
  { label: "התפתחות אישית", value: (i) => i.highlights.join(" · ") || NV },
  { label: "מיקום", value: (i) => i.locationLabel },
  { label: "מגורים", value: (i) => i.profile.livingArrangements ?? (i.attributes.residential === "residential" ? "מגורים במקום" : "משתנה") },
  { label: "משך", value: (i) => i.profile.programStructure ?? DURATION_LABELS[i.attributes.duration] },
  { label: "שיקולים כלכליים", value: (i) => i.profile.financial ?? (i.pathway === "idf" ? "שירות חובה" : NV) },
  { label: "תנאי קבלה", value: (i) => i.profile.admissions ?? NV },
  { label: "ההתאמה אליך", value: (_i, fit) => fit ?? "מלא את השאלון כדי לראות" },
];

export function CompareView({ catalog }: { catalog: Institution[] }) {
  const [ids, setIds, hydrated] = useStored<string[]>(KEYS.compare, []);
  const [answers] = useStored<Answers>(KEYS.answers, {});
  const hasAnswers = Object.keys(answers).length > 0;

  // Default to the user's current top three if nothing was picked explicitly.
  const selected = useMemo(() => {
    const chosen = ids.map((id) => catalog.find((c) => c.id === id)).filter((x): x is Institution => Boolean(x));
    if (chosen.length > 0 || !hasAnswers) return chosen;
    return match(catalog, answers).recommendations.map((r) => r.institution);
  }, [ids, catalog, answers, hasAnswers]);

  const fits = useMemo(
    () =>
      Object.fromEntries(
        selected.map((i) => {
          if (!hasAnswers) return [i.id, null];
          const r = scoreInstitution(i, answers);
          return [i.id, `${r.score} — ${r.reasons[0] ?? "אין נימוק בולט"}`];
        }),
      ),
    [selected, answers, hasAnswers],
  );

  if (!hydrated) return <div className="min-h-[60vh]" aria-busy="true" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold text-navy-950">השוואה בין מסגרות</h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">אפשר להשוות עד שלוש מסגרות. הוסיפו מסגרות מכרטיסי ההמלצות או מדפי המסגרות.</p>

      {selected.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-sand-300 p-10 text-center">
          <p className="text-navy-900">עוד לא בחרת מסגרות להשוואה.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/questionnaire" className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper">
              למילוי השאלון
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/institutions" className="inline-flex rounded-full border border-sand-300 px-5 py-2.5 text-sm font-medium text-navy-900">
              לכל המסגרות
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards per institution */}
          <div className="mt-8 space-y-6 md:hidden">
            {selected.map((i) => (
              <section key={i.id} className="rounded-3xl border border-sand-200 bg-paper p-5 shadow-card" aria-labelledby={`m-${i.id}`}>
                <Head inst={i} onRemove={ids.includes(i.id) ? () => setIds(ids.filter((x) => x !== i.id)) : undefined} titleId={`m-${i.id}`} />
                <dl className="mt-4 divide-y divide-sand-200">
                  {ROWS.map((r) => (
                    <div key={r.label} className="py-3">
                      <dt className="text-xs font-semibold text-stone-600">{r.label}</dt>
                      <dd className={`mt-1 text-sm leading-6 ${r.value(i, fits[i.id]) === NV ? "text-mist-500" : "text-navy-900"}`}>{r.value(i, fits[i.id])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="mt-8 hidden overflow-x-auto rounded-3xl border border-sand-200 bg-paper shadow-card md:block">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <caption className="sr-only">השוואה בין המסגרות שנבחרו</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-44 bg-sand-100/60 p-5 text-start align-bottom text-xs font-semibold text-stone-600">
                    קריטריון
                  </th>
                  {selected.map((i) => (
                    <th key={i.id} scope="col" className="p-5 text-start align-top font-normal">
                      <Head inst={i} onRemove={ids.includes(i.id) ? () => setIds(ids.filter((x) => x !== i.id)) : undefined} titleId={`d-${i.id}`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label} className="border-t border-sand-200">
                    <th scope="row" className="bg-sand-100/60 p-5 text-start align-top text-xs font-semibold text-stone-600">
                      {r.label}
                    </th>
                    {selected.map((i) => {
                      const v = r.value(i, fits[i.id]);
                      return (
                        <td key={i.id} className={`p-5 align-top leading-6 ${v === NV ? "text-mist-500" : "text-navy-900"}`}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-8 flex items-start gap-2 text-sm leading-6 text-stone-600">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ההשוואה משקפת את המידע המאומת שזמין לנו, נכון לתאריך העדכון של כל מסגרת. חשוב לוודא את הפרטים העדכניים ישירות מול כל מוסד.
      </p>
    </div>
  );
}

function Head({ inst, onRemove, titleId }: { inst: Institution; onRemove?: () => void; titleId: string }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <Link id={titleId} href={`/institutions/${inst.slug}`} className="font-display text-lg font-bold leading-snug text-navy-950 hover:underline">
          {inst.name}
        </Link>
        {onRemove && (
          <button type="button" onClick={onRemove} className="rounded-full p-1 text-stone-600 hover:bg-sand-100" aria-label={`הסרה מההשוואה: ${inst.name}`}>
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <VerificationBadge inst={inst} />
      </div>
      <p className="mt-2 text-xs text-mist-500">עודכן: {formatDate(inst.lastVerified)}</p>
      <div className="mt-3">
        <OfficialLink inst={inst} variant="link" />
      </div>
    </div>
  );
}
