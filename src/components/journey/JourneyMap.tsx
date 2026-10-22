import Link from "next/link";
import { Check } from "lucide-react";
import type { Milestone } from "@/lib/journey/journey";

/**
 * The route from first questions to a placement, drawn as a line of stops.
 * Vertical on phones, horizontal from `md`. Status comes from real user data only.
 */
export function JourneyMap({ milestones, tone = "light", linked = true }: { milestones: Milestone[]; tone?: "light" | "dark"; linked?: boolean }) {
  const dark = tone === "dark";
  return (
    <ol className="relative grid gap-0 md:grid-cols-6 md:gap-3" aria-label="שלבי המסע">
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1;
        const node =
          m.status === "done"
            ? "bg-teal-600 text-paper ring-teal-600"
            : m.status === "current"
              ? `${dark ? "bg-paper text-navy-950 ring-paper/30" : "bg-navy-900 text-paper ring-navy-900/15"} ring-8`
              : dark
                ? "bg-navy-900 text-mist-300 ring-navy-700"
                : "bg-paper text-mist-500 ring-sand-300";
        const line = m.status === "done" ? "bg-teal-600" : dark ? "bg-navy-700" : "bg-sand-300";
        const body = (
          <>
            <p className={`text-xs font-medium ${dark ? "text-mist-300" : "text-mist-500"}`}>
              {m.status === "current" ? "אתה כאן" : `שלב ${i + 1}`}
              <span className="sr-only">{m.status === "done" ? " (הושלם)" : m.status === "current" ? "" : " (עוד לא)"}</span>
            </p>
            <p className={`mt-0.5 font-semibold leading-6 ${dark ? "text-paper" : "text-navy-950"}`}>{m.title}</p>
            <p className={`text-sm leading-6 ${dark ? "text-mist-300" : "text-stone-600"}`}>{m.evidence ?? m.blurb}</p>
          </>
        );
        return (
          <li key={m.id} className="relative flex gap-4 pb-6 md:block md:pb-0" aria-current={m.status === "current" ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute start-[15px] top-8 h-[calc(100%-2rem)] w-0.5 md:start-9 md:top-[15px] md:h-0.5 md:w-[calc(100%-1.25rem)] ${line}`}
              />
            )}
            <span
              className={`relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 transition ${node}`}
              aria-hidden="true"
            >
              {m.status === "done" ? <Check className="size-4" /> : i + 1}
            </span>
            <div className="min-w-0 md:mt-3">
              {linked ? (
                <Link href={m.action.href} className="block rounded-lg outline-offset-4 hover:opacity-90">
                  {body}
                </Link>
              ) : (
                body
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact ring showing how far along the journey is. */
export function ProgressRing({ percent, size = 56, tone = "light" }: { percent: number; size?: number; tone?: "light" | "dark" }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`התקדמות במסע: ${percent}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className={tone === "dark" ? "stroke-navy-700" : "stroke-sand-200"} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="stroke-teal-600 transition-[stroke-dashoffset] duration-700"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={`text-[13px] font-bold ${tone === "dark" ? "fill-paper" : "fill-navy-950"}`}>
        {percent}%
      </text>
    </svg>
  );
}
