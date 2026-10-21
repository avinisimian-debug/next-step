/**
 * Supabase connection settings, read on the server at request time (nothing in the
 * browser talks to Supabase directly). The publishable key is designed to be public:
 * every table is protected by row-level security in the next_step schema.
 * Returns null when the project is not configured, and features show a clear
 * "not available" state instead of pretending to work.
 */
export interface SupabaseConfig {
  url: string;
  key: string;
}

export const DB_SCHEMA = "next_step";

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export const isSupabaseConfigured = () => getSupabaseConfig() !== null;
