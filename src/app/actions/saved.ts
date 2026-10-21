"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@/lib/supabase/errors";

export type SaveState = { mode: "local"; canSignIn: boolean } | { mode: "account"; saved: boolean };
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const idSchema = z.string().min(1).max(100);

async function isPublicInstitution(id: string) {
  return (await getRepository().listPublic()).some((i) => i.id === id);
}

/** Where the save button should store its state: the visitor's account, or this device. */
export async function getSaveState(institutionId: string): Promise<SaveState> {
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { mode: "local", canSignIn: viewer.state === "anonymous" };
  const { data, error } = await viewer.supabase
    .from("saved_institutions")
    .select("institution_id")
    .eq("institution_id", institutionId)
    .maybeSingle();
  if (error) return { mode: "local", canSignIn: false };
  return { mode: "account", saved: Boolean(data) };
}

export async function setSaved(institutionId: string, save: boolean): Promise<ActionResult<{ saved: boolean }>> {
  const id = idSchema.safeParse(institutionId);
  if (!id.success || !(await isPublicInstitution(id.data))) return { ok: false, message: USER_ERROR_MESSAGES.not_found };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.auth_required };

  const { error } = save
    ? await viewer.supabase.from("saved_institutions").upsert({ institution_id: id.data }, { onConflict: "user_id,institution_id", ignoreDuplicates: true })
    : await viewer.supabase.from("saved_institutions").delete().eq("institution_id", id.data);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  revalidatePath("/saved");
  return { ok: true, saved: save };
}

/** Moves favorites kept on this device into the account. Unknown ids are ignored. */
export async function importDeviceFavorites(ids: string[]): Promise<ActionResult<{ imported: number }>> {
  const parsed = z.array(idSchema).max(50).safeParse(ids);
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.auth_required };

  const known = new Set((await getRepository().listPublic()).map((i) => i.id));
  const rows = [...new Set(parsed.data)].filter((id) => known.has(id)).map((institution_id) => ({ institution_id }));
  if (rows.length) {
    const { error } = await viewer.supabase
      .from("saved_institutions")
      .upsert(rows, { onConflict: "user_id,institution_id", ignoreDuplicates: true });
    if (error) return { ok: false, message: userErrorMessage(error)! };
  }
  revalidatePath("/saved");
  return { ok: true, imported: rows.length };
}

export async function updateSavedNote(institutionId: string, note: string): Promise<ActionResult> {
  const parsed = z.object({ id: idSchema, note: z.string().trim().max(500) }).safeParse({ id: institutionId, note });
  if (!parsed.success) return { ok: false, message: "ההערה ארוכה מדי (עד 500 תווים)." };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.auth_required };
  const { error } = await viewer.supabase
    .from("saved_institutions")
    .update({ note: parsed.data.note || null })
    .eq("institution_id", parsed.data.id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  revalidatePath("/saved");
  return { ok: true };
}
