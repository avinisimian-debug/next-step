import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { match, rankPathways } from "@/lib/matching/engine";
import { DEFAULT_CONFIG } from "@/lib/matching/config";
import { PATHWAYS_FOR } from "@/lib/domain/pathways";
import type { Answers } from "@/lib/questionnaire/questions";
import { allStepIds, buildActionPlan } from "./actionPlan";

const hesder: Answers = {
  stage: "grade12",
  audience: "men",
  paths: ["hesder", "mechina"],
  torah_importance: "central",
  learning_env: "torah_and_service",
  military_feeling: "serve_with_torah",
  dev_goals: ["torah_growth"],
  idf_guidance: ["roles", "process"],
};
const sparse: Answers = { stage: "grade11", paths: ["not_sure"] };

const plan = (a: Answers) => buildActionPlan(match(institutions, a), a);

describe("pathway ranking", () => {
  it("returns the boys' four pathways, sorted by best score with empty pathways last", () => {
    const { pathways } = match(institutions, hesder);
    expect(pathways.map((p) => p.pathway).sort()).toEqual([...PATHWAYS_FOR.men].sort());
    const scores = pathways.map((p) => p.score ?? -1);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("puts the pathway the user is drawn to first", () => {
    expect(match(institutions, hesder).pathways[0].pathway).toBe("hesder");
  });

  it("counts qualifying options consistently with the threshold", () => {
    const r = match(institutions, hesder);
    for (const p of r.pathways) {
      const inPathway = r.ranked.filter((x) => x.institution.pathway === p.pathway);
      expect(p.considered).toBe(inPathway.length);
      expect(p.qualifying).toBe(inPathway.filter((x) => x.score >= DEFAULT_CONFIG.minScore).length);
    }
  });

  it("explains a pathway whose options are all excluded by the audience constraint", () => {
    const yeshivot = institutions.filter((i) => i.pathway === "yeshiva");
    const fits = rankPathways([], yeshivot.map((institution) => ({ institution, reason: "audience" })), DEFAULT_CONFIG);
    expect(fits.find((p) => p.pathway === "yeshiva")!.excludedNote).toBeTruthy();
    expect(fits.find((p) => p.pathway === "idf")!.excludedNote).toBeUndefined();
    expect(fits.every((p) => p.score === null && p.considered === 0)).toBe(true);
  });
});

describe("action plan", () => {
  it("has one section per recommendation, in the same order", () => {
    const r = match(institutions, hesder);
    const sections = buildActionPlan(r, hesder);
    const recIds = r.recommendations.map((x) => x.institution.id);
    expect(sections.filter((s) => recIds.includes(s.id)).map((s) => s.id)).toEqual(recIds);
  });

  it("is deterministic and uses unique step ids", () => {
    const ids = allStepIds(plan(hesder));
    expect(new Set(ids).size).toBe(ids.length);
    expect(allStepIds(plan(hesder))).toEqual(ids);
  });

  it("never states a contact detail that is not in the catalog", () => {
    const r = match(institutions, hesder);
    for (const rec of r.recommendations) {
      const contact = plan(hesder).find((s) => s.id === rec.institution.id)!.steps.find((s) => s.id.endsWith(":contact"));
      const text = contact?.text ?? "";
      const phones = text.match(/0\d[\d-]{6,}/g) ?? [];
      for (const ph of phones) expect(rec.institution.contact?.phone).toContain(ph);
    }
  });

  it("links to the official website only when the record has one", () => {
    const r = match(institutions, hesder);
    for (const rec of r.recommendations) {
      const step = plan(hesder).find((s) => s.id === rec.institution.id)!.steps.find((s) => s.id.endsWith(":website"))!;
      expect(step.href).toBe(rec.institution.website);
    }
  });

  it("only states deadlines that carry a source", () => {
    for (const a of [hesder, sparse]) {
      for (const step of plan(a).flatMap((s) => s.steps)) {
        if (/\d{1,2} ב(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)|בין ספטמבר/.test(step.text))
          expect(step.source).toBeTruthy();
      }
    }
  });

  it("adapts to the user's stage and answers", () => {
    const sparseIds = allStepIds(plan(sparse));
    expect(sparseIds).toContain("complete");
    expect(plan(sparse)[0].steps[0].text).toContain("יש לך זמן");
    expect(allStepIds(plan(hesder))).toEqual(expect.arrayContaining(["idf:roles", "idf:process"]));
    expect(sparseIds.some((id) => id.startsWith("idf:"))).toBe(false);
  });
});
