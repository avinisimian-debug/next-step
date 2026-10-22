"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer, isModerator } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { answerSchema, firstIssue, issueField, questionSchema, reportSchema } from "@/lib/community/schemas";
import { similarQuestions } from "@/lib/community/queries";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/account/actions";
import type { ActionResult } from "@/app/actions/saved";

const field = (form: FormData, k: string) => {
  const v = form.get(k);
  return typeof v === "string" ? v : undefined;
};

export type AskState = FormState & { values?: Record<string, string> };

export async function askQuestion(_prev: AskState, form: FormData): Promise<AskState> {
  const values = Object.fromEntries(["title", "body", "institution_id", "pathway"].map((k) => [k, field(form, k) ?? ""]));
  const parsed = questionSchema.safeParse(values);
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), field: issueField(parsed.error), values };
  if (parsed.data.institution_id && !(await getRepository().listPublic()).some((i) => i.id === parsed.data.institution_id))
    return { status: "error", message: USER_ERROR_MESSAGES.invalid, values };

  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { status: "error", message: USER_ERROR_MESSAGES.auth_required, values };
  const { data, error } = await viewer.supabase.from("questions").insert(parsed.data).select("id").single();
  if (error) return { status: "error", message: userErrorMessage(error)!, values };
  revalidatePath("/community");
  redirect(`/community/${data.id}`);
}

/** Duplicate suggestions while typing a question. Uses the visitor's own access, so only published questions come back. */
export async function suggestSimilar(title: string) {
  const text = z.string().trim().min(4).max(160).safeParse(title);
  if (!text.success) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return similarQuestions(supabase, text.data, 5);
}

export async function postAnswer(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = answerSchema.safeParse({
    question_id: field(form, "question_id"),
    body: field(form, "body"),
    official: field(form, "official") === "1",
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), field: issueField(parsed.error) };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { status: "error", message: USER_ERROR_MESSAGES.auth_required };
  const { question_id, body, official } = parsed.data;
  // The database only accepts 'official' from the institution's verified representative.
  const { error } = await viewer.supabase.from("answers").insert({ question_id, body, kind: official ? "official" : "experience" });
  if (error) return { status: "error", message: userErrorMessage(error)! };
  revalidatePath(`/community/${question_id}`);
  return { status: "ok", message: "התשובה פורסמה." };
}

export async function setHelpful(answerId: string, questionId: string, on: boolean): Promise<ActionResult> {
  const ids = z.object({ a: z.string().uuid(), q: z.string().uuid() }).safeParse({ a: answerId, q: questionId });
  if (!ids.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.auth_required };
  const { error } = on
    ? await viewer.supabase.from("answer_votes").insert({ answer_id: answerId })
    : await viewer.supabase.from("answer_votes").delete().eq("answer_id", answerId);
  if (error && !(on && error.code === "23505")) return { ok: false, message: userErrorMessage(error)! };
  revalidatePath(`/community/${questionId}`);
  return { ok: true };
}

export async function reportContent(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse({
    target_type: field(form, "target_type"),
    target_id: field(form, "target_id"),
    reason: field(form, "reason"),
    details: field(form, "details"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };
  const viewer = await getViewer();
  if (viewer.state !== "signed_in") return { status: "error", message: USER_ERROR_MESSAGES.auth_required };
  const { error } = await viewer.supabase.from("reports").insert(parsed.data);
  if (error?.code === "23505") return { status: "ok", message: "כבר דיווחת על התוכן הזה. תודה." };
  if (error) return { status: "error", message: userErrorMessage(error)! };
  return { status: "ok", message: "הדיווח התקבל ויועבר לבדיקה. תודה." };
}

// ---------------------------------------------------------------------------
// Moderation. The database checks the moderator role again on every write.
// ---------------------------------------------------------------------------

const moderationSchema = z.object({
  target_type: z.enum(["question", "answer"]),
  target_id: z.string().uuid(),
  status: z.enum(["published", "hidden", "removed"]),
});

export async function setContentStatus(targetType: string, targetId: string, status: string): Promise<ActionResult> {
  const parsed = moderationSchema.safeParse({ target_type: targetType, target_id: targetId, status });
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await getViewer();
  if (!isModerator(viewer) || viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.forbidden };
  const table = parsed.data.target_type === "question" ? "questions" : "answers";
  const { error, count } = await viewer.supabase
    .from(table)
    .update({ status: parsed.data.status }, { count: "exact" })
    .eq("id", parsed.data.target_id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  if (!count) return { ok: false, message: USER_ERROR_MESSAGES.not_found };
  revalidatePath("/moderation");
  revalidatePath("/community");
  return { ok: true };
}

export async function closeReport(reportId: string, outcome: string): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid(), outcome: z.enum(["resolved", "dismissed"]) }).safeParse({ id: reportId, outcome });
  if (!parsed.success) return { ok: false, message: USER_ERROR_MESSAGES.invalid };
  const viewer = await getViewer();
  if (!isModerator(viewer) || viewer.state !== "signed_in") return { ok: false, message: USER_ERROR_MESSAGES.forbidden };
  const { error, count } = await viewer.supabase
    .from("reports")
    .update({ status: parsed.data.outcome }, { count: "exact" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: userErrorMessage(error)! };
  if (!count) return { ok: false, message: USER_ERROR_MESSAGES.not_found };
  revalidatePath("/moderation");
  return { ok: true };
}
