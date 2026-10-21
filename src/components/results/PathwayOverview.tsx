import Link from "next/link";
import type { PathwayFit } from "@/lib/matching/engine";
import { PATHWAY_INFO } from "@/lib/domain/pathways";
import { DEFAULT_CONFIG } from "@/lib/matching/config";

/** Pathway-level view shown before specific institutions. */
export function PathwayOverview({ pathways }: { pathways: PathwayFit[] }) {
  return (
    <section aria-labelledby="h-pathways" className="mt-10 rounded-[28px] border border-sand-200 bg-paper p-6 shadow-card sm:p-8">
      <h2 id="h-pathways" className="font-display text-2xl font-bold text-navy-950">
        איך כל מסלול מתאים לך
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        לפי ההתאמה הטובה ביותר שמצאנו בכל מסלול במאגר. זה לא דירוג של המסלולים — רק של ההתאמה להעדפות שלך.
      </p>
      <ol className="mt-6 space-y-5">
        {pathways.map((p) => {
          const info = PATHWAY_INFO[p.pathway];
          const strong = p.score !== null && p.score >= DEFAULT_CONFIG.minScore;
          return (
            <li key={p.pathway} data-pathway={p.pathway}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-semibold text-navy-950">{info.name}</h3>
                <span className="text-sm text-stone-600">
                  {p.score === null
                    ? "אין מסגרות מתאימות במאגר"
                    : `${p.score} · ${p.qualifying === 0 ? "אין מסגרת מעל סף ההמלצה" : p.qualifying === 1 ? "מסגרת אחת מתאימה" : `${p.qualifying} מסגרות מתאימות`}`}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-sand-200" aria-hidden="true">
                {p.score !== null && (
                  <div
                    className={`h-full rounded-full ${strong ? "bg-teal-600" : "bg-mist-300"}`}
                    style={{ width: `${Math.max(p.score, 4)}%` }}
                  />
                )}
              </div>
              {(p.reason || p.excludedNote) && (
                <p className="mt-2 text-sm leading-6 text-navy-800">{p.excludedNote ?? p.reason}</p>
              )}
              {p.considered > 0 && (
                <Link href={`/institutions?pathway=${p.pathway}`} className="mt-1 inline-block text-sm font-medium text-teal-700 underline underline-offset-4">
                  לכל המסגרות במסלול
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
