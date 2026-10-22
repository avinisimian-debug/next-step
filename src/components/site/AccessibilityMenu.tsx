"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { A11Y_KEY } from "@/lib/a11y";
import { Accessibility, Contrast, Link2, Minus, PauseCircle, Plus, RotateCcw, Type, X } from "lucide-react";

/**
 * Display adjustments that sit on top of the site's own accessible markup: text size, stronger contrast,
 * underlined links, a plainer font and no motion. Choices are stored on this device only and applied as
 * data attributes on <html>, which globals.css turns into styles. The inline script in layout.tsx
 * applies them before first paint, so pages don't flash.
 */

type Prefs = { text: 0 | 1 | 2 | 3; contrast: boolean; links: boolean; font: boolean; motion: boolean };
const DEFAULTS: Prefs = { text: 0, contrast: false, links: false, font: false, motion: false };

function apply(p: Prefs) {
  const el = document.documentElement;
  const set = (name: string, on: boolean, value = "1") => (on ? el.setAttribute(name, value) : el.removeAttribute(name));
  set("data-a11y-text", p.text > 0, String(p.text));
  set("data-a11y-contrast", p.contrast);
  set("data-a11y-links", p.links);
  set("data-a11y-font", p.font);
  set("data-a11y-motion", p.motion);
}

function load(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(A11Y_KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setPrefs(load()), []);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (next: Prefs) => {
    setPrefs(next);
    apply(next);
    try {
      if (JSON.stringify(next) === JSON.stringify(DEFAULTS)) localStorage.removeItem(A11Y_KEY);
      else localStorage.setItem(A11Y_KEY, JSON.stringify(next));
    } catch {
      // storage blocked: the choice still applies for this visit
    }
  };

  const toggles: { key: "contrast" | "links" | "font" | "motion"; label: string; icon: typeof Contrast }[] = [
    { key: "contrast", label: "ניגודיות גבוהה", icon: Contrast },
    { key: "links", label: "הדגשת קישורים", icon: Link2 },
    { key: "font", label: "גופן קריא", icon: Type },
    { key: "motion", label: "עצירת אנימציות", icon: PauseCircle },
  ];

  return (
    <div className="print:hidden">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] end-3 z-50 inline-flex size-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lift transition hover:bg-blue-800 lg:bottom-6 lg:end-6"
      >
        <Accessibility className="size-7" aria-hidden="true" />
        <span className="sr-only">תפריט נגישות</span>
      </button>

      {open && (
        <div
          ref={panel}
          id="a11y-panel"
          role="dialog"
          aria-label="תפריט נגישות"
          className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] end-3 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-3xl border border-sand-200 bg-paper p-5 text-navy-950 shadow-lift lg:bottom-20 lg:end-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">נגישות</h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              className="inline-flex size-9 items-center justify-center rounded-full hover:bg-sand-100"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">סגירת תפריט הנגישות</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-sand-100 p-2">
            <button
              type="button"
              onClick={() => update({ ...prefs, text: Math.max(0, prefs.text - 1) as Prefs["text"] })}
              disabled={prefs.text === 0}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-paper shadow-sm disabled:opacity-40"
            >
              <Minus className="size-5" aria-hidden="true" />
              <span className="sr-only">הקטנת טקסט</span>
            </button>
            <p className="text-sm font-medium" aria-live="polite">
              גודל טקסט: {[100, 115, 130, 150][prefs.text]}%
            </p>
            <button
              type="button"
              onClick={() => update({ ...prefs, text: Math.min(3, prefs.text + 1) as Prefs["text"] })}
              disabled={prefs.text === 3}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-paper shadow-sm disabled:opacity-40"
            >
              <Plus className="size-5" aria-hidden="true" />
              <span className="sr-only">הגדלת טקסט</span>
            </button>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {toggles.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={prefs[key]}
                  onClick={() => update({ ...prefs, [key]: !prefs[key] })}
                  className={`flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border p-3 text-sm font-medium transition ${
                    prefs[key] ? "border-blue-700 bg-blue-700 text-white" : "border-sand-300 bg-paper hover:border-blue-700"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <button type="button" onClick={() => update(DEFAULTS)} className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
              <RotateCcw className="size-4" aria-hidden="true" />
              איפוס
            </button>
            <Link href="/accessibility" onClick={() => setOpen(false)} className="font-medium underline underline-offset-4">
              הצהרת נגישות
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
