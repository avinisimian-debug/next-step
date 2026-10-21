import type { Pathway } from "@/lib/domain/types";

/**
 * Original vector landscapes used in place of stock photography.
 * Each pathway gets its own terrain and motif; colours come from the design tokens.
 */

type Variant = Pathway | "hero" | "closing";

const PALETTES: Record<Variant, { sky: [string, string]; sun: string; far: string; mid: string; near: string; accent: string }> = {
  hero: { sky: ["#f3eee5", "#e3eaf1"], sun: "#e9c98f", far: "#a9bccd", mid: "#345a80", near: "#0f2236", accent: "#2f6f6a" },
  idf: { sky: ["#efe6d6", "#e8e0d2"], sun: "#e2b878", far: "#c9b79a", mid: "#8a7a5c", near: "#3d4a2e", accent: "#5f6f3f" },
  mechina: { sky: ["#f1e5d2", "#f3eee5"], sun: "#e6b26f", far: "#d8ccb8", mid: "#b49473", near: "#6b5640", accent: "#8a5a12" },
  hesder: { sky: ["#e3eaf1", "#f3eee5"], sun: "#e9c98f", far: "#c4cfb0", mid: "#7f9160", near: "#3f4d2a", accent: "#2f6f6a" },
  yeshiva: { sky: ["#e6ebf1", "#f3eee5"], sun: "#f0d7a3", far: "#d8ccb8", mid: "#bba98c", near: "#7a6a52", accent: "#234567" },
  closing: { sky: ["#17324d", "#0f2236"], sun: "#e9c98f", far: "#345a80", mid: "#234567", near: "#0a1726", accent: "#2f6f6a" },
};

export function Landscape({
  variant = "hero",
  className = "",
  title,
}: {
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  const p = PALETTES[variant];
  const id = `ls-${variant}`;
  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="500" fill={`url(#${id}-sky)`} />
      {variant === "closing" ? (
        <circle cx="720" cy="90" r="16" fill={p.sun} opacity="0.85" />
      ) : (
        <>
          <circle cx="560" cy="170" r="150" fill={`url(#${id}-glow)`} />
          <circle cx="560" cy="170" r="46" fill={p.sun} opacity="0.9" />
        </>
      )}

      {variant === "yeshiva" || variant === "hesder" ? <CityLine color={p.far} /> : null}

      <path d="M0 300 C 120 250 220 270 330 240 S 560 200 680 235 S 780 260 800 250 V500 H0Z" fill={p.far} opacity="0.85" />
      <path d="M0 350 C 140 320 260 345 380 312 S 600 290 720 318 S 790 330 800 326 V500 H0Z" fill={p.mid} opacity="0.92" />
      <path d="M0 410 C 160 380 300 405 430 384 S 650 362 800 392 V500 H0Z" fill={p.near} />

      {variant === "mechina" && <Trail color={p.sky[1]} />}
      {variant === "idf" && <Ridge color={p.near} />}
      {(variant === "hero" || variant === "hesder") && <OliveTree x={150} y={402} color={p.near} />}
      {variant === "hero" && <Steps color={p.accent} />}
      {variant === "yeshiva" && <Arches color={p.near} />}
      {variant === "closing" && <Stars />}
    </svg>
  );
}

function CityLine({ color }: { color: string }) {
  // a quiet, abstract skyline of stone buildings and a dome
  return (
    <g fill={color} opacity="0.7">
      <rect x="430" y="222" width="34" height="30" />
      <rect x="468" y="210" width="22" height="42" />
      <path d="M495 252 V222 a22 22 0 0 1 44 0 V252Z" />
      <rect x="544" y="216" width="26" height="36" />
      <rect x="574" y="228" width="40" height="24" />
    </g>
  );
}

function OliveTree({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      <path d="M-4 0 C -3 -20 -8 -32 -2 -46 L 3 -46 C 6 -32 2 -20 4 0Z" />
      <ellipse cx="-18" cy="-58" rx="26" ry="15" />
      <ellipse cx="14" cy="-64" rx="28" ry="17" />
      <ellipse cx="-2" cy="-80" rx="22" ry="13" />
    </g>
  );
}

function Steps({ color }: { color: string }) {
  return (
    <path
      d="M560 470 h40 v-22 h40 v-22 h40 v-22 h40"
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
  );
}

function Trail({ color }: { color: string }) {
  return (
    <path
      d="M520 500 C 500 460 560 440 520 410 S 470 370 500 345"
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeDasharray="2 12"
      strokeLinecap="round"
      opacity="0.85"
    />
  );
}

function Ridge({ color }: { color: string }) {
  return <path d="M600 392 l40 -46 l26 22 l30 -40 l60 64Z" fill={color} />;
}

function Arches({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="5" opacity="0.85">
      <path d="M470 430 V380 a28 28 0 0 1 56 0 V430" />
      <path d="M540 430 V372 a32 32 0 0 1 64 0 V430" />
      <path d="M618 430 V380 a28 28 0 0 1 56 0 V430" />
    </g>
  );
}

function Stars() {
  const pts = [
    [90, 70], [180, 120], [260, 60], [340, 100], [420, 50], [700, 80], [740, 140], [640, 60], [120, 180],
  ];
  return (
    <g fill="#e3eaf1">
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} opacity="0.7" />
      ))}
    </g>
  );
}
