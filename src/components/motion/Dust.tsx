"use client";

import { useEffect, useRef } from "react";

/**
 * Specks of light drifting up through the dark, like dust in the beam from the doorway.
 * A canvas, paused while off screen; not drawn at all when motion is reduced.
 */
export function Dust({ count = 70, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-a11y-motion")) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const specks = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      v: 0.00012 + Math.random() * 0.00035,
      drift: (Math.random() - 0.5) * 0.0002,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.35,
    }));
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    let frame = 0;
    let visible = true;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const s of specks) {
        s.y -= s.v * dt;
        s.x += s.drift * dt;
        if (s.y < -0.02) {
          s.y = 1.02;
          s.x = Math.random();
        }
        const tw = 0.45 + 0.55 * Math.sin(now / 900 + s.phase);
        const px = s.x * w + mx * s.r * 6;
        const py = s.y * h + my * s.r * 6;
        const g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 4);
        const c = s.warm ? "255,217,160" : "127,220,255";
        g.addColorStop(0, `rgba(${c},${0.85 * tw})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (visible) frame = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [count]);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${className}`} />;
}
