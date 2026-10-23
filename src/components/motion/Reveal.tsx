"use client";

import { useEffect, useRef } from "react";

/**
 * Fades its content up when it scrolls into view. The hidden state lives in CSS (globals.css) and only
 * applies with JS on and motion allowed, so the content is never lost if this never runs.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.setAttribute("data-shown", "");
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // @ts-expect-error -- the ref fits each of the allowed tags
    <Tag ref={ref} data-reveal="" className={className} style={delay ? { "--d": `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
