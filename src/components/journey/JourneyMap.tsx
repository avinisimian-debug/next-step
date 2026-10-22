import Link from "next/link";
import { Check, Compass, Flag, Heart, MapPin, Scale, Send, type LucideIcon } from "lucide-react";
import type { Milestone, MilestoneId } from "@/lib/journey/journey";

/** Each stop on the route gets its own colour and icon, so the map reads at a glance. */
const STOP_STYLE: Record<MilestoneId, { icon: LucideIcon; solid: string; soft: string; text: string; ring: string; line: string }> = {
  discover: { icon: Compass, solid: "bg-violet-500", soft: "bg-violet-500/15", text: "text-violet-500", ring: "ring-violet-400/40", line: "from-violet-500" },
  shortlist: { icon: Heart, solid: "bg-rose-500", soft: "bg-rose-500/15", text: "text-rose-500", ring: "ring-rose-400/40", line: "from-rose-500" },
  explore: { icon: MapPin, solid: "bg-amber-500", soft: "bg-amber-500/15", text: "text-amber-500", ring: "ring-amber-400/40", line: "from-amber-500" },
  compare: { icon: Scale, solid: "bg-sky-500", soft: "bg-sky-500/15", text: "text-sky-500", ring: "ring-sky-400/40", line: "from-sky-500" },
  apply: { icon: Send, solid: "bg-teal-600", soft: "bg-teal-600/15", text: "text-teal-600", ring: "ring-teal-500/40", line: "from-teal-600" },
  placement: { icon: Flag, solid: "bg-emerald-500", soft: "bg-emerald-500/15", text: "text-emerald-500", ring: "ring-emerald-400/40", line: "from-emerald-500" },
};

/**
 * The route from first questions to a placement, drawn as a line of coloured stops.
 * Vertical on phones, horizontal from `md`. Status comes from real user data only.
 */
export function JourneyMap({ milestones, tone = "light", linked = true }: { milestones: Milestone[]; tone?: "light" | "dark"; linked?: boolean }) {
  const dark = tone === "dark";
  return (
    <ol className="relative grid gap-0 md:grid-cols-6 md:gap-3" aria-label="שלבי המסע">
      {milestones.map((m, i) => {
        const st = STOP_STYLE[m.id];
        const Icon = st.icon;
        const last = i === milestones.length - 1;
        const done = m.status === "done";
        const current = m.status === "current";
        const node = done
          ? `${st.solid} text-white shadow-lg`
          : current
            ? `${st.solid} text-white shadow-lg ring-8 ${st.ring}`
            : `${st.soft} ${st.text} ${dark ? "opacity-70" : "opacity-80"}`;
        const nextLine = done ? `bg-gradient-to-b md:bg-gradient-to-l ${st.line} to-white/30` : dark ? "bg-white/15" : "bg-sand-300";
        const body = (
          <>
            <p className={`text-xs font-semibold ${current ? st.text : dark ? "text-mist-300" : "text-mist-500"}`}>
              {current ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${st.soft}`}>
                  <span className={`size-1.5 animate-pulse rounded-full ${st.solid}`} aria-hidden="true" />
                  אתה כאן
                </span>
              ) : (
                `שלב ${i + 1}`
              )}
              <span className="sr-only">{done ? " (הושלם)" : current ? "" : " (עוד לא)"}</span>
            </p>
            <p className={`mt-1 font-semibold leading-6 ${dark ? "text-paper" : "text-navy-950"}`}>{m.title}</p>
            <p className={`text-sm leading-6 ${dark ? "text-mist-300" : "text-stone-600"}`}>{m.evidence ?? m.blurb}</p>
          </>
        );
        return (
          <li key={m.id} className="relative flex gap-4 pb-7 md:block md:pb-0" aria-current={current ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute start-[21px] top-12 h-[calc(100%-3rem)] w-1 rounded-full md:start-14 md:top-[22px] md:h-1 md:w-[calc(100%-2.75rem)] ${nextLine}`}
              />
            )}
            <span
              className={`relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 hover:-rotate-6 hover:scale-110 ${node} ${current ? "animate-bob" : ""}`}
              aria-hidden="true"
            >
              <Icon className="size-5" strokeWidth={2.4} />
              {done && (
                <span className="absolute -end-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </span>
            <div className="min-w-0 md:mt-3">
              {linked ? (
                <Link href={m.action.href} className="block rounded-lg outline-offset-4 transition-opacity hover:opacity-90">
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

/** Ring showing how far along the journey is, drawn with the route's colours. */
export function ProgressRing({ percent, size = 56, tone = "light" }: { percent: number; size?: number; tone?: "light" | "dark" }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const gid = `ring-${size}-${tone}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`התקדמות במסע: ${percent}%`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.35" stopColor="#f43f5e" />
          <stop offset="0.7" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" className={tone === "dark" ? "stroke-white/10" : "stroke-sand-200"} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        stroke={`url(#${gid})`}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(percent, 2) / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-1000"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={`text-[15px] font-bold ${tone === "dark" ? "fill-paper" : "fill-navy-950"}`}>
        {percent}%
      </text>
    </svg>
  );
}
