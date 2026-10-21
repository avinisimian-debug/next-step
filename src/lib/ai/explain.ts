import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Institution } from "@/lib/domain/types";
import type { Recommendation } from "@/lib/matching/engine";

/**
 * Optional natural-language summaries for recommendations.
 *
 * Guardrails:
 * - The model never chooses institutions. It receives the engine's picks and their
 *   catalog facts, and may only rephrase those facts.
 * - Output is constrained by a JSON schema and validated again with zod; any id that
 *   wasn't requested is dropped.
 * - Any failure returns null so the caller falls back to deterministic text.
 */

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const outputSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), summary: z.string().min(10).max(420) }))
    .max(3),
});

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "summary"],
        properties: { id: { type: "string" }, summary: { type: "string" } },
      },
    },
  },
} as const;

const SYSTEM = `אתה כותב הסברים קצרים בעברית לבני נוער שבוחרים מסלול אחרי י״ב (צה״ל, מכינה, ישיבת הסדר, ישיבה גבוהה).
כללים מחייבים:
- השתמש רק בעובדות שמופיעות בשדה "facts" ובסיבות שבשדה "reasons". אל תוסיף שום עובדה, מספר, עלות, סדר יום, מוניטין או הישגי בוגרים שלא מופיעים שם.
- כתוב לכל מסגרת 1–2 משפטים בגוף שני, בטון מכבד, ניטרלי ולא לוחץ. אל תמליץ על בחירה דתית או צבאית מסוימת ואל תשפוט.
- אל תבטיח קבלה, שיבוץ או תפקיד צבאי.
- החזר רק את המזהים שקיבלת.`;

function factsFor(inst: Institution) {
  return {
    id: inst.id,
    name: inst.name,
    type: inst.typeLabel,
    location: inst.locationLabel,
    description: inst.shortDescription,
    highlights: inst.highlights,
    overview: inst.profile.overview,
    philosophy: inst.profile.philosophy,
    structure: inst.profile.programStructure,
    limitations: inst.limitations,
  };
}

export async function explainRecommendations(
  recs: Recommendation[],
  answerSummary: string[],
): Promise<Record<string, string> | null> {
  if (!isAiConfigured() || recs.length === 0) return null;
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });

  const payload = {
    user_preferences: answerSummary,
    options: recs.map((r) => ({ facts: factsFor(r.institution), reasons: r.reasons.slice(0, 5) })),
  };

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: JSON_SCHEMA } },
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = outputSchema.safeParse(JSON.parse(text.text));
    if (!parsed.success) return null;
    const allowed = new Set(recs.map((r) => r.institution.id));
    const out: Record<string, string> = {};
    for (const item of parsed.data.items) if (allowed.has(item.id)) out[item.id] = item.summary.trim();
    return Object.keys(out).length > 0 ? out : null;
  } catch (err) {
    console.error("AI explanation failed; using deterministic text.", err instanceof Error ? err.message : err);
    return null;
  }
}
