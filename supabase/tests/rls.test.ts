import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

/**
 * Runs the migrations against a scratch Postgres database and checks the security rules
 * (RLS, grants, triggers) as anonymous and signed-in users.
 * Needs TEST_DATABASE_URL pointing at a database that can be dropped and recreated.
 */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

const dir = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(dir, p), "utf8");

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";
const MOD = "00000000-0000-4000-8000-00000000000c";
const REP = "00000000-0000-4000-8000-00000000000d";

let client: pg.Client;

/** Runs `fn` inside a transaction as the given user (null = anonymous), then rolls back. */
async function tx<T>(fn: (as: (user: string | null) => Promise<void>, q: typeof client.query) => Promise<T>) {
  await client.query("begin");
  const as = async (user: string | null) => {
    await client.query("reset role");
    await client.query(`set local role ${user ? "authenticated" : "anon"}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
  };
  try {
    return await fn(as, client.query.bind(client) as typeof client.query);
  } finally {
    await client.query("rollback");
  }
}

/** Expects the statement to fail, inside a savepoint so the surrounding transaction stays usable. */
async function fails(run: () => Promise<unknown>, match: RegExp) {
  await client.query("savepoint expect_failure");
  try {
    await expect(run()).rejects.toThrow(match);
  } finally {
    await client.query("rollback to savepoint expect_failure");
  }
}

suite("database security rules", () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString: url });
    await client.connect();
    await client.query("drop schema if exists next_step cascade");
    await client.query(read("tests/supabase-stub.sql"));
    for (const f of ["migrations/20261021210000_next_step_core.sql", "migrations/20261021213000_next_step_fk_indexes.sql", "migrations/20261021220000_next_step_touch_steps.sql"]) await client.query(read(f));
    await client.query(
      `insert into auth.users (id) values ($1), ($2), ($3), ($4) on conflict do nothing`,
      [ALICE, BOB, MOD, REP],
    );
    await client.query(`
      insert into next_step.institutions (id, slug, pathway, published, verification_status, last_verified, data) values
        ('inst-a', 'inst-a', 'mechina', true, 'verified', '2026-10-21', '{}'),
        ('inst-hidden', 'inst-hidden', 'mechina', false, 'unverified', '2026-10-21', '{}')`);
    await client.query(`
      insert into next_step.profiles (id, display_name, role, represented_institution_id) values
        ('${ALICE}', 'Alice', 'member', null), ('${BOB}', 'Bob', 'member', null),
        ('${MOD}', 'Mod', 'moderator', null), ('${REP}', 'Rep', 'representative', 'inst-a')`);
  });

  afterAll(async () => {
    await client?.end();
  });

  it("hides unpublished and unverified institutions from the public", async () => {
    await tx(async (as, q) => {
      await as(null);
      const { rows } = await q("select id from next_step.institutions order by id");
      expect(rows.map((r) => r.id)).toEqual(["inst-a"]);
    });
  });

  it("does not let anyone but admins write institutions", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      await fails(
() => q(`insert into next_step.institutions (id, slug, pathway, published, verification_status, last_verified, data)
           values ('x', 'x', 'idf', true, 'verified', '2026-10-21', '{}')`),
        /row-level security/,
      );
    });
  });

  it("creates a profile only for the signed-in user and never lets them pick a role", async () => {
    await tx(async (as, q) => {
      await q("delete from next_step.profiles where id = $1", [BOB]);
      await as(BOB);
      const { rows } = await q("select * from next_step.ensure_profile('  Bobby  ')");
      expect(rows[0]).toMatchObject({ id: BOB, display_name: "Bobby", role: "member" });
      await fails(() => q("update next_step.profiles set role = 'admin' where id = $1", [BOB]), /permission denied/);
      await as(null);
      await fails(() => q("select next_step.ensure_profile('x')"), /permission denied/);
    });
  });

  it("keeps saved institutions and pathway steps private to their owner", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      await q("insert into next_step.saved_institutions (institution_id) values ('inst-a')");
      await q("insert into next_step.pathway_steps (title) values ('לבקר במכינה')");
      await as(BOB);
      expect((await q("select * from next_step.saved_institutions")).rowCount).toBe(0);
      expect((await q("select * from next_step.pathway_steps")).rowCount).toBe(0);
      expect((await q("update next_step.pathway_steps set status = 'done'")).rowCount).toBe(0);
      await fails(
() => q("insert into next_step.saved_institutions (user_id, institution_id) values ($1, 'inst-a')", [ALICE]),
        /permission denied/,
      );
      await as(ALICE);
      expect((await q("select * from next_step.saved_institutions")).rowCount).toBe(1);
    });
  });

  it("maintains step timestamps itself and does not let users write them", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      const { rows: [step] } = await q("insert into next_step.pathway_steps (title) values ('צעד') returning id, updated_at");
      await fails(() => q("update next_step.pathway_steps set updated_at = now() - interval '1 day'"), /permission denied/);
      await q("select pg_sleep(0.01)");
      const { rows: [after] } = await q("update next_step.pathway_steps set status = 'done' where id = $1 returning updated_at", [step.id]);
      expect(after.updated_at.getTime()).toBeGreaterThanOrEqual(step.updated_at.getTime());
    });
  });

  it("runs the full community loop: ask, answer, notify, mark helpful", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      const { rows: [question] } = await q(
        "insert into next_step.questions (institution_id, title, body) values ('inst-a', 'איך נראה יום במכינה?', 'מעניין אותי מה עושים מהבוקר עד הערב.') returning id",
      );
      await as(BOB);
      const { rows: [answer] } = await q(
        "insert into next_step.answers (question_id, body) values ($1, 'הייתי שם בשנה שעברה, הרבה שיחות וטיולים.') returning id",
        [question.id],
      );
      await as(ALICE);
      const notes = await q("select kind, question_id, answer_id from next_step.notifications");
      expect(notes.rows).toEqual([{ kind: "new_answer", question_id: question.id, answer_id: answer.id }]);
      await q("insert into next_step.answer_votes (answer_id) values ($1)", [answer.id]);
      const { rows: [a] } = await q("select helpful_count from next_step.answers where id = $1", [answer.id]);
      expect(a.helpful_count).toBe(1);
      const { rows: [qq] } = await q("select answer_count from next_step.questions where id = $1", [question.id]);
      expect(qq.answer_count).toBe(1);
      await as(BOB);
      expect((await q("select * from next_step.notifications")).rowCount).toBe(0);
      await fails(() => q("insert into next_step.answer_votes (answer_id) values ($1)", [answer.id]), /row-level security/);
    });
  });

  it("does not let users post as someone else or mark content as test data", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      await fails(
() => q("insert into next_step.questions (author_id, title, body) values ($1, 'שאלה בשם מישהו אחר', 'גוף השאלה כאן')", [BOB]),
        /permission denied/,
      );
      await fails(
() => q("insert into next_step.questions (is_test, title, body) values (true, 'שאלה לבדיקה בלבד', 'גוף השאלה כאן')"),
        /permission denied/,
      );
    });
  });

  it("allows official answers only from the institution's verified representative", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      const { rows: [question] } = await q(
        "insert into next_step.questions (institution_id, title, body) values ('inst-a', 'מתי נפתח ההרשמה?', 'רציתי לדעת מתי אפשר להירשם.') returning id",
      );
      await as(BOB);
      await fails(
() => q("insert into next_step.answers (question_id, body, kind) values ($1, 'רשמי לכאורה', 'official')", [question.id]),
        /row-level security/,
      );
      await as(REP);
      await q("insert into next_step.answers (question_id, body, kind) values ($1, 'ההרשמה דרך האתר שלנו', 'official')", [question.id]);
    });
  });

  it("lets only moderators hide content, and hidden content disappears for others", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      const { rows: [question] } = await q(
        "insert into next_step.questions (title, body) values ('שאלה שתוסתר בהמשך', 'תוכן שלא מתאים לקהילה') returning id",
      );
      await as(BOB);
      await q("insert into next_step.reports (target_type, target_id, reason) values ('question', $1, 'spam')", [question.id]);
      expect((await q("update next_step.questions set status = 'hidden' where id = $1", [question.id])).rowCount).toBe(0);
      await as(ALICE);
      await fails(() => q("update next_step.questions set status = 'hidden' where id = $1", [question.id]), /NS_FORBIDDEN/);
      await as(MOD);
      const reports = await q("select id from next_step.reports where status = 'open'");
      expect(reports.rowCount).toBe(1);
      await q("update next_step.questions set status = 'hidden' where id = $1", [question.id]);
      await q("update next_step.reports set status = 'resolved' where id = $1", [reports.rows[0].id]);
      const log = await q("select action from next_step.moderation_log order by id");
      expect(log.rows.map((r) => r.action)).toEqual(["status:hidden", "report:resolved"]);
      await as(BOB);
      expect((await q("select * from next_step.questions where id = $1", [question.id])).rowCount).toBe(0);
      expect((await q("select reporter_id from next_step.reports")).rows).toEqual([{ reporter_id: BOB }]);
      await as(ALICE);
      expect((await q("select * from next_step.reports")).rowCount).toBe(0);
      expect((await q("select status from next_step.questions where id = $1", [question.id])).rows[0].status).toBe("hidden");
    });
  });

  it("rate-limits new questions per user", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      for (let i = 0; i < 5; i++)
        await q("insert into next_step.questions (title, body) values ($1, 'גוף שאלה מספיק ארוך')", [`שאלה מספר ${i + 1} לבדיקה`]);
      await fails(() => q("insert into next_step.questions (title, body) values ('שאלה שישית לבדיקה', 'גוף שאלה מספיק ארוך')"), /NS_RATE_LIMIT/);
    });
  });

  it("finds similar questions for duplicate suggestions", async () => {
    await tx(async (as, q) => {
      await as(ALICE);
      await q("insert into next_step.questions (title, body) values ('איך מתקבלים למכינת עין פרת?', 'מה תהליך המיון ומתי הוא מתחיל')");
      await as(null);
      const { rows } = await q("select title from next_step.search_questions('מכינת עין פרת')");
      expect(rows.map((r) => r.title)).toContain("איך מתקבלים למכינת עין פרת?");
    });
  });

  it("keeps the registry workflow admin-only", async () => {
    await tx(async (as, q) => {
      await as(MOD);
      expect((await q("select * from next_step.registry_entries")).rowCount).toBe(0);
      await fails(
() => q(`insert into next_step.registry_entries (registry, category, external_name, normalized_name, source_url, retrieved_on)
           values ('x', 'mechina', 'y', 'y', 'https://example.org', '2026-10-21')`),
        /row-level security/,
      );
    });
  });
});
