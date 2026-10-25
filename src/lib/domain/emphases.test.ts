import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { selfDescriptions } from "@/data/self-descriptions";
import { institutionSchema } from "@/lib/domain/types";
import { match } from "@/lib/matching/engine";
import { withSelfDescription } from "./emphases";

const byId = new Map(institutions.map((i) => [i.id, i]));

describe("self-descriptions", () => {
  it("belong to institutions that exist, and only to yeshivot", () => {
    for (const id of Object.keys(selfDescriptions)) {
      const inst = byId.get(id);
      expect(inst, id).toBeDefined();
      expect(["hesder", "yeshiva"]).toContain(inst!.pathway);
    }
  });

  it("are attached to the catalog and keep every record valid", () => {
    for (const [id, self] of Object.entries(selfDescriptions)) {
      const inst = byId.get(id)!;
      expect(inst.selfDescription).toEqual(self);
      expect(institutionSchema.safeParse(inst).success, id).toBe(true);
      expect(inst.sources.some((s) => s.url === self.source.url), id).toBe(true);
    }
  });

  it("replace the generic text of directory records but not researched ones", () => {
    const directory = byId.get("hesder-binot-raanana")!;
    expect(directory.shortDescription).toBe(directory.selfDescription!.summary);
    const researched = byId.get("hesder-hakotel")!;
    expect(researched.shortDescription).not.toBe(researched.selfDescription!.summary);
  });

  it("add matching attributes from the emphases, without removing any", () => {
    const base = byId.get("hesder-orot-yaakov-rehovot")!;
    const bare = { ...base, selfDescription: undefined, attributes: { ...base.attributes, strengths: [] } };
    const applied = withSelfDescription({ ...bare, selfDescription: base.selfDescription });
    expect(applied.attributes.strengths).toContain("academic_professional");
    expect(applied.attributes.environmentStyles).toContain("mentorship");
  });
});

describe("yeshiva_focus question", () => {
  const answers = { stage: "grade12", audience: "men", paths: ["hesder"], yeshiva_focus: ["academic"] };

  it("ranks yeshivot whose own description matches above ones that don't", () => {
    const ranked = match(institutions, answers).ranked.filter((r) => r.institution.pathway === "hesder");
    const score = (id: string) => ranked.find((r) => r.institution.id === id)!.score;
    expect(score("hesder-orot-yaakov-rehovot")).toBeGreaterThan(score("hesder-ramla"));
  });

  it("explains the match in terms of the yeshiva's own words", () => {
    const rec = match(institutions, answers).ranked.find((r) => r.institution.id === "hesder-orot-yaakov-rehovot")!;
    expect(rec.reasons.some((r) => r.includes("וכך הישיבה מתארת את עצמה"))).toBe(true);
  });
});
