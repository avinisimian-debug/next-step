"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { firstIssue, importedStepsSchema, issueField, stepSchema, stepStatusSchema } from "@/lib/community/schemas";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@/lib/supabase/errors";
import type { FormState } from "@/app/account/actions";
import type { ActionResult } from "@/app/actions/saved";

const uuid = z.string().uuid();

async function signedIn() {
  const viewer = await getViewer();
  return viewer.state === "signed_in" ? viewer : null;
}

async function knownInstitution(id: string | null) {
  return id === null || (await getRepository().listPublic()).some((i) => i.id === id);
}

async function nextPosition(viewer: NonNullable<Awaited<ReturnType<typeof signedIn>>>) {
  const { data } = await viewer.supabase.from("pathway_steps").select("position").order("position", { ascending: false }).limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addStep(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = stepSchema.safeParse(Object.fromEntries(["title", "detail", "institution_id", "due_date"].map((k) => [k, form.get(k) ?? undefined])));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), field: issueField(parsed.error) };
  if (!(await knownInstitution(parsed.data.institution_id))) return { status: "error", message: USER_ERROR_MESSAGES.invalid };
  const viewer = await signedIn();
  if (!viewer) return { status: "error", message: USER_ERROR_MESSAGES.auth_required };
  const { error } = await viewer.supabase.from("pathway_steps").insert({ ...parsed.data, position: await nextPosition(viewer) });
  if (error) return { status: "error", message: userErrorMessage(error)! };
  revalidatePath("/my-path");
  return { status: "ok", message: "הצעד נוסף." };
}

export async function setStepStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: stepStatusSchema }).safeParse({ id, status });
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await signedIn();
  if (!viewer) return { ok: false, message: USER_ERROR_MESSAGES.auth_required };
  const { error, count } = await viewer.supabase
    .from("pathway_steps")
    .update({ status: parsed.data.status }, { count: "exact" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  if (!count) return { ok: false, message: USER_ERROR_MESSAGES.not_found };
  revalidatePath("/my-path");
  return { ok: true };
}

export async function deleteStep(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await signedIn();
  if (!viewer) return { ok: false, message: USER_ERROR_MESSAGES.auth_required };
  const { error } = await viewer.supabase.from("pathway_steps").delete().eq("id", id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  revalidatePath("/my-path");
  return { ok: true };
}

/** Swaps a step with its neighbour. Both rows are read through RLS, so only the owner's steps move. */
export async function moveStep(id: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!uuid.safeParse(id).success || !["up", "down"].includes(direction)) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await signedIn();
  if (!viewer) return { ok: false, message: USER_ERROR_MESSAGES.auth_required };
  const { data, error } = await viewer.supabase.from("pathway_steps").select("id, position").order("position").order("created_at");
  if (error) return { ok: false, message: userErrorMessage(error)! };
  const idx = data.findIndex((s) => s.id === id);
  const other = idx === -1 ? undefined : data[direction === "up" ? idx - 1 : idx + 1];
  if (!other) return { ok: true };
  // Renumber densely so equal positions can't block a move.
  const order = data.map((s) => s.id);
  [order[idx], order[order.indexOf(other.id)]] = [other.id, id];
  for (const [position, stepId] of order.entries()) {
    const current = data.find((s) => s.id === stepId)!;
    if (current.position === position) continue;
    const res = await viewer.supabase.from("pathway_steps").update({ position }).eq("id", stepId);
    if (res.error) return { ok: false, message: userErrorMessage(res.error)! };
  }
  revalidatePath("/my-path");
  return { ok: true };
}

/** Copies steps from the device's action plan into the account. Skips titles that already exist. */
export async function importPlanSteps(steps: unknown): Promise<ActionResult<{ imported: number }>> {
  const parsed = importedStepsSchema.safeParse(steps);
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await signedIn();
  if (!viewer) return { ok: false, message: USER_ERROR_MESSAGES.auth_required };

  const known = new Set((await getRepository().listPublic()).map((i) => i.id));
  const { data: existing, error: readError } = await viewer.supabase.from("pathway_steps").select("title");
  if (readError) return { ok: false, message: userErrorMessage(readError)! };
  const have = new Set(existing.map((s) => s.title));
  let position = await nextPosition(viewer);
  const rows = parsed.data
    .filter((s) => !have.has(s.title))
    .map((s) => ({
      title: s.title,
      detail: s.detail,
      institution_id: s.institution_id && known.has(s.institution_id) ? s.institution_id : null,
      position: position++,
    }));
  if (rows.length) {
    const { error } = await viewer.supabase.from("pathway_steps").insert(rows);
    if (error) return { ok: false, message: userErrorMessage(error)! };
  }
  revalidatePath("/my-path");
  return { ok: true, imported: rows.length };
}
