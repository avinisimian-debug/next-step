import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA checks (the level Israeli Standard 5568 points to). They catch a large share of
// problems, not all of them, so the tests below also walk every page with the keyboard and check the page structure.
const PAGES = [
  "/",
  "/questionnaire",
  "/results",
  "/journey",
  "/compare",
  "/institutions",
  "/institutions/hakotel",
  "/maslul/mechinot",
  "/maslul/tzahal",
  "/community",
  "/community/ask",
  "/assistant",
  "/saved",
  "/plan",
  "/my-path",
  "/account",
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

  test(`structure and keyboard walk on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const structure = await page.evaluate(() => {
      const problems: string[] = [];
      const html = document.documentElement;
      if (html.lang !== "he" || html.dir !== "rtl") problems.push(`lang=${html.lang} dir=${html.dir}`);
      for (const tag of ["header", "nav", "main", "footer"]) if (!document.querySelector(tag)) problems.push(`no <${tag}>`);
      const shown = (el: Element) => getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
      const levels = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(shown).map((h) => Number(h.tagName[1]));
      if (levels.filter((l) => l === 1).length !== 1) problems.push(`${levels.filter((l) => l === 1).length} h1 elements`);
      if (levels[0] !== 1) problems.push(`first heading is h${levels[0]}`);
      levels.forEach((l, i) => i && l > levels[i - 1] + 1 && problems.push(`h${levels[i - 1]} followed by h${l}`));
      return problems;
    });
    expect(structure).toEqual([]);

    // From the top of the page, the first Tab reaches the skip link.
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
      document.body.removeAttribute("tabindex");
    });
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText("דילוג לתוכן הראשי");

    // Tab through every control on the page: each one shows a visible focus ring, and focus never gets stuck.
    let visited = 0;
    const unringed: string[] = [];
    for (let i = 0; i < 250; i++) {
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // A visually hidden radio or checkbox shows its focus on the label around it.
        const shown = el.matches(".sr-only") ? el.closest("label") : el;
        const s = getComputedStyle(shown ?? el);
        const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== "none";
        // Mark each control on its first visit; reaching a marked one again means the walk went full circle.
        const again = el.dataset.walked === "1";
        el.dataset.walked = "1";
        return { again, ring, label: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) };
      });
      if (!info) break;
      if (info.again) break;
      visited++;
      if (!info.ring) unringed.push(info.label);
      await page.keyboard.press("Tab");
    }
    expect(visited).toBeGreaterThan(3);
    expect(unringed).toEqual([]);
  });
}

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/about");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement))).toBe(true);
});

test("accessibility menu traps focus while open, and Esc returns focus to its button", async ({ page }) => {
  await page.goto("/about");
  const trigger = page.getByRole("button", { name: "תפריט נגישות" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "תפריט נגישות" });
  await expect(panel).toHaveAttribute("aria-modal", "true");
  const inside = () => page.evaluate(() => document.getElementById("a11y-panel")?.contains(document.activeElement));
  expect(await inside()).toBe(true);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await inside()).toBe(true);
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await inside()).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile menu closes with Esc and returns focus to its button", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button only shows on small screens");
  await page.goto("/about");
  const toggle = page.getByRole("button", { name: "פתיחת תפריט" });
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "פתיחת תפריט" })).toBeFocused();
});

test("save and compare buttons name the institution, and the change is announced", async ({ page }) => {
  await page.goto("/institutions/hakotel");
  await page.getByRole("button", { name: "שמירה: ישיבת הכותל" }).click();
  await expect(page.getByText("ישיבת הכותל נשמר במכשיר")).toBeAttached();
  expect(await page.getByText("ישיבת הכותל נשמר במכשיר").evaluate((el) => el.closest("[aria-live]") !== null)).toBe(true);

  await page.getByRole("button", { name: "השוואה, הוספה להשוואה: ישיבת הכותל" }).click();
  await expect(page.getByRole("button", { name: "בהשוואה, הסרה מההשוואה: ישיבת הכותל" })).toBeVisible();
  expect(await page.getByText("ישיבת הכותל נוסף להשוואה (1 מתוך 3)").evaluate((el) => el.closest("[aria-live]") !== null)).toBe(true);
});

test("animations stop when the system asks for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/journey");
  const bob = page.locator(".animate-bob").first();
  const animation = await bob.evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.animationName} ${s.animationDuration}`;
  });
  expect(animation).toMatch(/^none |1e-05s$|0\.00001s$/);
});

test("removing a place keeps focus in the list and announces it", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("nextstep.favorites.v1", JSON.stringify(["hesder-hakotel", "hesder-birkat-moshe"])));
  await page.goto("/journey");
  const first = page.locator("[data-place]").first();
  const firstName = await first.locator("h3").innerText();
  await first.getByRole("button", { name: /^הסרה מהרשימה/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: `${firstName} הוסר מהרשימה` })).toBeAttached();
  const focused = await page.evaluate(() => document.activeElement?.closest("[data-place]")?.querySelector("h3")?.textContent);
  expect(focused).toBeTruthy();
  expect(focused).not.toBe(firstName);

  // The last card: focus goes to the list heading.
  await page.locator("[data-place]").first().getByRole("button", { name: /^הסרה מהרשימה/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#h-places")).toBeFocused();
});

test("changing a place's stage is announced with the next step", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("nextstep.favorites.v1", JSON.stringify(["hesder-hakotel"])));
  await page.goto("/journey");
  const card = page.locator('[data-place="hesder-hakotel"]');
  await card.getByRole("button", { name: "הגשתי מועמדות" }).click();
  await expect(page.getByRole("status").filter({ hasText: /^ישיבת הכותל: הגשתי מועמדות/ })).toBeAttached();
});

test("removing an institution from the comparison keeps focus on the page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("nextstep.compare.v1", JSON.stringify(["hesder-hakotel", "hesder-birkat-moshe"])));
  await page.goto("/compare");
  await page.getByRole("button", { name: "הסרה מההשוואה: ישיבת הכותל" }).filter({ visible: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "ישיבת הכותל הוסרה מההשוואה" })).toBeAttached();
  expect(await page.evaluate(() => document.activeElement?.id)).toMatch(/^(d|m)-hesder-birkat-moshe$/);
  await page.getByRole("button", { name: /^הסרה מההשוואה/ }).filter({ visible: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("questionnaire summary passes axe, including its description list", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("nextstep.answers.v1", JSON.stringify({ stage: "grade12" }));
    localStorage.setItem("nextstep.progress.v1", JSON.stringify({ index: 0, phase: "summary" }));
  });
  await page.goto("/questionnaire");
  await page.getByRole("button", { name: "להמשיך מאיפה שעצרתי" }).click({ timeout: 5000 }).catch(() => {});
  await expect(page.locator("main dl")).toBeVisible();
  await page.waitForTimeout(800);
  const { violations } = await new AxeBuilder({ page }).include("main dl").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
