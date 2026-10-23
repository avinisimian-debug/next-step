"use client";

import { useEffect, useRef } from "react";

/**
 * A tall section whose inner stage stays pinned while you scroll; it publishes how far through the
 * scene you are as --p (0 to 1) for the CSS in globals.css to animate. Nothing moves when motion is reduced or on phones.
 */
export function CinemaHero({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = () =>
      window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)")
        .matches || document.documentElement.hasAttribute("data-a11y-motion");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (still()) return el.style.setProperty("--p", "0");
      const total = el.offsetHeight - window.innerHeight;
      const p =
        total > 0
          ? Math.min(
              1,
              Math.max(0, (window.scrollY - el.offsetTop + 64) / total),
            )
          : 0;
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div ref={ref} id="hero" className={`cinema relative ${className}`}>
      {children}
    </div>
  );
}
