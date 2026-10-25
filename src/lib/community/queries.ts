import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Pathway } from "@/lib/domain/types";
import type { Role } from "@/lib/auth/viewer";

export interface Author {
  display_name: string;
  role: Role;
  represented_institution_id: string | null;
}

export interface QuestionRow {
  id: string;
  author_id: string | null;
  title: string;
  body: string;
  institution_id: string | null;
  pathway: Pathway | null;
  status: "published" | "hidden" | "removed";
  is_test: boolean;
  answer_count: number;
  created_at: string;
  author: Author | null;
}

export interface AnswerRow {
  id: string;
  question_id: string;
  author_id: string | null;
  body: string;
  kind: "experience" | "official";
  status: "published" | "hidden" | "removed";
  helpful_count: number;
  created_at: string;
  author: Author | null;
}

const AUTHOR = "author:profiles!%s_author_id_fkey(display_name, role, represented_institution_id)";
export const QUESTION_FIELDS = `id, author_id, title, body, institution_id, pathway, status, is_test, answer_count, created_at, ${AUTHOR.replace("%s", "questions")}`;
const ANSWER_FIELDS = `id, question_id, author_id, body, kind, status, helpful_count, created_at, ${AUTHOR.replace("%s", "answers")}`;

export interface QuestionFilters {
  q: string;
  institution: string | null;
  pathway: Pathway | null;
  unanswered: boolean;
  mineOf: string | null;
  page: number;
}

export const PAGE_SIZE = 20;

/** Lists questions visible to the current viewer (RLS decides which). */
export async function listQuestions(supabase: ServerSupabase, f: QuestionFilters) {
  const from = (f.page - 1) * PAGE_SIZE;
  let query = f.q
    ? supabase.rpc("search_questions", { q: f.q, max_results: 20 }).select(QUESTION_FIELDS)
    : supabase.from("questions").select(QUESTION_FIELDS).order("created_at", { ascending: false });
  if (f.institution) query = query.eq("institution_id", f.institution);
  if (f.pathway) query = query.eq("pathway", f.pathway);
  if (f.unanswered) query = query.eq("answer_count", 0);
  if (f.mineOf) query = query.eq("author_id", f.mineOf);
  else query = query.eq("status", "published");
  const { data, error } = await query.range(from, from + PAGE_SIZE); // one extra row tells us if there is a next page
  const rows = (data ?? []) as unknown as QuestionRow[];
  return { questions: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, error };
}

export async function getQuestion(supabase: ServerSupabase, id: string) {
  const { data, error } = await supabase.from("questions").select(QUESTION_FIELDS).eq("id", id).maybeSingle();
  return { question: data as unknown as QuestionRow | null, error };
}

export async function listAnswers(supabase: ServerSupabase, questionId: string) {
  const { data, error } = await supabase
    .from("answers")
    .select(ANSWER_FIELDS)
    .eq("question_id", questionId)
    .order("kind", { ascending: false }) // official answers first
    .order("helpful_count", { ascending: false })
    .order("created_at");
  return { answers: (data ?? []) as unknown as AnswerRow[], error };
}

/** Ids of the answers the viewer marked helpful (they can only see their own marks). */
export async function myHelpfulMarks(supabase: ServerSupabase, answerIds: string[]) {
  if (!answerIds.length) return new Set<string>();
  const { data } = await supabase.from("answer_votes").select("answer_id").in("answer_id", answerIds);
  return new Set((data ?? []).map((r) => r.answer_id as string));
}

export async function similarQuestions(supabase: ServerSupabase, text: string, limit = 5) {
  const { data } = await supabase.rpc("search_questions", { q: text, max_results: limit }).select("id, title, answer_count");
  return (data ?? []) as { id: string; title: string; answer_count: number }[];
}
