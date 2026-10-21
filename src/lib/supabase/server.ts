import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DB_SCHEMA, getSupabaseConfig } from "./config";

/**
 * A Supabase client bound to the visitor's session cookies. Every query runs as that
 * visitor (or as anonymous), so row-level security decides what they can read and write.
 * Returns null when Supabase is not configured.
 */
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    db: { schema: DB_SCHEMA },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware refreshes the session.
        }
      },
    },
  });
}

export type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
