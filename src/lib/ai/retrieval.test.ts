import { describe, expect, it } from "vitest";
import { institutions } from "@/data/institutions";
import { institutionSchema } from "@/lib/domain/types";
import { acceptAnswer, keywords, retrieve, type CommunityDoc } from "./retrieval";

const catalog = institutions.map((i) => institutionSchema.parse(i)).filter((i) => i.published);

describe("assistant retrieval", () => {
  it("drops question words and keeps content words", () => {
    expect(keywords("מה סדר היום בישיבת הכותל?")).toEqual(["סדר", "היומ", "בישיבת", "הכותל"]);
    expect(keywords("מה? איך?")).toEqual([]);
  });

  it("finds the institution the question is about and labels its verification", () => {
    const sources = retrieve("מה סדר היום בישיבת הכותל?", catalog, []);
    const kotel = sources.find((s) => s.title === "ישיבת הכותל");
    expect(kotel).toBeDefined();
    expect(kotel!.trust).toBe("verified");
    expect(kotel!.href).toBe("/institutions/hakotel");
    expect(sources.map((s) => s.id)).toEqual(sources.map((_, n) => `S${n + 1}`));
  });

  it("includes pathway overviews and community threads only when they have answers", () => {
    const community: CommunityDoc[] = [
      { id: "11111111-1111-4111-8111-111111111111", title: "מכינה או הסדר?", body: "מתלבט בין מכינה להסדר", answers: [{ body: "אני הלכתי למכינה", kind: "experience" }] },
      { id: "22222222-2222-4222-8222-222222222222", title: "מכינה בצפון?", body: "יש מכינה בצפון?", answers: [] },
    ];
    const sources = retrieve("מכינה או ישיבת הסדר", catalog, community);
    expect(sources.some((s) => s.kind === "pathway")).toBe(true);
    const threads = sources.filter((s) => s.kind === "community");
    expect(threads).toHaveLength(1);
    expect(threads[0].trust).toBe("personal_experience");
    expect(threads[0].text).toContain("תשובה מניסיון אישי");
  });

  it("returns nothing for questions with no content words, so the model is never called blind", () => {
    expect(retrieve("מה?", catalog, [])).toEqual([]);
  });
});

describe("acceptAnswer", () => {
  const provided = retrieve("ישיבת הכותל ירושלים", catalog, []);

  it("keeps answers that cite provided sources and strips unknown citations", () => {
    const res = acceptAnswer({ status: "answered", answer: "לפי האתר [S1], עיקר הלימוד בגמרא [S99].", citations: ["S1", "S99"], confidence: "medium" }, provided);
    expect(res.status).toBe("answered");
    if (res.status !== "answered") return;
    expect(res.answer).toBe("לפי האתר [S1], עיקר הלימוד בגמרא .");
    expect(res.sources.map((s) => s.id)).toEqual(["S1"]);
  });

  it("refuses answers without a valid citation", () => {
    expect(acceptAnswer({ status: "answered", answer: "תשובה בלי מקור", citations: [], confidence: "high" }, provided).status).toBe("insufficient");
    expect(acceptAnswer({ status: "answered", answer: "מקור מומצא", citations: ["S42"], confidence: "high" }, provided).status).toBe("insufficient");
  });

  it("passes through the model saying it does not know", () => {
    expect(acceptAnswer({ status: "insufficient", answer: "", citations: [], confidence: "low" }, provided).status).toBe("insufficient");
  });
});
