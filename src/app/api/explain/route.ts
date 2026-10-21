import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";
import { explainRecommendations, isAiConfigured } from "@/lib/ai/explain";
import { scoreInstitution } from "@/lib/matching/engine";
import { QUESTIONS, asArray, optionLabel, type Answers } from "@/lib/questionnaire/questions";

export const runtime = "nodejs";

const bodySchema = z.object({
  consent: z.literal(true),
  ids: z.array(z.string().max(80)).min(1).max(3),
  answers: z.record(z.string(), z.union([z.string().max(600), z.array(z.string().max(60)).max(12)])),
});

// Best-effort per-instance rate limit. Use a shared store (e.g. Redis) in production.
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 8;
}

export async function GET() {
  return NextResponse.json({ available: isAiConfigured() });
}

export async function POST(req: Request) {
  if (!isAiConfigured()) return NextResponse.json({ available: false }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  // Only known question ids are used; anything else in the payload is ignored.
  const answers: Answers = {};
  for (const q of QUESTIONS) if (parsed.data.answers[q.id] !== undefined) answers[q.id] = parsed.data.answers[q.id];

  const catalog = await getRepository().listPublic();
  const recs = parsed.data.ids
    .map((id) => catalog.find((i) => i.id === id))
    .filter((i) => i !== undefined)
    .map((i) => scoreInstitution(i, answers));

  const summary = QUESTIONS.filter((q) => answers[q.id] !== undefined).map((q) =>
    q.kind === "text"
      ? `${q.title} ${String(answers[q.id])}`
      : `${q.title} ${asArray(answers[q.id]).map((v) => optionLabel(q.id, v)).join(", ")}`,
  );

  const items = await explainRecommendations(recs, summary);
  if (!items) return NextResponse.json({ available: true, items: null });
  return NextResponse.json({ available: true, items });
}
