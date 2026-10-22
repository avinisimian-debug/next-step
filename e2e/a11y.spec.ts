import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA checks (the level Israeli Standard 5568 points to). They catch a large share of
// problems, not all of them: keyboard and screen-reader passes are still done by hand.
const PAGES = [
  "/",
  "/questionnaire",
  "/results",
  "/journey",
  "/compare",
  "/institutions",
  "/institutions/hakotel",
  "/community",
  "/assistant",
  "/saved",
  "/plan",
  "/login",
  "/about",
  "/privacy",
  "/accessibility",
  "/terms",
  "/credits",
];

for (const path of PAGES) {
  test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(summary).toEqual([]);
  });
}

test("accessibility menu: bigger text and stronger contrast, kept after reload, and its own panel passes axe", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "תפריט נגישות" }).click();
  const panel = page.getByRole("dialog", { name: "תפריט נגישות" });
  await expect(panel).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).include("#a11y-panel").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  await panel.getByRole("button", { name: "הגדלת טקסט" }).click();
  await panel.getByRole("button", { name: "ניגודיות גבוהה" }).click();
  await expect(panel.getByRole("button", { name: "ניגודיות גבוהה" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-text", "1");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-a11y-text", "1");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-contrast", "1");

  await page.getByRole("button", { name: "תפריט נגישות" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "תפריט נגישות" })).toHaveCount(0);
  await page.getByRole("button", { name: "תפריט נגישות" }).click();
  await page.getByRole("dialog", { name: "תפריט נגישות" }).getByRole("button", { name: "איפוס" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-a11y-text", /./);
});

test("legal pages show the operator's contact details", async ({ page }) => {
  for (const path of ["/accessibility", "/terms", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "aviya.nish@gmail.com" })).toBeVisible();
  }
});
