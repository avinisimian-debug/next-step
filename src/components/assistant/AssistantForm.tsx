"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, CircleDashed, MessagesSquare, Route, Sparkles } from "lucide-react";
import { Button, Field, Notice, inputStyles } from "@/components/ui/ui";
import { ContentLabel } from "@/components/community/bits";

type Source = { id: string; kind: "institution" | "pathway" | "community"; title: string; href: string; trust: string };
type Result =
  | { status: "answered"; answer: string; confidence: "high" | "medium" | "low"; sources: Source[] }
  | { status: "insufficient"; sources: Source[] };

const TRUST: Record<string, { text: string; Icon: typeof BadgeCheck }> = {
  verified: { text: "אומת מול מקור רשמי", Icon: BadgeCheck },
  partial: { text: "אומת חלקית", Icon: CircleDashed },
  overview: { text: "סקירת מסלול", Icon: Route },
  personal_experience: { text: "ניסיון אישי מהקהילה", Icon: MessagesSquare },
  official_answer: { text: "כולל תשובה רשמית של מסגרת", Icon: BadgeCheck },
};
const CONFIDENCE = { high: "המקורות עונים על השאלה ישירות.", medium: "המקורות עונים על חלק מהשאלה.", low: "המקורות נוגעים בשאלה רק בעקיפין." };

const ERRORS: Record<string, string> = {
  rate_limited: "נשלחו הרבה שאלות בזמן קצר. אפשר לנסות שוב בעוד כמה דקות.",
  invalid: "השאלה צריכה להכיל בין 3 ל־500 תווים.",
  unavailable: "העוזר לא זמין כרגע.",
  error: "לא הצלחנו לקבל תשובה כרגע. אפשר לנסות שוב.",
};

/** Renders [S1]-style markers as small superscript links to the matching source. */
function withCitations(text: string, sources: Source[]) {
  return text.split(/(\[S\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(S\d+)\]$/);
    if (!m) return part;
    const n = sources.findIndex((s) => s.id === m[1]);
    if (n === -1) return null;
    return (
      <a key={i} href={`#src-${m[1]}`} className="mx-0.5 align-super text-xs font-semibold text-teal-700" aria-label={`מקור ${n + 1}`}>
        [{n + 1}]
      </a>
    );
  });
}

export function AssistantForm() {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ q: string; r: Result } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 3) return setError(ERRORS.invalid);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      const body = await res.json().catch(() => ({ status: "error" }));
      if (!res.ok || (body.status !== "answered" && body.status !== "insufficient")) setError(ERRORS[body.status] ?? ERRORS.error);
      else setResult({ q, r: body as Result });
    } catch {
      setError(ERRORS.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <Field id="question" label="מה רצית לדעת?" hint="למשל: ״מה ההבדל בין מכינה לישיבת הסדר?״ או ״איך נראה סדר היום בישיבת הכותל?״">
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
            required
            aria-describedby="question-hint"
            className={inputStyles}
          />
        </Field>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          <Sparkles className="size-4" aria-hidden="true" />
          {pending ? "מחפש במקורות…" : "לשאול"}
        </Button>
      </form>

      <div aria-live="polite">
        {error && <Notice tone="error">{error}</Notice>}
        {result && (
          <section aria-labelledby="h-answer" className="rounded-3xl border border-sand-200 bg-paper p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <ContentLabel kind="ai" />
              <span className="text-xs text-stone-600">על השאלה: {result.q}</span>
            </div>
            <h2 id="h-answer" className="sr-only">
              התשובה
            </h2>
            {result.r.status === "answered" ? (
              <>
                <p className="mt-4 whitespace-pre-line leading-8 text-navy-950">{withCitations(result.r.answer, result.r.sources)}</p>
                <p className="mt-3 text-xs text-stone-600">רמת ביטחון: {CONFIDENCE[result.r.confidence]}</p>
              </>
            ) : (
              <p className="mt-4 leading-7 text-navy-950">
                אין במאגר ובקהילה מספיק מידע מאומת כדי לענות על השאלה הזו, ולכן לא ננחש. אפשר לחפש מסגרת ספציפית, לשאול בקהילה או לפנות ישירות למסגרת.
              </p>
            )}
            {result.r.sources.length > 0 && (
              <div className="mt-5 border-t border-sand-200 pt-4">
                <h3 className="text-sm font-semibold text-navy-900">{result.r.status === "answered" ? "המקורות" : "מקורות שנבדקו"}</h3>
                <ol className="mt-2 space-y-1.5 text-sm">
                  {result.r.sources.map((s, n) => {
                    const t = TRUST[s.trust];
                    return (
                      <li key={s.id} id={`src-${s.id}`} className="flex flex-wrap items-center gap-x-2">
                        <span className="text-stone-600">{n + 1}.</span>
                        <Link href={s.href} className="text-navy-900 underline underline-offset-4">
                          {s.title}
                        </Link>
                        {t && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                            <t.Icon className="size-3.5" aria-hidden="true" />
                            {t.text}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/community/ask" className="text-sm font-medium text-teal-700 underline underline-offset-4">
                לשאול בקהילה
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
