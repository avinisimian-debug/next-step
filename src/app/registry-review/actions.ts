"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/saved";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["matched", "unresolved", "ambiguous", "inactive", "not_applicable"]),
  institution_id: z.string().max(100).nullable(),
  notes: z.string().trim().max(1000).nullable(),
});

/** Records a reviewer's decision about one registry entry. The database allows this for admins only. */
export async function resolveRegistryEntry(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const { id, status, institution_id, notes } = parsed.data;
  if (status === "matched" && !institution_id) return { ok: false, message: "כדי לסמן התאמה צריך לבחור רשומה מהמאגר." };
  if (institution_id && !(await getRepository().listAll().catch(async () => getRepository().listPublic())).some((i) => i.id === institution_id))
    return { ok: false, message: USER_ERROR_MESSAGES.invalid };

  const viewer = await getViewer();
  if (viewer.state !== "signed_in" || viewer.profile.role !== "admin") return { ok: false, message: USER_ERROR_MESSAGES.forbidden };
  const { error, count } = await viewer.supabase
    .from("registry_entries")
    .update({ status, matched_institution_id: status === "matched" ? institution_id : null, notes, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  if (!count) return { ok: false, message: USER_ERROR_MESSAGES.not_found };
  revalidatePath("/registry-review");
  return { ok: true };
}
