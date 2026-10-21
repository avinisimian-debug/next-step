"use client";

import { useMemo } from "react";
import type { Institution } from "@/lib/domain/types";
import { scoreInstitution } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";

/** Shows why this place fits the visitor, if they have answered the questionnaire on this device. */
export function PersonalFit({ inst }: { inst: Institution }) {
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const rec = useMemo(() => {
    if (Object.keys(answers).length === 0) return null;
    return scoreInstitution(inst, answers);
  }, [answers, inst]);

  if (!hydrated || !rec) return null;

  return (
    <section aria-labelledby="h-fit" className="rounded-3xl border border-teal-100 bg-teal-100/40 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="h-fit" className="font-display text-2xl font-bold text-navy-950">
          ההתאמה האישית שלך
        </h2>
        <span className="text-sm text-stone-600">
          ציון התאמה להעדפות שציינת: <strong className="text-navy-950">{rec.score}</strong>
        </span>
      </div>
      {rec.reasons.length > 0 && (
        <ul className="mt-4 list-disc space-y-1.5 ps-5 leading-7 text-navy-900">
          {rec.reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {rec.concerns.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-navy-950">כדאי לשקול</h3>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-6 text-navy-800">
            {rec.concerns.slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
