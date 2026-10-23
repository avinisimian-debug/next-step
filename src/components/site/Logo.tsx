/** The mark: someone mid-stride, about to land on the highlighted next step. Walks right to left, with the reading direction. */
export function LogoMark({ className = "size-9", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [bg, fg, next] = tone === "dark" ? ["#0f2236", "#ffffff", "#7fc4bc"] : ["#ffffff", "#0f2236", "#2f6f6a"];
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={bg} />
      <rect x="25" y="31.4" width="10" height="3.4" rx="1.2" fill={fg} opacity="0.3" />
      <rect x="6" y="29" width="12" height="3.4" rx="1.2" fill={next} />
      <circle cx="21.2" cy="7.2" r="3.1" fill={fg} />
      <g fill="none" stroke={fg} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.6 12.2 23.4 20.2" />
        <path d="M23.4 20.2 18 22.6l-3.4 3.8" />
        <path d="m23.4 20.2 2.9 5.4 3.3 4" />
        <path d="m22 13.8-3.6 3-2.2-2.2" />
        <path d="m22 13.8 3.6 3.4 1.8 3.2" />
      </g>
    </svg>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "text-navy-950" : "text-paper";
  return (
    <span className={`inline-flex items-center gap-2.5 ${fg}`}>
      <LogoMark tone={tone} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-bold">הצעד הבא</span>
        <span className={`mt-1 text-[11px] font-medium ${tone === "dark" ? "text-mist-500" : "text-mist-300"}`}>המסלול שלך אחרי י״ב</span>
      </span>
    </span>
  );
}
