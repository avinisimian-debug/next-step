"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Info, Pencil, RotateCcw, Scale, Sparkles, UserRound } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { match } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, clearAllStored, useStored } from "@/lib/client/store";
import { RecommendationCard } from "./RecommendationCard";
import { PathwayOverview } from "./PathwayOverview";
import { Loading } from "@/components/site/Loading";

export function ResultsView({ catalog }: { catalog: Institution[] }) {
  const router = useRouter();
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const [, setCompare] = useStored<string[]>(KEYS.compare, []);
  const [, setProgress] = useStored(KEYS.progress, { index: 0, phase: "summary" });
  const result = useMemo(() => match(catalog, answers), [catalog, answers]);
  const [ai, setAi] = useState<Record<string, string> | null>(null);

  if (!hydrated) return <Loading label="מחשבים את ההמלצות…" />;

  if (Object.keys(answers).length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-navy-950">עוד אין לנו מספיק כדי להמליץ</h1>
        <p className="mt-4 leading-7 text-stone-600">
          ההמלצות נבנות מהתשובות שלך בשאלון. זה לוקח כמה דקות, ואפשר לדלג על שאלות שלא מתאימות לך.
        </p>
        <Link href="/questionnaire" className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper">
          למעבר לשאלון
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const { recommendations: recs } = result;

  const compareAll = () => {
    setCompare(recs.map((r) => r.institution.id));
    router.push("/compare");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
      <header className="animate-rise">
        <p className="text-sm font-semibold text-teal-700">ההמלצות שלך</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-bold leading-tight text-navy-950 sm:text-5xl">
          {recs.length === 3 ? "מצאנו את שלושת הכיוונים שכדאי לך להכיר." : "אלה הכיוונים שכדאי לך להכיר."}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
          ההמלצות מבוססות על התשובות שלך. כדאי להכיר את האפשרויות, להשוות ביניהן ולבדוק מה מרגיש לך נכון.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {recs.length > 1 && (
            <button
              type="button"
              onClick={compareAll}
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-navy-800"
            >
              <Scale className="size-4" aria-hidden="true" />
              השוואה בין הכיוונים
            </button>
          )}
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            תוכנית הפעולה שלי
          </Link>
          <Link
            href="/questionnaire?edit=1"
            onClick={() => setProgress({ index: 0, phase: "summary" })}
            className="inline-flex items-center gap-2 rounded-full border border-sand-300 px-5 py-2.5 text-sm font-medium text-navy-900 hover:bg-sand-100"
          >
            <Pencil className="size-4" aria-hidden="true" />
            שינוי תשובות
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAllStored();
              router.push("/questionnaire");
            }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-sand-100"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            להתחיל מחדש
          </button>
        </div>
      </header>

      <div className="mt-8 space-y-3">
        {result.limitation && <Notice>{result.limitation}</Notice>}
        {result.lowConfidence && recs.length > 0 && (
          <Notice>ענית על חלק קטן מהשאלות, ולכן ההתאמה פחות מדויקת. אפשר לחזור ולהשלים כדי לקבל התאמה טובה יותר.</Notice>
        )}
        {result.needsGuidance && (
          <Notice icon={<UserRound className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" />}>
            ציינת שתרצה ליווי אישי. ההמלצות כאן הן נקודת פתיחה בלבד — מומלץ לשוחח עם יועץ בבית הספר, עם גורם מקצועי או
            עם נציגי המסגרות עצמן.
          </Notice>
        )}
      </div>

      <PathwayOverview pathways={result.pathways} />

      {recs.length > 0 && (
        <h2 className="mt-12 font-display text-2xl font-bold text-navy-950">המסגרות שכדאי להכיר</h2>
      )}

      {recs.length > 0 && <AiPanel answers={answers} ids={recs.map((r) => r.institution.id)} onResult={setAi} />}

      <div className="mt-8 space-y-8">
        {recs.map((r, i) => (
          <RecommendationCard key={r.institution.id} rec={r} rank={i} aiSummary={ai?.[r.institution.id]} />
        ))}
      </div>

      <aside className="mt-12 rounded-3xl border border-sand-200 bg-sand-100/60 p-6 text-sm leading-7 text-stone-600">
        <h2 className="mb-1 font-semibold text-navy-950">חשוב לדעת</h2>
        ציון ההתאמה מחושב מההעדפות שציינת בלבד, ואינו הסתברות להצלחה או דירוג של המוסדות. ההמלצות הן מידע בלבד ואינן
        מחליפות הכוונה רשמית לגיוס, ייעוץ קבלה או שיחה אישית. אין התחייבות לקבלה או לשיבוץ בתפקיד צבאי כלשהו.{" "}
        <Link href="/about#method" className="font-medium text-teal-700 underline">
          איך עובד מנגנון ההתאמה
        </Link>
      </aside>
    </div>
  );
}

function Notice({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-mist-300 bg-mist-100/60 p-4 text-sm leading-7 text-navy-900" role="status">
      {icon ?? <Info className="mt-0.5 size-5 shrink-0 text-navy-600" aria-hidden="true" />}
      <p>{children}</p>
    </div>
  );
}

function AiPanel({ answers, ids, onResult }: { answers: Answers; ids: string[]; onResult: (r: Record<string, string> | null) => void }) {
  const [available, setAvailable] = useState(false);
  const [consent, setConsent] = useStored<boolean>(KEYS.aiConsent, false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "failed">("idle");

  useEffect(() => {
    fetch("/api/explain")
      .then((r) => r.json())
      .then((d: { available?: boolean }) => setAvailable(Boolean(d.available)))
      .catch(() => setAvailable(false));
  }, []);

  const key = ids.join(",");
  useEffect(() => {
    if (!available || !consent) return;
    let cancelled = false;
    setState("loading");
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true, ids, answers }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: Record<string, string> | null } | null) => {
        if (cancelled) return;
        onResult(d?.items ?? null);
        setState(d?.items ? "done" : "failed");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, consent, key]);

  if (!available) return null;

  return (
    <div className="mt-6 rounded-2xl border border-sand-200 bg-paper p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-teal-600" aria-hidden="true" />
        <div className="flex-1 text-sm leading-7">
          <p className="font-semibold text-navy-950">סיכום אישי בניסוח חופשי (אופציונלי)</p>
          <p className="text-stone-600">
            אם תאשר, התשובות שלך (כולל הטקסט החופשי, אם כתבת) והמידע על המסגרות שהומלצו יישלחו לשירות AI חיצוני
            (Anthropic) כדי לנסח סיכום קצר. ההמלצות עצמן לא משתנות, והתשובות לא נשמרות אצלנו.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 font-medium text-navy-900">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (!e.target.checked) {
                  onResult(null);
                  setState("idle");
                }
              }}
              className="size-4 accent-navy-900"
            />
            אני מאשר לשלוח את התשובות לניסוח סיכום
          </label>
          <p className="mt-1 text-xs text-mist-500" aria-live="polite">
            {state === "loading" && "מנסחים סיכום…"}
            {state === "failed" && "לא הצלחנו לנסח סיכום כרגע. ההסברים למטה מבוססים על הנתונים ועומדים בפני עצמם."}
            {state === "done" && "הסיכום מופיע בכל כרטיס, מעל הנימוקים."}
          </p>
        </div>
      </div>
    </div>
  );
}
