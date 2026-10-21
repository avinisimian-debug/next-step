// Recreates the test database: Supabase stand-ins, the real migrations, the catalog seed and test users.
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { DB_URL, USERS } from "./env.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const read = (p) => readFileSync(path.join(root, p), "utf8");

const admin = new pg.Client({ connectionString: DB_URL.replace("/ns_e2e", "/postgres") });
await admin.connect();
await admin.query("drop database if exists ns_e2e with (force)");
await admin.query("create database ns_e2e");
await admin.end();

const db = new pg.Client({ connectionString: DB_URL });
await db.connect();
await db.query(read("supabase/tests/supabase-stub.sql"));
await db.query(`do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $$; grant anon, authenticated to authenticator;`);
for (const f of ["20261021210000_next_step_core.sql", "20261021213000_next_step_fk_indexes.sql", "20261021220000_next_step_touch_steps.sql"]) await db.query(read(`supabase/migrations/${f}`));
await db.query(read("supabase/seed.sql"));

for (const u of Object.values(USERS)) await db.query("insert into auth.users (id, email) values ($1, $2)", [u.id, u.email]);
for (const u of Object.values(USERS)) {
  if (!u.name) continue; // "fresh" signs in for the first time during the tests
  await db.query("insert into next_step.profiles (id, display_name, role, represented_institution_id) values ($1, $2, $3, $4)", [
    u.id,
    u.name,
    u.role,
    u.institution ?? null,
  ]);
}
await db.end();
console.log("e2e database ready");
