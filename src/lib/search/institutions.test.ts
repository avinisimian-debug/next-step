import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { institutionSchema } from "@/lib/domain/types";
import { institutionQueryHref, normalize, parseInstitutionQuery, searchInstitutions, type InstitutionQuery } from "./institutions";

const catalog = institutions.map((i) => institutionSchema.parse(i)).filter((i) => i.published);
const base: InstitutionQuery = { q: "", pathway: null, region: null, audience: null, verifiedOnly: false };
const ids = (q: Partial<InstitutionQuery>) => searchInstitutions(catalog, { ...base, ...q }).map((i) => i.id);

describe("normalize", () => {
  it("strips niqqud, quotes and final letters, and splits on maqaf", () => {
    expect(normalize("צה״ל")).toBe("צהל");
    expect(normalize("צה\"ל")).toBe("צהל");
    expect(normalize("קדם־צבאית")).toBe("קדמ צבאית");
    expect(normalize("שָׁלוֹם")).toBe("שלומ");
  });
});

describe("searchInstitutions", () => {
  it("returns everything for an empty query", () => {
    expect(ids({})).toHaveLength(catalog.length);
  });

  it("finds institutions by name, ignoring quote style", () => {
    expect(ids({ q: "הכותל" })[0]).toBe("hesder-hakotel");
    expect(ids({ q: "עין פרת" })).toContain("mechina-ein-prat");
    expect(ids({ q: "צה\"ל" }).length).toBeGreaterThan(0);
  });

  it("finds by place and tolerates a leading prefix letter", () => {
    expect(ids({ q: "בשדרות" })).toContain("hesder-sderot");
    expect(ids({ q: "ירושלים" })).toEqual(expect.arrayContaining(["hesder-hakotel", "yeshiva-mercaz-harav"]));
  });

  it("requires every word to match", () => {
    expect(ids({ q: "הכותל מודיעין" })).toEqual([]);
  });

  it("ranks name matches above description matches", () => {
    const res = ids({ q: "מרכז הרב" });
    expect(res[0]).toBe("yeshiva-mercaz-harav");
  });

  it("filters by pathway, region, audience and verification", () => {
    expect(searchInstitutions(catalog, { ...base, pathway: "hesder" }).every((i) => i.pathway === "hesder")).toBe(true);
    const south = searchInstitutions(catalog, { ...base, region: "south" });
    expect(south.every((i) => i.regions.includes("south") || i.regions.includes("nationwide"))).toBe(true);
    expect(south.map((i) => i.id)).toContain("hesder-sderot");
    const women = searchInstitutions(catalog, { ...base, audience: "women" });
    expect(women.some((i) => i.attributes.audience === "men")).toBe(false);
    expect(women.map((i) => i.id)).toContain("idf-midrasha-garin");
    expect(searchInstitutions(catalog, { ...base, verifiedOnly: true }).every((i) => i.verificationStatus === "verified")).toBe(true);
  });

  it("never returns unpublished records", () => {
    const draft = { ...catalog[0], id: "draft-record", slug: "draft-record", name: "טיוטה נסתרת", published: false };
    const published = [...catalog, draft].filter((i) => i.published);
    expect(searchInstitutions(published, { ...base, q: "טיוטה נסתרת" })).toEqual([]);
  });

  it("finds directory records by name and by place", () => {
    expect(ids({ q: "נחשון" })).toContain("mechina-nachshon");
    expect(ids({ q: "ישיבת ההסדר צפת" })[0]).toBe("hesder-tzfat");
    expect(ids({ q: "קצרין" })).toEqual(expect.arrayContaining(["mechina-tamir", "yeshiva-mor-dror-katzrin"]));
  });
});

describe("query parsing", () => {
  it("ignores unknown values instead of trusting them", () => {
    expect(parseInstitutionQuery({ pathway: "army", region: "mars", audience: "x", verified: "yes" })).toEqual(base);
  });

  it("round-trips through the URL", () => {
    const q = { ...base, q: "ישיבה", pathway: "yeshiva" as const, verifiedOnly: true };
    const href = institutionQueryHref(q);
    const params = Object.fromEntries(new URL(href, "https://x").searchParams);
    expect(parseInstitutionQuery(params)).toEqual(q);
    expect(institutionQueryHref(base)).toBe("/institutions");
  });

  it("caps very long queries", () => {
    expect(parseInstitutionQuery({ q: "א".repeat(500) }).q).toHaveLength(100);
  });
});
