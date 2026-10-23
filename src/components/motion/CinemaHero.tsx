"use client";

import { useEffect, useRef } from "react";

/**
 * A tall section whose inner stage stays pinned while you scroll; it publishes how far through the
 * scene you are as --p (0 to 1) for the CSS in globals.css to animate. Nothing moves when motion is reduced.
 */
export function CinemaHero({
  children,
  className = "",
  id = "hero",
  media = "(min-width: 768px)",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** The screens this scene plays on; elsewhere --p stays 0. */
  media?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia(media).matches ||
      document.documentElement.hasAttribute("data-a11y-motion");
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
  }, [media]);
  return (
    <div ref={ref} id={id} className={`cinema relative ${className}`}>
      {children}
    </div>
  );
}
