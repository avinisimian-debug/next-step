import { expect, test, type Page } from "@playwright/test";
import pg from "pg";
import { signInAs, USERS } from "./support/auth";
import { DB_URL, GATEWAY_PORT } from "./support/env.mjs";

async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const db = new pg.Client({ connectionString: DB_URL });
  await db.connect();
  try {
    return (await db.query(text, params)).rows as T[];
  } finally {
    await db.end();
  }
}

async function ask(page: Page, title: string, body: string, institution?: string) {
  await page.goto(`/community/ask${institution ? `?institution=${institution}` : ""}`);
  await page.getByLabel("השאלה בקצרה").fill(title);
  await page.getByLabel("פרטים").fill(body);
  await page.getByRole("button", { name: "פרסום השאלה" }).click();
  await expect(page).toHaveURL(/\/community\/[0-9a-f-]{36}$/);
  return page.url().split("/").pop()!;
}

test.describe.configure({ mode: "serial" });

test("anonymous visitors can read but are sent to sign in for personal features", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1, name: "קהילה" })).toBeVisible();
  await expect(page.getByText("עדיין אין שאלות")).toBeVisible();
  for (const path of ["/my-path", "/account", "/community/ask", "/moderation"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
});

test("the catalog is served from the database with the same public records", async ({ page }) => {
  await page.goto("/institutions");
  await expect(page.getByRole("status")).toHaveText("נמצאו 22 מסגרות");
  expect((await page.request.get("/institutions/nachshon")).status()).toBe(404);
});

test("requesting a sign-in link calls Supabase Auth with a callback on this site", async ({ page }) => {
  await page.goto("/login?next=/saved");
  await page.getByLabel("כתובת מייל").fill("Someone@Example.test");
  await page.getByRole("button", { name: "שלחו לי קישור התחברות" }).click();
  await expect(page.getByText("בדקו את תיבת המייל")).toBeVisible();
  const sent = await (await page.request.get(`http://localhost:${GATEWAY_PORT}/__test/otp`)).json();
  const last = sent.at(-1);
  expect(last.email).toBe("someone@example.test");
  expect(last.redirect_to).toBe("http://localhost:3200/auth/callback?next=%2Fsaved");
  await page.goto("/login");
  await page.getByLabel("כתובת מייל").fill("not-an-email");
  await page.getByRole("button", { name: "שלחו לי קישור התחברות" }).click();
  await expect(page.getByText("כתובת המייל לא נראית תקינה.")).toBeVisible();
});

test("an invalid callback code is rejected without signing in", async ({ page }) => {
  await page.goto("/auth/callback?code=forged&next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?error=link&next=%2Faccount/);
  await expect(page.getByText("הקישור לא תקף")).toBeVisible();
});

test("a first sign-in creates a profile, and the display name can be changed", async ({ page, context }) => {
  await signInAs(context, "fresh");
  await page.goto("/account");
  await expect(page.getByLabel("השם שמוצג בקהילה")).toHaveValue("משתמש/ת");
  await expect(page.getByText(USERS.fresh.email)).toBeVisible();
  await page.getByLabel("השם שמוצג בקהילה").fill("   "); // passes the browser check, trimmed on the server
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("השם צריך להכיל לפחות 2 תווים.")).toBeVisible();
  await page.getByLabel("השם שמוצג בקהילה").fill("נועה (בדיקה)");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("השם עודכן.")).toBeVisible();
  const [row] = await sql<{ display_name: string; role: string }>("select display_name, role from next_step.profiles where id = $1", [USERS.fresh.id]);
  expect(row).toEqual({ display_name: "נועה (בדיקה)", role: "member" });
});

test("saved institutions persist in the account and stay private", async ({ page, context, browser }) => {
  await signInAs(context, "alice");
  await page.goto("/institutions/hakotel");
  await page.getByRole("button", { name: "שמירה: ישיבת הכותל" }).click();
  await expect(page.getByRole("button", { name: "הסרה מהשמורים: ישיבת הכותל" })).toContainText("נשמר בחשבון");
  await page.reload();
  await expect(page.getByRole("button", { name: "הסרה מהשמורים: ישיבת הכותל" })).toBeVisible();

  await page.goto("/saved");
  await expect(page.getByRole("heading", { level: 2, name: "ישיבת הכותל" })).toBeVisible();
  await page.getByLabel("הערה אישית (רק את/ה רואה אותה)").fill("לבדוק שבת פתוחה");
  await page.getByRole("button", { name: "שמירת הערה" }).click();
  await expect(page.getByText("ההערה נשמרה.")).toBeVisible();

  const bob = await browser.newContext();
  await signInAs(bob, "bob");
  const bobPage = await bob.newPage();
  await bobPage.goto("/saved");
  await expect(bobPage.getByText("עדיין לא שמרת מסגרות")).toBeVisible();
  await bob.close();

  const rows = await sql("select user_id, note from next_step.saved_institutions");
  expect(rows).toEqual([{ user_id: USERS.alice.id, note: "לבדוק שבת פתוחה" }]);
});

test("favorites saved on the device can be moved into the account", async ({ page, context }) => {
  await page.goto("/institutions/sderot");
  await page.getByRole("button", { name: "שמירה: ישיבת ההסדר שדרות" }).click();
  await expect(page.getByRole("button", { name: /הסרה מהשמורים/ })).toContainText("נשמר במכשיר");
  await signInAs(context, "bob");
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "שמורים במכשיר הזה" })).toBeVisible();
  await page.getByRole("button", { name: "העברה לחשבון" }).click();
  await expect(page.getByText("מסגרת אחת הועברה לחשבון.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "ישיבת ההסדר שדרות" })).toBeVisible();
});

test("the pathway map stores steps per user, with status and order", async ({ page, context }) => {
  await signInAs(context, "alice");
  await page.goto("/my-path");
  await expect(page.getByText("המפה עדיין ריקה")).toBeVisible();
  for (const title of ["לבקר בשבת פתוחה", "לדבר עם יועצת"]) {
    await page.getByLabel("מה הצעד?").fill(title);
    await page.getByRole("button", { name: "הוספת צעד" }).click();
    await expect(page.getByText("הצעד נוסף.")).toBeVisible();
    await expect(page.locator("li[data-step]").filter({ hasText: title })).toBeVisible();
  }
  await page.getByLabel("מצב הצעד: לבקר בשבת פתוחה").selectOption("done");
  await expect(page.getByText("בוצעו 1 מתוך 2 צעדים")).toBeVisible();
  await page.getByRole("button", { name: "להזיז למעלה: לדבר עם יועצת" }).click();
  await expect(page.locator("li[data-step]").first()).toContainText("לדבר עם יועצת");
  await page.reload();
  await expect(page.locator("li[data-step]").first()).toContainText("לדבר עם יועצת");
  await expect(page.getByText("בוצעו 1 מתוך 2 צעדים")).toBeVisible();
  const steps = await sql<{ user_id: string }>("select distinct user_id from next_step.pathway_steps");
  expect(steps).toEqual([{ user_id: USERS.alice.id }]);
});

test("community: ask, duplicate suggestion, answers with labels, helpful marks and notifications", async ({ page, context, browser }) => {
  await signInAs(context, "alice");
  const qid = await ask(page, "איך נראה סדר היום בישיבת הכותל?", "רציתי לדעת מה עושים מהבוקר עד הערב בשנה הראשונה.", "hesder-hakotel");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("איך נראה סדר היום בישיבת הכותל?");
  await expect(page.locator("main article").getByText(USERS.alice.name)).toBeVisible();

  // A similar question triggers a duplicate suggestion before posting.
  await page.goto("/community/ask");
  await page.getByLabel("השאלה בקצרה").fill("סדר היום בישיבת הכותל");
  await expect(page.getByText("אולי כבר שאלו את זה:")).toBeVisible();
  await expect(page.getByRole("link", { name: "איך נראה סדר היום בישיבת הכותל?" })).toBeVisible();

  // Bob answers from experience; no official option for him.
  const bob = await browser.newContext();
  await signInAs(bob, "bob");
  const bobPage = await bob.newPage();
  await bobPage.goto(`/community/${qid}`);
  await expect(bobPage.getByText(/לפרסם כתשובה רשמית/)).toHaveCount(0);
  await bobPage.getByLabel("התשובה שלך").fill("הייתי שם שנתיים. רוב היום בבית המדרש.");
  await bobPage.getByRole("button", { name: "פרסום תשובה" }).click();
  await expect(bobPage.getByText("התשובה פורסמה.")).toBeVisible();

  // The institution's representative can answer officially.
  const rep = await browser.newContext();
  await signInAs(rep, "rep");
  const repPage = await rep.newPage();
  await repPage.goto(`/community/${qid}`);
  await repPage.getByLabel("התשובה שלך").fill("סדר היום המלא מופיע באתר הישיבה.");
  await repPage.getByLabel(/לפרסם כתשובה רשמית בשם ישיבת הכותל/).check();
  await repPage.getByRole("button", { name: "פרסום תשובה" }).click();
  await expect(repPage.getByText("התשובה פורסמה.")).toBeVisible();

  await page.goto(`/community/${qid}`);
  const answers = page.locator("li[data-answer-kind]");
  await expect(answers).toHaveCount(2);
  await expect(answers.first()).toHaveAttribute("data-answer-kind", "official");
  await expect(answers.first().getByText("תשובה רשמית של המסגרת")).toBeVisible();
  await expect(answers.first().getByText("נציג/ה מאומת/ת של ישיבת הכותל")).toBeVisible();
  const bobAnswer = answers.filter({ hasText: "הייתי שם שנתיים" });
  await expect(bobAnswer.getByText("ניסיון אישי")).toBeVisible();
  await bobAnswer.getByRole("button", { name: /עזר לי/ }).click();
  await expect(bobAnswer.getByRole("button", { name: /עזר לי/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("li[data-answer-kind]").filter({ hasText: "הייתי שם שנתיים" }).getByRole("button", { name: /עזר לי/ })).toContainText("1");

  // Bob cannot mark his own answer.
  await bobPage.reload();
  await expect(bobPage.locator("li[data-answer-kind]").filter({ hasText: "הייתי שם שנתיים" }).getByRole("button", { name: /עזר לי/ })).toBeDisabled();

  await page.goto("/account");
  await expect(page.getByText("2 חדשות")).toBeVisible();
  await page.getByRole("button", { name: "סימון הכול כנקרא" }).click();
  await expect(page.getByText("2 חדשות")).toHaveCount(0);

  await page.goto("/community?q=" + encodeURIComponent("הכותל"));
  await expect(page.getByRole("link", { name: "איך נראה סדר היום בישיבת הכותל?" })).toBeVisible();
  await page.goto("/community?unanswered=1");
  await expect(page.getByText("לא נמצאו שאלות")).toBeVisible();
  await Promise.all([bob.close(), rep.close()]);
});

test("reports go to moderators, who can hide content; others cannot moderate", async ({ page, context, browser }) => {
  const bob = await browser.newContext();
  await signInAs(bob, "bob");
  const bobPage = await bob.newPage();
  const qid = await ask(bobPage, "שאלה שתדווח בבדיקה", "תוכן שמישהו ידווח עליו במסגרת הבדיקה.");

  await signInAs(context, "alice");
  await page.goto(`/community/${qid}`);
  await page.getByRole("button", { name: "דיווח" }).click();
  await page.getByLabel("ספאם או פרסום").check();
  await page.getByRole("button", { name: "שליחת דיווח" }).click();
  await expect(page.getByText("הדיווח התקבל")).toBeVisible();
  expect((await page.request.get("/moderation")).status()).toBe(404);
  await expect(page.getByRole("button", { name: "הסתרה" })).toHaveCount(0);

  const mod = await browser.newContext();
  await signInAs(mod, "mod");
  const modPage = await mod.newPage();
  await modPage.goto("/moderation");
  const item = modPage.locator("li").filter({ hasText: "שאלה שתדווח בבדיקה" });
  await expect(item.getByText("ספאם או פרסום")).toBeVisible();
  await item.getByRole("button", { name: "הסתרת התוכן וסגירה" }).click();
  await expect(modPage.getByText("אין דיווחים פתוחים")).toBeVisible();
  await expect(modPage.getByText("status:hidden")).toBeVisible();

  // Hidden for everyone else; the author still sees it, marked as hidden.
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  expect((await anonPage.goto(`/community/${qid}`))?.status()).toBe(404);
  await bobPage.goto(`/community/${qid}`);
  await expect(bobPage.getByText(/מוסתר — רק את\/ה/)).toBeVisible();
  await Promise.all([bob.close(), mod.close(), anon.close()]);
});

test("posting is rate-limited by the database and the limit is explained", async ({ page, context }) => {
  await sql(
    `insert into next_step.questions (author_id, title, body)
     select $1, 'שאלת מילוי ' || g, 'נוצרה בבדיקה כדי להגיע למגבלה' from generate_series(1, 5) g`,
    [USERS.mod.id],
  );
  await signInAs(context, "mod");
  await page.goto("/community/ask");
  await page.getByLabel("השאלה בקצרה").fill("שאלה שישית בתוך שעה");
  await page.getByLabel("פרטים").fill("הניסיון הזה צריך להיחסם.");
  await page.getByRole("button", { name: "פרסום השאלה" }).click();
  await expect(page.getByText("הגעת למגבלת הפרסום לשעה הקרובה")).toBeVisible();
  await expect(page.getByLabel("השאלה בקצרה")).toHaveValue("שאלה שישית בתוך שעה");
});

test("the assistant says clearly that it is unavailable without an AI key", async ({ page }) => {
  await page.goto("/assistant");
  await expect(page.getByText("העוזר לא זמין באתר הזה כרגע")).toBeVisible();
  const res = await page.request.post("/api/assistant", { data: { question: "מה זה הסדר?" } });
  expect(res.status()).toBe(503);
});
