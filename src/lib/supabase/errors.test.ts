import { describe, expect, it } from "vitest";
import { classifyDbError, userErrorMessage } from "./errors";

describe("classifyDbError", () => {
  it("recognizes the database's own error markers", () => {
    expect(classifyDbError({ code: "P0001", message: "NS_RATE_LIMIT" })).toBe("rate_limit");
    expect(classifyDbError({ code: "42501", message: "NS_FORBIDDEN: status" })).toBe("forbidden");
    expect(classifyDbError({ code: "42501", message: "NS_AUTH_REQUIRED" })).toBe("auth_required");
  });

  it("maps Postgres and PostgREST codes", () => {
    expect(classifyDbError({ code: "42501", message: 'new row violates row-level security policy for table "answers"' })).toBe("forbidden");
    expect(classifyDbError({ code: "23505", message: "duplicate key" })).toBe("duplicate");
    expect(classifyDbError({ code: "23514", message: "check" })).toBe("invalid");
    expect(classifyDbError({ code: "PGRST106", message: "The schema must be one of the following" })).toBe("unavailable");
    expect(classifyDbError({ message: "TypeError: fetch failed" })).toBe("unavailable");
    expect(classifyDbError({ code: "XX000", message: "weird" })).toBe("unknown");
    expect(classifyDbError(null)).toBeNull();
  });

  it("never leaks raw database text", () => {
    const msg = userErrorMessage({ code: "42501", message: 'policy "own saved" on next_step.saved_institutions' });
    expect(msg).not.toMatch(/next_step|policy|saved_institutions/);
  });
});
