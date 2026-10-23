/** The mark: three steps climbing in the reading direction (right to left), the top one being the next step. */
export function LogoMark({ className = "size-9", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [bg, steps, next] = tone === "dark" ? ["#0f2236", "#ffffff", "#7fc4bc"] : ["#ffffff", "#0f2236", "#2f6f6a"];
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={bg} />
      <path d="M32 31H8V9h8v7.5h8V24h8z" fill={steps} />
      <rect x="8" y="9" width="8" height="7.5" fill={next} />
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
