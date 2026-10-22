import Link from "next/link";
import { useId } from "react";
import { Check, Compass, Flag, Heart, MapPin, Scale, Send, type LucideIcon } from "lucide-react";
import type { Milestone, MilestoneId } from "@/lib/journey/journey";

/** Each stop on the road gets its own colour and icon, so the map reads at a glance. */
const STOP_STYLE: Record<MilestoneId, { icon: LucideIcon; hex: string; solid: string; soft: string; text: string; textDark: string; ring: string }> = {
  discover: { icon: Compass, hex: "#8b5cf6", solid: "bg-violet-500", soft: "bg-violet-500/15", text: "text-violet-700", textDark: "text-violet-300", ring: "ring-violet-400/40" },
  shortlist: { icon: Heart, hex: "#f43f5e", solid: "bg-rose-500", soft: "bg-rose-500/15", text: "text-rose-700", textDark: "text-rose-300", ring: "ring-rose-400/40" },
  explore: { icon: MapPin, hex: "#f59e0b", solid: "bg-amber-500", soft: "bg-amber-500/15", text: "text-amber-700", textDark: "text-amber-300", ring: "ring-amber-400/40" },
  compare: { icon: Scale, hex: "#0ea5e9", solid: "bg-sky-500", soft: "bg-sky-500/15", text: "text-sky-700", textDark: "text-sky-300", ring: "ring-sky-400/40" },
  apply: { icon: Send, hex: "#14b8a6", solid: "bg-teal-500", soft: "bg-teal-500/15", text: "text-teal-700", textDark: "text-teal-300", ring: "ring-teal-400/40" },
  placement: { icon: Flag, hex: "#10b981", solid: "bg-emerald-500", soft: "bg-emerald-500/15", text: "text-emerald-700", textDark: "text-emerald-300", ring: "ring-emerald-400/40" },
};

type Pt = { x: number; y: number };
type Tone = "light" | "dark";

/** A smooth S-bend between two stops, so the road winds instead of zig-zagging. */
const bend = (a: Pt, b: Pt, vertical: boolean) =>
  vertical
    ? `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}`
    : `M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`;

/**
 * The route from first questions to a placement, drawn as a winding road with a station per milestone,
 * like a level map. The road is painted in colour up to the stop you are at. Status comes from real user data only.
 * Phones get a vertical road down the side; from `md` it runs across, right to left.
 */
export function JourneyMap({ milestones, tone = "light", linked = true }: { milestones: Milestone[]; tone?: Tone; linked?: boolean }) {
  return (
    <>
      <RoadAcross milestones={milestones} tone={tone} linked={linked} />
      <RoadDown milestones={milestones} tone={tone} linked={linked} />
    </>
  );
}

// Across: viewBox 1000 x 400, stretched to the box. Stop 1 is on the right (RTL).
const ACROSS_H = 400;
const across = (i: number, n: number): Pt => ({ x: 1000 - (80 + (i * 840) / Math.max(n - 1, 1)), y: i % 2 ? 272 : 128 });

function RoadAcross({ milestones, tone, linked }: { milestones: Milestone[]; tone: Tone; linked: boolean }) {
  const n = milestones.length;
  const pts = milestones.map((_, i) => across(i, n));
  return (
    <div className="relative hidden md:block" style={{ height: ACROSS_H }}>
      <Road
        pts={pts}
        milestones={milestones}
        tone={tone}
        vertical={false}
        viewBox={`0 0 1000 ${ACROSS_H}`}
        lead={[{ x: 1000, y: 200 }, { x: 0, y: 200 }]}
      />
      <ol className="absolute inset-0" aria-label="שלבי המסע">
        {milestones.map((m, i) => {
          const up = i % 2 === 0;
          const p = pts[i];
          return (
            <li
              key={m.id}
              aria-current={m.status === "current" ? "step" : undefined}
              className={`absolute flex w-44 -translate-x-1/2 items-center gap-2 text-center ${up ? "flex-col-reverse" : "flex-col"}`}
              style={up ? { left: `${p.x / 10}%`, bottom: `calc(${100 - (p.y / ACROSS_H) * 100}% - 28px)` } : { left: `${p.x / 10}%`, top: `calc(${(p.y / ACROSS_H) * 100}% - 28px)` }}
            >
              <Station m={m} tone={tone} bubble={up ? "bottom" : "top"} />
              <StopText m={m} i={i} tone={tone} linked={linked} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Down: a band on the start (right) side holds the road; the text sits beside it.
const BAND = 112;
const STEP = 124;
const TOP = 44;
const down = (i: number): Pt => ({ x: BAND - (i % 2 ? 80 : 32), y: TOP + i * STEP });

function RoadDown({ milestones, tone, linked }: { milestones: Milestone[]; tone: Tone; linked: boolean }) {
  const n = milestones.length;
  const pts = milestones.map((_, i) => down(i));
  const height = TOP * 2 + (n - 1) * STEP;
  return (
    <div className="relative md:hidden" style={{ height }}>
      <div className="absolute inset-y-0 start-0" style={{ width: BAND }}>
        <Road pts={pts} milestones={milestones} tone={tone} vertical viewBox={`0 0 ${BAND} ${height}`} lead={[{ x: pts[0].x, y: 0 }, { x: pts[n - 1].x, y: height }]} />
      </div>
      <ol className="absolute inset-0" aria-label="שלבי המסע">
        {milestones.map((m, i) => {
          const p = pts[i];
          return (
            <li key={m.id} aria-current={m.status === "current" ? "step" : undefined} className="absolute inset-x-0 flex items-center" style={{ top: p.y - 28, minHeight: 56 }}>
              <span className="absolute" style={{ insetInlineStart: BAND - p.x - 28 }}>
                <Station m={m} tone={tone} />
              </span>
              <div className="min-w-0" style={{ paddingInlineStart: BAND + 8 }}>
                <StopText m={m} i={i} tone={tone} linked={linked} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The road itself: a wide lane with a dashed centre line, painted in each stop's colour once that stop is done. */
function Road({ pts, milestones, tone, vertical, viewBox, lead }: { pts: Pt[]; milestones: Milestone[]; tone: Tone; vertical: boolean; viewBox: string; lead: [Pt, Pt] }) {
  const uid = useId().replace(/:/g, "");
  const dark = tone === "dark";
  const n = pts.length;
  const segs = [bend(lead[0], pts[0], vertical), ...pts.slice(1).map((p, i) => bend(pts[i], p, vertical)), bend(pts[n - 1], lead[1], vertical)];
  // segment k runs from stop k-1 to stop k; segment 0 is the lead-in, painted once the first stop has started
  const painted = (k: number) => (k === 0 ? milestones[0]?.status !== "upcoming" : milestones[k - 1]?.status === "done");
  const colourAt = (k: number) => STOP_STYLE[milestones[Math.min(Math.max(k, 0), n - 1)].id].hex;
  const line = { fill: "none", strokeLinecap: "round" as const, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <defs>
        {segs.map((_, k) => {
          const a = k === 0 ? lead[0] : pts[k - 1];
          const b = k === n ? lead[1] : pts[k];
          return (
            <linearGradient key={k} id={`${uid}-g${k}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
              <stop offset="0" stopColor={colourAt(k - 1)} />
              <stop offset="1" stopColor={colourAt(k)} />
            </linearGradient>
          );
        })}
      </defs>
      {/* kerb, then the lane */}
      {segs.map((d, k) => (
        <path key={`k${k}`} d={d} {...line} strokeWidth={30} className={dark ? "stroke-white/[0.06]" : "stroke-sand-100"} />
      ))}
      {segs.map((d, k) => (
        <path key={`r${k}`} d={d} {...line} strokeWidth={20} className={dark ? "stroke-white/[0.13]" : "stroke-sand-300/70"} />
      ))}
      {segs.map((d, k) =>
        painted(k) ? <path key={`p${k}`} d={d} {...line} strokeWidth={20} stroke={`url(#${uid}-g${k})`} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]" /> : null,
      )}
      {segs.map((d, k) => (
        <path key={`c${k}`} d={d} {...line} strokeWidth={2.5} strokeDasharray="7 11" className={painted(k) ? "stroke-white/80" : dark ? "stroke-white/30" : "stroke-white"} />
      ))}
    </svg>
  );
}

function Station({ m, tone, bubble = "top" }: { m: Milestone; tone: Tone; bubble?: "top" | "bottom" }) {
  const st = STOP_STYLE[m.id];
  const Icon = st.icon;
  const done = m.status === "done";
  const current = m.status === "current";
  const edge = tone === "dark" ? "border-navy-900" : "border-paper";
  return (
    <span className="relative inline-flex" aria-hidden="true">
      {current && (
        <span className={`absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-navy-950 shadow-lg ring-2 ${st.ring} ${bubble === "top" ? "-top-9" : "-bottom-9"}`}>
          אתה כאן
          <span className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white ${bubble === "top" ? "-bottom-1" : "-top-1"}`} />
        </span>
      )}
      <span
        className={`relative z-10 inline-flex size-14 items-center justify-center rounded-full border-4 ${edge} transition-transform duration-300 hover:scale-110 ${
          done || current ? `${st.solid} text-white shadow-[0_6px_0_rgba(0,0,0,0.18)]` : `${tone === "dark" ? "bg-navy-800 text-mist-300" : "bg-sand-200 text-stone-600"}`
        } ${current ? `animate-bob ring-8 ${st.ring}` : ""}`}
      >
        <Icon className="size-6" strokeWidth={2.4} />
        {done && (
          <span className="absolute -end-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
    </span>
  );
}

function StopText({ m, i, tone, linked }: { m: Milestone; i: number; tone: Tone; linked: boolean }) {
  const st = STOP_STYLE[m.id];
  const dark = tone === "dark";
  const done = m.status === "done";
  const current = m.status === "current";
  const body = (
    <>
      <p className={`text-xs font-semibold ${current || done ? (dark ? st.textDark : st.text) : dark ? "text-mist-300" : "text-mist-500"}`}>
        תחנה {i + 1}
        <span className="sr-only">{done ? " (הושלם)" : current ? " (אתה כאן)" : " (עוד לא)"}</span>
      </p>
      <p className={`font-semibold leading-6 ${dark ? "text-paper" : "text-navy-950"}`}>{m.title}</p>
      <p className={`text-sm leading-5 ${dark ? "text-mist-300" : "text-stone-600"}`}>{m.evidence ?? m.blurb}</p>
    </>
  );
  return linked ? (
    <Link href={m.action.href} className="block rounded-lg outline-offset-4 transition-opacity hover:opacity-90">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

/** Ring showing how far along the journey is, drawn with the road's colours. */
export function ProgressRing({ percent, size = 56, tone = "light" }: { percent: number; size?: number; tone?: Tone }) {
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
