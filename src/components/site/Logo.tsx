import { useId } from "react";

/** The mark: a winding road climbing to a flag, in the colours of the journey map. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#17324d" />
          <stop offset="1" stopColor="#0a1726" />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="0.5" stopColor="#f43f5e" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${id}-bg)`} />
      <path d="M10 34 C10 26 29 28 29 20.5 C29 14 15 16 16 10.5" fill="none" stroke={`url(#${id}-road)`} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M10 34 C10 26 29 28 29 20.5 C29 14 15 16 16 10.5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.1" strokeDasharray="1.6 2.6" strokeLinecap="round" />
      {/* flag at the top of the road */}
      <path d="M16 11V4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.6 4.6h7.2l-2 2.3 2 2.3h-7.2z" fill="#10b981" />
    </svg>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "text-navy-950" : "text-paper";
  return (
    <span className={`inline-flex items-center gap-2.5 ${fg}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span dir="ltr" className="font-sans text-[16px] font-extrabold tracking-[0.14em]">
          NEXT{" "}
          <span className="bg-gradient-to-r from-violet-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">STEP</span>
        </span>
        <span className={`mt-1 text-[11px] font-medium ${tone === "dark" ? "text-mist-500" : "text-mist-300"}`}>הצעד הבא שלך</span>
      </span>
    </span>
  );
}
