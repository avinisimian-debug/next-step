import { describe, expect, it } from "vitest";
import { loginHref, safeNext } from "./redirect";

describe("safeNext", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/community/abc?x=1")).toBe("/community/abc?x=1");
  });
  it("rejects anything that could leave the site", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42, "/a\nb"]) {
      expect(safeNext(bad)).toBe("/account");
    }
  });
  it("encodes the destination in login links", () => {
    expect(loginHref("/community/ask?institution=x")).toBe("/login?next=%2Fcommunity%2Fask%3Finstitution%3Dx");
  });
});
