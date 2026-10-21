import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/** Refreshes the visitor's auth session cookies on each request. No-op when Supabase is not configured. */
export async function refreshSession(req: NextRequest): Promise<NextResponse> {
  let res = NextResponse.next({ request: req });
  const config = getSupabaseConfig();
  if (!config) return res;
  // Skip the network round-trip for visitors who never signed in.
  if (!req.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return res;

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return res;
}
