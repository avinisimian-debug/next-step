"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `to` once it is on screen. Screen readers get the final number only. */
export function CountUp({ to, duration = 1600 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  useEffect(() => {
    const el = ref.current;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-a11y-motion");
    if (!el || still) return;
    setValue(0);
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 4))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);
  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {value}
      </span>
      <span className="sr-only">{to}</span>
    </>
  );
}
