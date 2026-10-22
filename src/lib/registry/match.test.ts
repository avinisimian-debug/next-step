import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { institutionSchema } from "@/lib/domain/types";
import hesder from "../../../data/registry/hesder-association.json";
import { coreName, matchEntry, summarize, type RegistryFile } from "./match";

const catalog = institutions.map((i) => institutionSchema.parse(i));
const file = hesder as RegistryFile;
const byName = (n: string) => file.entries.find((e) => e.name.includes(n))!;

describe("coreName", () => {
  it("drops generic words, quotes and the place suffix", () => {
    expect(coreName('ישיבת הסדר "הכותל"')).toBe("הכותל");
    expect(coreName("ישיבת ההסדר מאיר הראל, מודיעין")).toBe("מאיר הראל");
    expect(coreName("ישיבת שעלבים")).toBe("שעלבימ");
  });
});

describe("matching the hesder association list", () => {
  it("has the 62 entries recorded from the source", () => {
    expect(file.entries).toHaveLength(62);
    expect(new Set(file.entries.map((e) => e.name)).size).toBe(62);
  });

  it("matches catalog yeshivot when the identifying name is the same", () => {
    expect(matchEntry(byName('"הכותל"'), catalog)).toMatchObject({ status: "matched", candidates: ["hesder-hakotel"] });
    expect(matchEntry(byName('"שעלבים"'), catalog)).toMatchObject({ status: "matched", candidates: ["hesder-shaalvim"] });
    expect(matchEntry(byName("לב לדעת"), catalog, "hesder")).toMatchObject({ status: "matched", candidates: ["hesder-lev-ladaat-sderot"] });
    expect(matchEntry(byName('"הגולן"'), catalog, "hesder")).toMatchObject({ status: "matched", candidates: ["hesder-hagolan"] });
    expect(matchEntry(byName('"ברכת משה"'), catalog)).toMatchObject({ status: "matched", candidates: ["hesder-birkat-moshe"] });
  });

  it("never auto-matches on a shared place name alone", () => {
    // Plausibly the same places as our records, but the names differ: a person decides.
    const otniel = matchEntry(byName("עתניאל"), catalog, "hesder");
    expect(otniel.status).toBe("ambiguous");
    expect(otniel.candidates).toContain("hesder-otniel");
    // ״אפיקי דעת״ is probably our Sderot record, but nothing in the names says so.
    expect(matchEntry(byName("אפיקי דעת"), catalog, "hesder").status).toBe("unresolved");
    // Our catalog files Beit El as a higher yeshiva; the hesder list includes it. Same place, different
    // classification: flagged for review instead of silently merged.
    expect(matchEntry(byName('"בית אל"'), catalog, "hesder")).toMatchObject({ status: "ambiguous", candidates: ["yeshiva-beit-el"] });
  });

  it("summarizes coverage without double-counting", () => {
    const results = file.entries.map((e) => matchEntry(e, catalog, file.category));
    const s = summarize(file, results, catalog);
    expect(s.matched + s.ambiguous + s.unresolved).toBe(62);
    expect(s.duplicateMatches).toEqual([]);
    expect(s.catalogNotInReference).toEqual(expect.arrayContaining(["hesder-meir-harel", "shiluv-maale-gilboa"]));
  });
});
