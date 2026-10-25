/** Placeholder while saved answers are read from the browser. */
export function Loading({ label = "טוען…", title }: { label?: string; title?: string }) {
  return (
    <div className="min-h-[60vh] px-4 py-24 text-center text-sm text-stone-600" aria-busy="true" role="status">
      {/* The page's own h1 replaces this one once it loads, so there is always exactly one. */}
      {title && <h1 className="mb-3 font-display text-3xl font-bold text-navy-950">{title}</h1>}
      {label}
    </div>
  );
}
