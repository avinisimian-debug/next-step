/** Placeholder while saved answers are read from the browser. */
export function Loading({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="min-h-[60vh] px-4 py-24 text-center text-sm text-stone-600" aria-busy="true" role="status">
      {label}
    </div>
  );
}
