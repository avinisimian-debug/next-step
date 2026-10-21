import { describe, expect, it } from "vitest";
import { answerSchema, importedStepsSchema, questionSchema, reportSchema, stepSchema } from "./schemas";

describe("input validation", () => {
  it("trims and accepts a valid question, mapping empty optional fields to null", () => {
    const q = questionSchema.parse({ title: "  איך מתקבלים למכינה?  ", body: "מה תהליך המיון ומתי הוא מתחיל", institution_id: "", pathway: "" });
    expect(q).toEqual({ title: "איך מתקבלים למכינה?", body: "מה תהליך המיון ומתי הוא מתחיל", institution_id: null, pathway: null });
  });

  it("rejects questions that are too short or have an unknown pathway", () => {
    expect(questionSchema.safeParse({ title: "קצר", body: "גוף מספיק ארוך כאן" }).success).toBe(false);
    expect(questionSchema.safeParse({ title: "כותרת מספיק ארוכה", body: "גוף מספיק ארוך", pathway: "navy" }).success).toBe(false);
    expect(questionSchema.safeParse({ title: "        ", body: "גוף מספיק ארוך" }).success).toBe(false);
  });

  it("requires a real question id for answers and reports", () => {
    expect(answerSchema.safeParse({ question_id: "1; drop table", body: "תשובה" }).success).toBe(false);
    expect(reportSchema.safeParse({ target_type: "profile", target_id: crypto.randomUUID(), reason: "spam" }).success).toBe(false);
    expect(reportSchema.parse({ target_type: "answer", target_id: "6f1c1f6e-8a3e-4c0e-9a39-0d3c0b5b2f11", reason: "spam", details: "" }).details).toBeNull();
  });

  it("validates pathway steps and imported plans", () => {
    expect(stepSchema.safeParse({ title: "", due_date: "" }).success).toBe(false);
    expect(stepSchema.safeParse({ title: "לבקר", due_date: "31/03/2027" }).success).toBe(false);
    expect(stepSchema.parse({ title: "לבקר", due_date: "2027-03-31" }).due_date).toBe("2027-03-31");
    expect(importedStepsSchema.safeParse([]).success).toBe(false);
    expect(importedStepsSchema.safeParse(Array.from({ length: 41 }, () => ({ title: "x", detail: null, institution_id: null }))).success).toBe(false);
  });
});
