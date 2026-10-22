"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/viewer";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@/lib/supabase/errors";

export type FormState = { status: "idle" } | { status: "ok"; message: string } | { status: "error"; message: string; field?: string };

const nameSchema = z.string().trim().min(2, "השם צריך להכיל לפחות 2 תווים.").max(40, "השם יכול להכיל עד 40 תווים.");

export async function updateDisplayName(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = nameSchema.safeParse(form.get("display_name"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { status: "error", message: USER_ERROR_MESSAGES.auth_required };
  const { error } = await viewer.supabase.from("profiles").update({ display_name: parsed.data }).eq("id", viewer.userId);
  if (error) return { status: "error", message: userErrorMessage(error)! };
  revalidatePath("/account");
  return { status: "ok", message: "השם עודכן." };
}

export async function markNotificationsRead(): Promise<void> {
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return;
  await viewer.supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/account");
}
