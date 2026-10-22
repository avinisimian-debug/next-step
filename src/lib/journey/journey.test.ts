import { describe, expect, it } from "vitest";
import { computeJourney, isStage, journeyPercent, nextActionFor, stageLabel, stagesFor } from "./journey";

const status = (ms: ReturnType<typeof computeJourney>) => Object.fromEntries(ms.map((m) => [m.id, m.status]));

describe("computeJourney", () => {
  it("starts at the questionnaire for a new visitor", () => {
    const ms = computeJourney({ answered: 0, places: [], compared: 0 });
    expect(status(ms)).toEqual({
      discover: "current",
      shortlist: "upcoming",
      explore: "upcoming",
      compare: "upcoming",
      apply: "upcoming",
      placement: "upcoming",
    });
    expect(journeyPercent(ms)).toBe(0);
  });

  it("moves forward with saved places and their stages", () => {
    const ms = computeJourney({ answered: 12, places: [{ stage: "visited" }, { stage: "interested" }], compared: 0 });
    expect(status(ms)).toMatchObject({ discover: "done", shortlist: "done", explore: "done", compare: "current", apply: "upcoming" });
    expect(ms.find((m) => m.id === "shortlist")?.evidence).toBe("2 מקומות ברשימה");
  });

  it("counts comparison by explicit compare list or by two places in contact", () => {
    expect(status(computeJourney({ answered: 1, places: [{ stage: "interested" }], compared: 2 })).compare).toBe("done");
    expect(status(computeJourney({ answered: 1, places: [{ stage: "contacted" }, { stage: "applied" }], compared: 0 })).compare).toBe("done");
  });

  it("ignores dropped places", () => {
    const ms = computeJourney({ answered: 3, places: [{ stage: "dropped" }], compared: 0 });
    expect(status(ms).shortlist).toBe("current");
  });

  it("finishes only when a place is marked as chosen", () => {
    const accepted = computeJourney({ answered: 3, places: [{ stage: "accepted" }, { stage: "applied" }], compared: 2 });
    expect(status(accepted).placement).toBe("current");
    expect(accepted.find((m) => m.id === "placement")?.evidence).toBe("מקום אחד עם תשובה חיובית");
    const chosen = computeJourney({ answered: 3, places: [{ stage: "chosen" }, { stage: "applied" }], compared: 2 });
    expect(journeyPercent(chosen)).toBe(100);
  });
});

describe("stages", () => {
  it("offers IDF tracks the call-up process rather than an application", () => {
    expect(stagesFor("track")).not.toContain("applied");
    expect(stageLabel("contacted", "track")).toBe("עברתי צו ראשון");
    expect(stageLabel("contacted", "institution")).toBe("יצרתי קשר");
  });

  it("validates stage values", () => {
    expect(isStage("applied")).toBe(true);
    expect(isStage("admin")).toBe(false);
    expect(isStage(3)).toBe(false);
  });

  it("uses only catalog contact details in the next action", () => {
    const withContact = nextActionFor({ kind: "institution", slug: "x", contact: { phone: ["02-0000000"] } }, "interested");
    expect(withContact?.text).toContain("02-0000000");
    const without = nextActionFor({ kind: "institution", slug: "x" }, "interested");
    expect(without?.href).toBe("/institutions/x");
    expect(nextActionFor({ kind: "institution", slug: "x" }, "chosen")).toBeNull();
  });
});
