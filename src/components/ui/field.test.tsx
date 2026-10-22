import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./ui";

const render = (props: { hint?: string; error?: string }, inputProps: Record<string, string> = {}) =>
  renderToStaticMarkup(
    <Field id="f" label="שם" {...props}>
      <input id="f" {...inputProps} />
    </Field>,
  );

describe("Field", () => {
  it("links the hint to the control", () => {
    expect(render({ hint: "רמז" })).toContain('aria-describedby="f-hint"');
  });

  it("marks the control invalid and links the error, which is announced", () => {
    const html = render({ hint: "רמז", error: "שגיאה" });
    expect(html).toContain('aria-describedby="f-hint f-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toMatch(/<p id="f-error" role="alert"[^>]*>שגיאה<\/p>/);
  });

  it("keeps a description the control already has, without duplicates", () => {
    const html = render({ error: "שגיאה" }, { "aria-describedby": "f-error other" });
    expect(html).toContain('aria-describedby="f-error other"');
  });

  it("adds nothing when there is no hint or error", () => {
    const html = render({});
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("aria-invalid");
  });
});
