import { expect, test, type Page } from "@playwright/test";

/** Answers keyed by question heading → option labels to pick. Unlisted questions are skipped or get the first option. */
const HESDER_PROFILE: Record<string, string[]> = {
  "איפה אתה נמצא היום?": ["כיתה י״ב"],
  "לאילו מסגרות לחפש?": ["מסגרות לבנים"],
  "אילו כיוונים אתה שוקל כרגע?": ["ישיבת הסדר"],
  "בישיבת הסדר — איזה איזון בין לימוד לשירות מתאים לך?": ["יותר זמן לימוד"],
  "כמה חשוב לך לימוד תורה קבוע במסגרת הבאה?": ["חלק מרכזי בסדר היום שלי"],
  "איזו סביבה לימודית מושכת אותך יותר?": ["לימוד תורה בשילוב שירות צבאי"],
  "איך אתה מרגיש כרגע לגבי שירות צבאי?": ["רוצה לשרת ולהמשיך ללמוד תורה"],
  "מה הכי היית רוצה לפתח בשנה הקרובה?": ["ידע תורני וצמיחה רוחנית"],
  "באיזו סביבה אתה במיטבך?": ["ליווי אישי קרוב"],
  "איך אתה הכי אוהב ללמוד?": ["לימוד מעמיק ואינטנסיבי"],
  "מה הכי חשוב לך כשאתה בוחר מקום?": ["איכות לימוד התורה"],
};

async function heading(page: Page) {
  return (await page.getByRole("heading", { level: 1 }).innerText()).trim();
}

async function answerAll(page: Page, profile: Record<string, string[]>) {
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    const h = await heading(page);
    if (h === "זה מה שסיפרת לנו") return seen;
    seen.push(h);
    const picks = profile[h];
    if (picks) {
      for (const label of picks) await page.locator("label").filter({ hasText: label }).first().click();
    } else if (await page.getByRole("button", { name: "דלג" }).isVisible()) {
      await page.getByRole("button", { name: "דלג" }).click();
      continue;
    } else {
      await page.locator("form label").first().click();
    }
    await page.getByRole("button", { name: /המשך|לסיכום|חזרה לסיכום/ }).click();
  }
  throw new Error("Questionnaire did not reach the summary");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("homepage is Hebrew, RTL and leads into the questionnaire", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("הצעד הבא שלך");
  for (const name of ["צה״ל", "מכינה קדם־צבאית", "ישיבת הסדר", "ישיבה גבוהה"]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await page.getByRole("link", { name: "בוא נמצא את המסלול שלך" }).click();
  await expect(page).toHaveURL(/\/questionnaire/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("איפה אתה נמצא היום?");
});

test("full journey: conditional questions, summary, results, profile and compare", async ({ page }) => {
  await page.goto("/questionnaire");
  const seen = await answerAll(page, HESDER_PROFILE);

  // Conditional follow-up appeared only for the chosen pathway.
  expect(seen).toContain("בישיבת הסדר — איזה איזון בין לימוד לשירות מתאים לך?");
  expect(seen).not.toContain("במכינה — על מה הכי חשוב לך שיהיה דגש?");
  expect(seen.length).toBeGreaterThanOrEqual(12);

  // Summary lets you edit an answer and come back.
  await page.getByRole("button", { name: "שינוי התשובה: איפה אתה נמצא היום?" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("איפה אתה נמצא היום?");
  await page.locator("label").filter({ hasText: "סיימתי תיכון" }).click();
  await page.getByRole("button", { name: "חזרה לסיכום" }).click();
  await expect(page.getByText("סיימתי תיכון")).toBeVisible();

  await page.getByRole("button", { name: "לקבלת ההמלצות שלי" }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("מצאנו את שלושת הכיוונים שכדאי לך להכיר.");

  // Pathway-level view comes before specific institutions, with all four pathways.
  const overview = page.locator("section[aria-labelledby='h-pathways']");
  await expect(overview.getByRole("heading", { name: "איך כל מסלול מתאים לך" })).toBeVisible();
  await expect(overview.locator("li[data-pathway]")).toHaveCount(4);
  await expect(overview.locator("li[data-pathway]").first()).toHaveAttribute("data-pathway", "hesder");

  const cards = page.locator("article");
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).getByText(/^ישיבת (הסדר|שילוב)$/)).toBeVisible();
    await expect(cards.nth(i).getByText("ציון התאמה להעדפות שציינת", { exact: true })).toBeVisible();
    await expect(cards.nth(i).getByText("למה זה מתאים לך")).toBeVisible();
  }

  // No AI key configured: the consent panel must not appear.
  await expect(page.getByText("סיכום אישי בניסוח חופשי")).toHaveCount(0);

  // Details panel
  await cards.first().getByRole("button", { name: /פירוט ההתאמה/ }).click();
  await expect(cards.first().getByText("איך חושב הציון")).toBeVisible();

  // Profile page
  await cards.first().getByRole("link", { name: "לפרטים מלאים" }).click();
  await expect(page).toHaveURL(/\/institutions\//);
  await expect(page.getByRole("heading", { name: "ההתאמה האישית שלך" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "מקורות ואימות" })).toBeVisible();
  await page.goBack();

  // Compare
  await page.getByRole("button", { name: "השוואה בין הכיוונים" }).click();
  await expect(page).toHaveURL(/\/compare/);
  await expect(page.getByText("ההשוואה משקפת את המידע המאומת")).toBeVisible();
  const visibleTitles = page.locator("a[id^='d-'], a[id^='m-']").filter({ visible: true });
  await expect(visibleTitles).toHaveCount(3);

  // Action plan: one section per recommendation; check-offs persist across reloads.
  await page.getByRole("link", { name: "לתוכנית הפעולה שלי" }).click();
  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("תוכנית הפעולה שלי");
  await expect(page.locator("section[aria-labelledby^='plan-']")).toHaveCount(4);
  const first = page.locator("li[data-step='talk-home'] input[type=checkbox]");
  await first.check();
  await expect(page.getByText(/הושלמו 1 מתוך/)).toBeVisible();
  await page.reload();
  await expect(page.locator("li[data-step='talk-home'] input[type=checkbox]")).toBeChecked();
  const stored = await page.evaluate(() => localStorage.getItem("nextstep.plan.v1"));
  expect(JSON.parse(stored ?? "[]")).toContain("talk-home");
});

test("action plan without answers shows an empty state", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("תוכנית הפעולה נבנית מההמלצות שלך");
  await expect(page.getByRole("link", { name: "למעבר לשאלון" })).toBeVisible();
});

test("back navigation keeps answers, and progress survives a reload", async ({ page }) => {
  await page.goto("/questionnaire");
  await page.locator("label").filter({ hasText: "כיתה י״א" }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("לאילו מסגרות לחפש?");
  await page.getByRole("button", { name: "הקודם" }).click();
  await expect(page.getByRole("radio", { name: "כיתה י״א" })).toBeChecked();
  await page.getByRole("button", { name: "המשך" }).click();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ברוך שובך");
  await page.getByRole("button", { name: "להמשיך מאיפה שעצרתי" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("לאילו מסגרות לחפש?");

  await page.reload();
  await page.getByRole("button", { name: "להתחיל מחדש" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("איפה אתה נמצא היום?");
  await expect(page.getByRole("radio", { name: "כיתה י״א" })).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("nextstep.answers.v1"))).toBeNull();
});

test("required questions block continuing; multi-select respects its limit", async ({ page }) => {
  await page.goto("/questionnaire");
  await expect(page.getByRole("button", { name: "המשך" })).toBeDisabled();
  await page.locator("label").filter({ hasText: "כיתה י״ב" }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await page.getByRole("button", { name: "דלג" }).click();
  // paths: choose idf, then "not sure" is exclusive
  await page.locator("label").filter({ hasText: "שירות צבאי" }).click();
  await page.locator("label").filter({ hasText: "עוד לא יודע" }).click();
  await expect(page.getByRole("checkbox", { name: "שירות צבאי" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "עוד לא יודע" })).toBeChecked();
  await page.getByRole("button", { name: "המשך" }).click();
  // undecided users get the neutral comparison question
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("דמיין את השנה הבאה. מה הכי מושך אותך?");
});

test("keyboard-only use of a question", async ({ page }) => {
  await page.goto("/questionnaire");
  await page.getByRole("radio", { name: "כיתה י״ב" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "כיתה י״ב" })).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("לאילו מסגרות לחפש?");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("results page without answers shows an empty state", async ({ page }) => {
  await page.goto("/results");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("עוד אין לנו מספיק כדי להמליץ");
});

test("AI endpoint reports unavailable without an API key", async ({ request }) => {
  const res = await request.get("/api/explain");
  expect(await res.json()).toEqual({ available: false });
  const post = await request.post("/api/explain", { data: { consent: true, ids: ["idf-tech"], answers: {} } });
  expect(post.status()).toBe(503);
});

test("admin area is not exposed when no admin credentials are configured", async ({ request }) => {
  expect((await request.get("/admin")).status()).toBe(404);
});

test("search finds institutions by text and filters, keeps state in the URL, and shows an empty state", async ({ page }) => {
  await page.goto("/institutions");
  await page.getByLabel("חיפוש לפי שם, מקום או תיאור").fill("הכותל");
  await page.getByRole("button", { name: "חיפוש" }).click();
  await expect(page).toHaveURL(/q=/);
  // Name matches rank first; Birkat Moshe also matches because its founders came from HaKotel.
  await expect(page.locator("main ul li h2").first()).toHaveText("ישיבת הכותל");

  await page.goto("/institutions?pathway=hesder&region=south");
  await expect(page.getByLabel("מסלול", { exact: true })).toHaveValue("hesder");
  const cards = page.locator("main ul li h2");
  // two separate hesder yeshivot in Sderot are listed by the hesder association
  await expect(cards.filter({ hasText: "ישיבת ההסדר שדרות" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "לב לדעת" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "הכותל" })).toHaveCount(0);

  await page.goto("/institutions?q=" + encodeURIComponent("אין כזה מקום בכלל"));
  await expect(page.getByRole("status")).toHaveText("לא נמצאו מסגרות");
  await page.getByRole("link", { name: "להצגת כל המסגרות" }).click();
  await expect(page).toHaveURL(/\/institutions$/);
});

test("search ignores invalid filter values", async ({ page }) => {
  const res = await page.goto("/institutions?pathway=army&region=mars");
  expect(res?.status()).toBe(200);
  await expect(page.getByLabel("מסלול", { exact: true })).toHaveValue("");
});

test("account features say they are unavailable instead of pretending to work when no database is configured", async ({ page }) => {
  for (const path of ["/community", "/my-path", "/account", "/login", "/community/ask"]) {
    await page.goto(path);
    await expect(page.getByText(/עדיין לא זמין באתר הזה/)).toBeVisible();
  }
  // Saving still works on the device, and says so.
  await page.goto("/institutions/hakotel");
  await page.getByRole("button", { name: "שמירה: ישיבת הכותל" }).click();
  await expect(page.getByRole("button", { name: /הסרה מהשמורים/ })).toContainText("נשמר במכשיר");
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "שמורים במכשיר הזה" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ישיבת הכותל" })).toBeVisible();
  // No sign-in link when sign-in is not possible.
  await expect(page.getByRole("link", { name: "התחברות" })).toHaveCount(0);
});

test("the assistant is clearly unavailable without an AI key", async ({ page, request }) => {
  await page.goto("/assistant");
  await expect(page.getByText("העוזר לא זמין באתר הזה כרגע")).toBeVisible();
  expect((await request.post("/api/assistant", { data: { question: "מה זה הסדר?" } })).status()).toBe(503);
});

test("unknown or unpublished records are not reachable", async ({ request }) => {
  // The seed catalog has no draft records right now; unit tests cover the published/verified filter.
  expect((await request.get("/institutions/no-such-record")).status()).toBe(404);
});

test("external official links are labelled and open safely", async ({ page }) => {
  await page.goto("/institutions/har-etzion");
  const link = page.getByRole("link", { name: /לאתר הרשמי/ }).first();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).toContainText("etzion.org.il");
  // partially verified record shows no website link
  await page.goto("/institutions/yeruham");
  await expect(page.getByRole("link", { name: /לאתר הרשמי/ })).toHaveCount(0);
  await expect(page.getByText("האתר הרשמי טרם אומת").first()).toBeVisible();
});

for (const path of ["/", "/questionnaire", "/institutions", "/institutions/hakotel", "/about", "/privacy", "/compare", "/plan", "/community", "/assistant", "/saved", "/login", "/journey"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("journey: save a place, move it through stages, and the route follows", async ({ page }) => {
  await page.goto("/journey");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("מהשאלון ועד השיבוץ");
  await expect(page.getByText("הרשימה עוד ריקה")).toBeVisible();
  // the first stop is the current one for a new visitor
  await expect(page.locator('[aria-current="step"]').first()).toContainText("מכירים את עצמך");

  // save a real institution from its page, then find it on the journey
  await page.goto("/institutions/hakotel");
  await page.getByRole("button", { name: /^שמירה:/ }).first().click();
  await page.goto("/journey");
  const card = page.locator('[data-place="hesder-hakotel"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "מתעניין" })).toHaveAttribute("aria-pressed", "true");

  await card.getByRole("button", { name: "הגשתי מועמדות" }).click();
  await expect(card.getByRole("button", { name: "הגשתי מועמדות" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("מקום אחד בתהליך").filter({ visible: true })).toBeVisible();

  // survives a reload (stored on this device)
  await page.reload();
  await expect(page.locator('[data-place="hesder-hakotel"]').getByRole("button", { name: "הגשתי מועמדות" })).toHaveAttribute("aria-pressed", "true");

  await page.locator('[data-place="hesder-hakotel"]').getByRole("button", { name: "זו הבחירה שלי" }).click();
  await expect(page.getByText("נבחר מקום").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /התקדמות במסע/ })).toBeVisible();

  // drop it: it leaves the active list but can be brought back
  await page.locator('[data-place="hesder-hakotel"]').getByRole("button", { name: "לא ממשיך עם המקום הזה" }).click();
  await expect(page.locator('[data-place="hesder-hakotel"]')).toHaveCount(0);
  await page.getByText(/מקומות שהחלטתי לא להמשיך/).click();
  await page.getByRole("button", { name: "להחזיר לרשימה" }).click();
  await expect(page.locator('[data-place="hesder-hakotel"]')).toBeVisible();
});

test("home shows the journey route and a way back for returning visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "מהשאלון ועד השיבוץ, צעד אחרי צעד" })).toBeVisible();
  await page.evaluate(() => localStorage.setItem("nextstep.favorites.v1", JSON.stringify(["hesder-hakotel"])));
  await page.reload();
  await expect(page.getByRole("heading", { name: "ממשיכים מאיפה שעצרת" })).toBeVisible();
  await expect(page.getByRole("link", { name: /להמשיך במסע שלי/ })).toBeVisible();
});
