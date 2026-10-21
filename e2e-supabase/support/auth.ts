import { createHmac } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { APP_PORT, JWT_SECRET, USERS } from "./env.mjs";

const b64 = (v: unknown) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

export function jwtFor(user: { id: string; email: string }) {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = b64({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp });
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return { token: `${header}.${payload}.${sig}`, exp };
}

/** Signs the browser in as a test user by writing the same session cookie @supabase/ssr writes. */
export async function signInAs(context: BrowserContext, who: keyof typeof USERS) {
  const user = USERS[who];
  const { token, exp } = jwtFor(user);
  const session = {
    access_token: token,
    refresh_token: "test-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: exp,
    user: { id: user.id, aud: "authenticated", role: "authenticated", email: user.email, app_metadata: {}, user_metadata: {}, created_at: "2026-10-21T00:00:00Z" },
  };
  await context.addCookies([
    { name: "sb-localhost-auth-token", value: `base64-${b64(session)}`, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
}

export { USERS };
