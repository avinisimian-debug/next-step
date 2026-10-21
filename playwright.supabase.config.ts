import { defineConfig, devices } from "@playwright/test";
import { APP_PORT, GATEWAY_PORT, JWT_SECRET, POSTGREST_PORT, DB_URL } from "./e2e-supabase/support/env.mjs";

/**
 * Database-backed end-to-end tests: real Postgres with the real migrations and RLS, a real
 * PostgREST, and a small stand-in for Supabase Auth. Requires a local Postgres (E2E_DATABASE_URL)
 * and a PostgREST binary (POSTGREST_BIN). Run after `npm run build`.
 */
const postgrest = process.env.POSTGREST_BIN ?? "postgrest";
const pgrstUri = DB_URL.replace("postgres@", "authenticator@");

export default defineConfig({
  testDir: "e2e-supabase",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${APP_PORT}`, locale: "he-IL", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e-supabase/support/setup-db.mjs && node e2e-supabase/support/gateway.mjs",
      url: `http://localhost:${GATEWAY_PORT}/`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: postgrest,
      url: `http://localhost:${POSTGREST_PORT}/`,
      reuseExistingServer: false,
      env: {
        PGRST_DB_URI: pgrstUri,
        PGRST_DB_SCHEMAS: "next_step",
        PGRST_DB_ANON_ROLE: "anon",
        PGRST_JWT_SECRET: JWT_SECRET,
        PGRST_SERVER_PORT: String(POSTGREST_PORT),
      },
    },
    {
      command: `npm run start -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        SUPABASE_URL: `http://localhost:${GATEWAY_PORT}`,
        SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
        CATALOG_SOURCE: "supabase",
        ANTHROPIC_API_KEY: "",
      },
    },
  ],
});
