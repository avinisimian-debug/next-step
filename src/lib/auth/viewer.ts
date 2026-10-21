import "server-only";
import { cache } from "react";
import { createSupabaseServerClient, type ServerSupabase } from "@/lib/supabase/server";

export type Role = "member" | "representative" | "moderator" | "admin";

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  represented_institution_id: string | null;
}

export type Viewer =
  | { state: "unconfigured" }
  | { state: "anonymous"; supabase: ServerSupabase }
  | { state: "signed_in"; supabase: ServerSupabase; userId: string; email: string | null; profile: Profile };

/**
 * Who is making this request. The user id comes from Supabase Auth (verified server-side
 * with getUser), never from the client; the role comes from the database.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { state: "unconfigured" };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { state: "anonymous", supabase };

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, represented_institution_id")
    .eq("id", data.user.id)
    .maybeSingle<Profile>();
  if (!profile) {
    // First visit after signing up: create the profile. The function only ever acts on auth.uid().
    const created = await supabase.rpc("ensure_profile", { name: "" }).single<Profile>();
    profile = created.data ?? null;
  }
  if (!profile) return { state: "anonymous", supabase };
  return { state: "signed_in", supabase, userId: data.user.id, email: data.user.email ?? null, profile };
});

export const isModerator = (v: Viewer) =>
  v.state === "signed_in" && (v.profile.role === "moderator" || v.profile.role === "admin");
