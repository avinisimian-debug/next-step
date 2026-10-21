"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store. Everything the user enters stays in their browser.
 * Keys are versioned so the shape can change without breaking old saved data.
 */

export const KEYS = {
  answers: "nextstep.answers.v1",
  progress: "nextstep.progress.v1",
  favorites: "nextstep.favorites.v1",
  compare: "nextstep.compare.v1",
  aiConsent: "nextstep.aiConsent.v1",
  plan: "nextstep.plan.v1",
} as const;

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStored<T>(key: string, value: T | undefined) {
  try {
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be unavailable (private mode); the app still works in-memory for this view
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const SERVER = Symbol("server");

/** Returns `[value, setValue, hydrated]`. `hydrated` is false during SSR and the first client render. */
export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => read<T>(key, fallback),
    () => SERVER as unknown as T,
  );
  const hydrated = (snapshot as unknown) !== SERVER;
  const value = hydrated ? snapshot : fallback;
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(read<T>(key, fallback)) : v;
      writeStored(key, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set, hydrated];
}

export function clearAllStored() {
  Object.values(KEYS).forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
  cache.clear();
  listeners.forEach((l) => l());
}
