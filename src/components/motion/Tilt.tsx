"use client";

import { useRef } from "react";

/** Tilts a card in 3D toward the mouse pointer, with a glare that follows it. */
export function Tilt({
  children,
  className = "",
  max = 8,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-a11y-motion")) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    // @ts-expect-error -- the ref fits each of the allowed tags
    <Tag ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt transition-transform duration-300 ease-out ${className}`}>
      {children}
    </Tag>
  );
}
