"use client";

import { useRef } from "react";

/** Tracks the pointer so `.spotlight-layer` and `.spot-card` borders can light up under it. */
export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={move} className={`spotlight ${className}`}>
      {children}
    </div>
  );
}
