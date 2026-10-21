import type { Institution, Pathway } from "@/lib/domain/types";
import { normalize } from "@/lib/search/institutions";

/**
 * Matches entries from authoritative reference lists to catalog records, so coverage can be
 * measured per category. Matching is deliberately conservative: only an identical name in the
 * same category matches automatically; everything else is "ambiguous" (with candidates) or
 * "unresolved" for a person to decide.
 */

export interface RegistryEntry {
  name: string;
  region: string | null;
}

export interface RegistryFile {
  registry: string;
  label: string;
  category: Pathway;
  source_url: string;
  retrieved_on: string;
  method: string;
  scope_note: string;
  reference_total_claimed?: { count: number; source_url: string; label: string };
  entries: RegistryEntry[];
}

export type MatchStatus = "matched" | "unresolved" | "ambiguous";

export interface MatchResult {
  entry: RegistryEntry;
  normalized: string;
  status: MatchStatus;
  candidates: string[]; // catalog ids
}

/** Generic words that don't identify a specific institution. */
const GENERIC = [
  "ישיבת ההסדר",
  "ישיבת הסדר",
  "ישיבת",
  "ישיבה",
  "המכינה הקדם צבאית",
  "מכינה קדם צבאית",
  "מכינת",
  "מכינה",
  "מרכז תורני",
].map(normalize);

/** The identifying part of an institution name: without generic words and without the "…, place" suffix. */
export function coreName(name: string): string {
  let n = normalize(name.split(",")[0]);
  for (const g of GENERIC) n = n.replace(new RegExp(`(^| )${g}( |$)`, "g"), " ");
  return n.replace(/\s+/g, " ").trim();
}

/** Every distinctive phrase of a name, for containment checks ("לב לדעת שדרות" → ["לב לדעת שדרות", "שדרות", …]). */
function phrases(core: string): string[] {
  const words = core.split(" ").filter((w) => w.length >= 3);
  return [core, ...words];
}

export function matchEntry(entry: RegistryEntry, catalog: Institution[], category?: Pathway): MatchResult {
  const result = matchByName(entry, catalog);
  // A match in a different pathway (e.g. a hesder list entry vs. a record we filed as a higher
  // yeshiva) may be the same place, but the classification needs a person's decision.
  if (category && result.status === "matched" && catalog.find((i) => i.id === result.candidates[0])?.pathway !== category)
    return { ...result, status: "ambiguous" };
  return result;
}

/** The quoted part of a list entry, which is usually the institution's own name: ישיבת הסדר "הכותל" → הכותל. */
function quotedName(name: string): string | null {
  const m = name.match(/["״“”]([^"״“”]+)["״“”]/);
  return m ? coreName(m[1]) : null;
}

function matchByName(entry: RegistryEntry, catalog: Institution[]): MatchResult {
  const normalized = coreName(entry.name);
  const key = quotedName(entry.name) ?? normalized;
  // Automatic match only when the identifying name is the same.
  const exact = catalog.filter((i) => coreName(i.name) === key);
  if (exact.length === 1) return { entry, normalized, status: "matched", candidates: [exact[0].id] };
  if (exact.length > 1) return { entry, normalized, status: "ambiguous", candidates: exact.map((i) => i.id) };

  // Overlapping names or a shared place are hints for a reviewer, never an automatic match.
  const full = normalize(entry.name);
  const hints = catalog.filter((i) => {
    const c = coreName(i.name);
    return (c.length >= 3 && full.includes(c)) || normalize(i.name).includes(key) || phrases(c).some((p) => p.length >= 4 && full.includes(p));
  });
  return { entry, normalized, status: hints.length ? "ambiguous" : "unresolved", candidates: hints.map((i) => i.id) };
}

export interface CoverageSummary {
  registry: string;
  category: Pathway;
  referenceCount: number;
  matched: number;
  ambiguous: number;
  unresolved: number;
  /** Catalog records in this category that the reference list does not mention. */
  catalogNotInReference: string[];
  /** Catalog records matched by more than one reference entry: a sign of a bad match. */
  duplicateMatches: string[];
}

export function summarize(file: RegistryFile, results: MatchResult[], catalog: Institution[]): CoverageSummary {
  const matchedIds = results.filter((r) => r.status === "matched").map((r) => r.candidates[0]);
  const counts = new Map<string, number>();
  for (const id of matchedIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    registry: file.registry,
    category: file.category,
    referenceCount: results.length,
    matched: matchedIds.length,
    ambiguous: results.filter((r) => r.status === "ambiguous").length,
    unresolved: results.filter((r) => r.status === "unresolved").length,
    catalogNotInReference: catalog.filter((i) => i.pathway === file.category && !counts.has(i.id)).map((i) => i.id),
    duplicateMatches: [...counts].filter(([, n]) => n > 1).map(([id]) => id),
  };
}
