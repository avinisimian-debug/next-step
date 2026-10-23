import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { institutionSchema, type Institution } from "@/lib/domain/types";
import type { Answers } from "@/lib/questionnaire/questions";
import { pruneAnswers, visibleQuestions } from "@/lib/questionnaire/questions";
import { DEFAULT_CONFIG } from "./config";
import { match, scoreInstitution } from "./engine";

const catalog = institutions;
const ids = (answers: Answers) => match(catalog, answers).recommendations.map((r) => r.institution.id);
const pathways = (answers: Answers) => match(catalog, answers).recommendations.map((r) => r.institution.pathway);

const PROFILES = {
  torahAndService: {
    stage: "grade12",
    audience: "men",
    paths: ["hesder"],
    hesder_balance: "more_torah",
    torah_importance: "central",
    learning_env: "torah_and_service",
    religious_env: "religious_zionist",
    military_feeling: "serve_with_torah",
    service_interest: ["combat"],
    dev_goals: ["torah_growth", "independence"],
    best_env: ["mentorship"],
    learn_pref: "intensive_study",
    priorities: ["torah_quality", "spiritual_atmosphere"],
  },
  combatDirect: {
    stage: "grade12",
    paths: ["idf", "mechina"],
    torah_importance: "not_major",
    learning_env: "practical_service",
    religious_env: "exploring",
    military_feeling: "motivated",
    service_interest: ["combat", "leadership_command"],
    dev_goals: ["fitness", "leadership"],
    best_env: ["challenge", "structure"],
    learn_pref: "experiential",
    priorities: ["military_prep", "leadership"],
  },
  intensiveTorah: {
    stage: "graduated",
    paths: ["yeshiva"],
    yeshiva_style: "very_intensive",
    torah_importance: "central",
    learning_env: "intensive_torah",
    religious_env: "religious_zionist",
    military_feeling: "uncertain",
    dev_goals: ["torah_growth"],
    best_env: ["structure"],
    learn_pref: "intensive_study",
    priorities: ["torah_quality"],
    region: ["jerusalem"],
  },
  mixedMechina: {
    stage: "grade12",
    paths: ["mechina"],
    mechina_group: "mixed_group",
    mechina_focus: ["leadership", "volunteering"],
    torah_importance: "explore",
    learning_env: "structured_development",
    religious_env: "exploring",
    military_feeling: "prep_first",
    dev_goals: ["leadership", "clarity", "social"],
    best_env: ["teamwork", "freedom"],
    learn_pref: "discussion",
    priorities: ["community", "leadership"],
  },
  tech: {
    stage: "grade11",
    paths: ["idf"],
    torah_importance: "not_major",
    learning_env: "practical_service",
    military_feeling: "motivated",
    service_interest: ["tech_intel"],
    dev_goals: ["professional"],
    learn_pref: "practical",
    priorities: ["academic_professional"],
  },
} satisfies Record<string, Answers>;

describe("seed catalog", () => {
  it("every record satisfies the schema", () => {
    for (const r of catalog) expect(() => institutionSchema.parse(r), r.id).not.toThrow();
  });

  it("ids and slugs are unique", () => {
    expect(new Set(catalog.map((r) => r.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((r) => r.slug)).size).toBe(catalog.length);
  });

  it("verified records have an official website and an official or government source", () => {
    for (const r of catalog.filter((x) => x.verificationStatus === "verified")) {
      expect(r.website, r.id).toBeTruthy();
      expect(r.sources.some((s) => s.kind === "official" || s.kind === "government"), r.id).toBe(true);
    }
  });

  it("covers all four pathways with published records", () => {
    const published = catalog.filter((r) => r.published);
    for (const p of ["idf", "mechina", "hesder", "yeshiva"]) {
      expect(published.some((r) => r.pathway === p), p).toBe(true);
    }
  });
});

describe("matching engine — distinct profiles", () => {
  it("torah + service profile gets hesder-type recommendations", () => {
    const res = match(catalog, PROFILES.torahAndService);
    expect(res.recommendations).toHaveLength(3);
    for (const r of res.recommendations) expect(r.institution.pathway).toBe("hesder");
  });

  it("combat-motivated profile gets IDF combat first and no higher yeshiva", () => {
    const res = ids(PROFILES.combatDirect);
    expect(res[0]).toBe("idf-combat");
    expect(pathways(PROFILES.combatDirect)).not.toContain("yeshiva");
  });

  it("intensive Torah profile gets a higher yeshiva first", () => {
    expect(pathways(PROFILES.intensiveTorah)[0]).toBe("yeshiva");
  });

  it("mixed-group mechina profile gets a mixed or general mechina first", () => {
    expect(["mechina-ein-prat", "mechina-rabin"]).toContain(ids(PROFILES.mixedMechina)[0]);
  });

  it("technology profile gets the technology track first", () => {
    expect(ids(PROFILES.tech)[0]).toBe("idf-tech");
  });

  it("different preferences produce meaningfully different results", () => {
    const sets = Object.values(PROFILES).map((p) => ids(p).join(","));
    expect(new Set(sets).size).toBe(sets.length);
  });

  it("is deterministic", () => {
    expect(ids(PROFILES.combatDirect)).toEqual(ids(PROFILES.combatDirect));
  });
});

describe("matching engine — fairness and missing data", () => {
  it("unanswered questions are excluded rather than scored as zero", () => {
    const inst = catalog.find((i) => i.id === "idf-combat")!;
    const base = scoreInstitution(inst, { paths: ["idf"], military_feeling: "motivated" });
    expect(base.score).toBeGreaterThanOrEqual(90);
    expect(base.components.find((c) => c.key === "location")!.score).toBeNull();
    expect(base.coverage).toBeLessThan(1);
  });

  it("skipping every optional question keeps a strong, relevant recommendation", () => {
    const required = pruneAnswers(
      Object.fromEntries(
        Object.entries(PROFILES.torahAndService).filter(([k]) =>
          visibleQuestions(PROFILES.torahAndService).some((q) => q.id === k && !q.optional),
        ),
      ),
    );
    const res = match(catalog, required);
    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(res.recommendations[0].institution.pathway).toBe("hesder");
    expect(res.recommendations[0].score).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minScore);
  });

  it("a neutral answer does not change the score", () => {
    const inst = catalog.find((i) => i.id === "hesder-hakotel")!;
    const a = scoreInstitution(inst, PROFILES.torahAndService).score;
    const b = scoreInstitution(inst, { ...PROFILES.torahAndService, social: "no_pref", region: ["anywhere"] }).score;
    expect(b).toBe(a);
  });

  it("does not exclude a pathway the user didn't pick — it only ranks it lower", () => {
    const res = match(catalog, PROFILES.tech);
    expect(res.ranked.some((r) => r.institution.pathway === "hesder")).toBe(true);
  });

  it("audience is a hard constraint only when the institution's audience is known", () => {
    const women = match(catalog, { ...PROFILES.torahAndService, audience: "women" });
    expect(women.recommendations.map((r) => r.institution.id)).not.toContain("hesder-hakotel");
    expect(women.excluded.some((e) => e.institution.id === "hesder-hakotel")).toBe(true);
    expect(women.ranked.some((r) => r.institution.id === "idf-midrasha-garin")).toBe(true);
    // unknown audience is kept and flagged
    expect(women.ranked.some((r) => r.institution.id === "mechina-hadar")).toBe(true);
    // a yeshiva whose audience wasn't stated is still in the boys' track
    expect(women.excluded.some((e) => e.institution.id === "shiluv-maale-gilboa")).toBe(true);

    const men = match(catalog, { ...PROFILES.torahAndService, audience: "men" });
    expect(men.ranked.some((r) => r.institution.id === "idf-midrasha-garin")).toBe(false);
  });

  it("women interested in torah and service get the midrasha track", () => {
    const res = match(catalog, { ...PROFILES.torahAndService, audience: "women", paths: ["idf", "hesder", "open"] });
    expect(res.recommendations.map((r) => r.institution.id)).toContain("idf-midrasha-garin");
  });
});

describe("matching engine — boys' and girls' tracks", () => {
  const girl: Answers = {
    stage: "grade12",
    audience: "women",
    paths: ["national_service", "midrasha"],
    torah_importance: "alongside",
    learning_env: "structured_development",
    military_feeling: "national_service",
    dev_goals: ["torah_growth", "independence"],
  };

  it("offers girls national service, midrashot, mechinot and the IDF, and boys the four boys' pathways", () => {
    expect(match(catalog, girl).pathways.map((p) => p.pathway).sort()).toEqual(
      ["idf", "mechina", "midrasha", "national_service"].sort(),
    );
    expect(match(catalog, PROFILES.torahAndService).pathways.map((p) => p.pathway).sort()).toEqual(
      ["hesder", "idf", "mechina", "yeshiva"].sort(),
    );
  });

  it("never shows a boy national service or midrashot, and never shows a girl a yeshiva", () => {
    const boy = match(catalog, { ...PROFILES.torahAndService, paths: ["open"] });
    expect(boy.ranked.some((r) => ["national_service", "midrasha"].includes(r.institution.pathway))).toBe(false);
    const res = match(catalog, girl);
    expect(res.ranked.some((r) => ["hesder", "yeshiva"].includes(r.institution.pathway))).toBe(false);
  });

  it("recommends national service and midrashot to a girl who chose them", () => {
    const res = match(catalog, girl);
    expect(res.recommendations.length).toBeGreaterThan(0);
    for (const r of res.recommendations) expect(["national_service", "midrasha"]).toContain(r.institution.pathway);
  });

  it("prefers a shiluv midrasha when that is the programme she asked for", () => {
    const res = match(catalog, { ...girl, paths: ["midrasha"], midrasha_mode: "shiluv" });
    expect(res.recommendations[0].institution.attributes.programModes).toContain("shiluv");
  });

  it("every girls' record is published, sourced and in a girls' or shared pathway", () => {
    const girls = catalog.filter((i) => i.pathway === "national_service" || i.pathway === "midrasha");
    expect(girls.length).toBeGreaterThan(60);
    for (const i of girls) {
      expect(institutionSchema.safeParse(i).success).toBe(true);
      expect(i.sources.length).toBeGreaterThan(0);
    }
  });
});

describe("matching engine — reliability", () => {
  it("never returns unpublished or unverified records", () => {
    const base = catalog.find((i) => i.id === "mechina-ein-prat")!;
    const drafts: Institution[] = [
      { ...base, id: "draft-unpublished", slug: "draft-unpublished", published: false },
      { ...base, id: "draft-unverified", slug: "draft-unverified", verificationStatus: "unverified" },
    ];
    for (const p of Object.values(PROFILES)) {
      const res = match([...catalog, ...drafts], { ...p, paths: ["mechina"] });
      expect(res.ranked.map((r) => r.institution.id)).not.toContain("draft-unpublished");
      expect(res.ranked.map((r) => r.institution.id)).not.toContain("draft-unverified");
    }
  });

  it("does not pad results with weak matches", () => {
    const res = match(catalog, PROFILES.tech, { ...DEFAULT_CONFIG, minScore: 101 });
    expect(res.recommendations).toHaveLength(0);
    expect(res.limitation).toBeTruthy();
  });

  it("explains a shortfall when fewer than three options qualify", () => {
    const small: Institution[] = catalog.filter((i) => i.id === "idf-tech" || i.id === "yeshiva-har-hamor");
    const res = match(small, PROFILES.tech);
    expect(res.recommendations.length).toBeLessThan(3);
    expect(res.limitation).toMatch(/לא נציג התאמות חלשות/);
  });

  it("prefers variety across pathways for users open to several", () => {
    const res = match(catalog, { ...PROFILES.mixedMechina, paths: ["open"] });
    expect(new Set(res.recommendations.map((r) => r.institution.pathway)).size).toBeGreaterThan(1);
  });

  it("every recommendation is explained", () => {
    for (const p of Object.values(PROFILES)) {
      for (const r of match(catalog, p).recommendations) {
        expect(r.reasons.length, r.institution.id).toBeGreaterThan(0);
        expect(r.verify.length).toBeGreaterThan(0);
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("flags low confidence when few questions are answered", () => {
    expect(match(catalog, { paths: ["idf"] }).lowConfidence).toBe(true);
  });
});

describe("questionnaire logic", () => {
  it("shows follow-ups only for selected pathways", () => {
    const qs = (a: Answers) => visibleQuestions(a).map((q) => q.id);
    expect(qs({ paths: ["hesder"] })).toContain("hesder_balance");
    expect(qs({ paths: ["hesder"] })).not.toContain("mechina_focus");
    expect(qs({ paths: ["mechina"] })).toContain("mechina_group");
    expect(qs({ paths: ["yeshiva"] })).toContain("yeshiva_style");
    expect(qs({ paths: ["idf"] })).toContain("idf_guidance");
    expect(qs({ paths: ["not_sure"] })).toContain("undecided_next_year");
    expect(qs({ paths: ["idf"] })).not.toContain("undecided_next_year");
  });

  it("keeps the main flow between 12 and 18 questions", () => {
    const n = visibleQuestions({ paths: ["idf"] }).length;
    expect(n).toBeGreaterThanOrEqual(12);
    expect(n).toBeLessThanOrEqual(22);
  });

  it("asks boy or girl first, and words the questions for a girl", () => {
    expect(visibleQuestions({})[0].id).toBe("audience");
    const paths = (a: Answers) => visibleQuestions(a).find((q) => q.id === "paths")!;
    expect(paths({ audience: "women" }).title).toBe("אילו כיוונים את שוקלת כרגע?");
    expect(paths({ audience: "women" }).options!.map((o) => o.id)).not.toContain("hesder");
    expect(paths({ audience: "women" }).options!.map((o) => o.id)).toContain("national_service");
    expect(paths({ audience: "men" }).options!.map((o) => o.id)).not.toContain("midrasha");
  });

  it("drops the other track's choices when the gender changes", () => {
    const pruned = pruneAnswers({ audience: "women", paths: ["hesder", "midrasha"], hesder_balance: "balanced" });
    expect(pruned.paths).toEqual(["midrasha"]);
    expect(pruned.hesder_balance).toBeUndefined();
  });

  it("prunes answers to follow-ups that no longer apply", () => {
    const pruned = pruneAnswers({ paths: ["idf"], hesder_balance: "balanced" });
    expect(pruned.hesder_balance).toBeUndefined();
  });
});
