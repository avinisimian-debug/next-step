export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "text-navy-950" : "text-paper";
  return (
    <span className={`inline-flex items-center gap-2.5 ${fg}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" className={tone === "dark" ? "fill-navy-900" : "fill-paper"} />
        {/* three rising steps */}
        <path d="M7 23h6v-4h6v-4h6V9" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className={tone === "dark" ? "stroke-sand-100" : "stroke-navy-900"} />
        <circle cx="25" cy="9" r="2.2" className="fill-teal-600" />
      </svg>
      <span className="flex flex-col leading-none">
        <span dir="ltr" className="font-sans text-[15px] font-bold tracking-[0.18em]">NEXT STEP</span>
        <span className="mt-1 text-[11px] font-medium text-mist-500">הצעד הבא שלך</span>
      </span>
    </span>
  );
}
