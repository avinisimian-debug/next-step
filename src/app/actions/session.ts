"use server";

import { getViewer } from "@/lib/auth/viewer";

export type HeaderState = { state: "unconfigured" | "anonymous" } | { state: "signed_in"; name: string; unread: number };

/** Small session summary for the header. Loaded after mount so pages stay cacheable. */
export async function getHeaderState(): Promise<HeaderState> {
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { state: viewer.state };
  const { count } = await viewer.supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return { state: "signed_in", name: viewer.profile.display_name, unread: count ?? 0 };
}
