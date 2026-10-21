// Shared settings for the database-backed end-to-end tests. Test-only values; nothing here is a real secret.
export const DB_URL = process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost/ns_e2e?host=/var/tmp/nspg&port=5433";
export const JWT_SECRET = "e2e-only-jwt-secret-not-used-anywhere-else-0123456789";
export const GATEWAY_PORT = 54330;
export const POSTGREST_PORT = 54331;
export const APP_PORT = 3200;

export const USERS = {
  alice: { id: "00000000-0000-4000-8000-0000000000a1", email: "alice@example.test", name: "אליס (בדיקה)", role: "member" },
  bob: { id: "00000000-0000-4000-8000-0000000000b2", email: "bob@example.test", name: "בוב (בדיקה)", role: "member" },
  mod: { id: "00000000-0000-4000-8000-0000000000c3", email: "mod@example.test", name: "מנהלת (בדיקה)", role: "moderator" },
  rep: { id: "00000000-0000-4000-8000-0000000000d4", email: "rep@example.test", name: "נציג הכותל (בדיקה)", role: "representative", institution: "hesder-hakotel" },
  admin: { id: "00000000-0000-4000-8000-0000000000f6", email: "admin@example.test", name: "מנהל מערכת (בדיקה)", role: "admin" },
  fresh: { id: "00000000-0000-4000-8000-0000000000e5", email: "fresh@example.test" },
};
