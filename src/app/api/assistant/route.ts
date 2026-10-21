import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";
import { isAiConfigured } from "@/lib/ai/explain";
import { answerQuestion } from "@/lib/ai/assistant";
import { keywords, retrieve, type CommunityDoc } from "@/lib/ai/retrieval";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({ question: z.string().trim().min(3).max(500) });

// Best-effort per-instance limit. A shared store would be needed for a hard guarantee across instances.
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 10;
}

/** Published community threads that share words with the question, read with the visitor's own access. */
async function communityDocs(question: string): Promise<CommunityDoc[]> {
  const supabase = await createSupabaseServerClient();
  const words = keywords(question);
  if (!supabase || !words.length) return [];
  const { data, error } = await supabase
    .rpc("search_questions", { q: words.join(" or "), max_results: 6 })
    .select("id, title, body, answers(body, kind, status)");
  if (error || !data) return [];
  return (data as unknown as { id: string; title: string; body: string; answers: { body: string; kind: "experience" | "official"; status: string }[] }[]).map(
    (q) => ({ ...q, answers: q.answers.filter((a) => a.status === "published") }),
  );
}

export async function POST(req: Request) {
  if (!isAiConfigured()) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ status: "rate_limited" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });

  const [catalog, community] = await Promise.all([getRepository().listPublic(), communityDocs(parsed.data.question)]);
  const sources = retrieve(parsed.data.question, catalog, community);
  const result = await answerQuestion(parsed.data.question, sources);
  if (result.status === "error") return NextResponse.json({ status: "error" }, { status: 502 });
  // Source text stays on the server; the page shows titles, links and trust labels.
  const strip = (s: (typeof sources)[number]) => ({ id: s.id, kind: s.kind, title: s.title, href: s.href, trust: s.trust });
  return NextResponse.json(
    result.status === "answered"
      ? { status: "answered", answer: result.answer, confidence: result.confidence, sources: result.sources.map(strip) }
      : { status: "insufficient", sources: result.sources.map(strip) },
  );
}
