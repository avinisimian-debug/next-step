"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ClipboardList, ExternalLink, Footprints, MapPin, Plus, Scale, X } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { match } from "@/lib/matching/engine";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";
import {
  computeJourney,
  journeyPercent,
  nextActionFor,
  stageLabel,
  stageRank,
  stagesFor,
  type Stage,
} from "@/lib/journey/journey";
import { setJourneyStage, setSaved } from "@/app/actions/saved";
import { Loading } from "@/components/site/Loading";
import { Notice } from "@/components/ui/ui";
import { JourneyMap, ProgressRing } from "./JourneyMap";

export interface AccountPlace {
  institution_id: string;
  stage: Stage;
}

interface Props {
  catalog: Institution[];
  /** Rows from the signed-in user's account, or null when the list lives on this device. */
  account: AccountPlace[] | null;
  canSignIn: boolean;
  accountError?: string;
}

interface Place {
  inst: Institution;
  stage: Stage;
}

export function JourneyView({ catalog, account, canSignIn, accountError }: Props) {
  const router = useRouter();
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const [favs, setFavs] = useStored<string[]>(KEYS.favorites, []);
  const [compare] = useStored<string[]>(KEYS.compare, []);
  const [localStages, setLocalStages] = useStored<Record<string, Stage>>(KEYS.journey, {});
  // Optimistic stage changes for account rows while the server action runs.
  const [pendingStages, setPendingStages] = useState<Record<string, Stage>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byId = useMemo(() => new Map(catalog.map((i) => [i.id, i])), [catalog]);
  const result = useMemo(() => match(catalog, answers), [catalog, answers]);

  const places: Place[] = useMemo(() => {
    const rows = account
      ? account.map((r) => ({ id: r.institution_id, stage: pendingStages[r.institution_id] ?? r.stage }))
      : favs.map((id) => ({ id, stage: localStages[id] ?? ("interested" as Stage) }));
    return rows
      .map((r) => ({ inst: byId.get(r.id), stage: r.stage }))
      .filter((p): p is Place => Boolean(p.inst))
      .sort((a, b) => stageRank(b.stage) - stageRank(a.stage));
  }, [account, favs, localStages, pendingStages, byId]);

  if (!hydrated) return <Loading label="טוען את המסע שלך…" />;

  const answered = Object.keys(answers).length;
  const milestones = computeJourney({ answered, places, compared: compare.length });
  const percent = journeyPercent(milestones);
  const current = milestones.find((m) => m.status === "current");
  const listed = new Set(places.map((p) => p.inst.id));
  const suggestions = answered ? result.recommendations.filter((r) => !listed.has(r.institution.id)) : [];
  const active = places.filter((p) => p.stage !== "dropped");
  const dropped = places.filter((p) => p.stage === "dropped");
  const lead = active[0];
  const leadAction = lead ? nextActionFor(lead.inst, lead.stage) : null;

  const changeStage = (id: string, stage: Stage) => {
    setError(null);
    if (!account) {
      setLocalStages((prev) => ({ ...prev, [id]: stage }));
      setFavs((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setPendingStages((prev) => ({ ...prev, [id]: stage }));
    startTransition(async () => {
      const res = await setJourneyStage(id, stage).catch(() => ({ ok: false as const, message: "לא הצלחנו לשמור. אפשר לנסות שוב." }));
      if (!res.ok) {
        setError(res.message);
        setPendingStages((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else router.refresh();
    });
  };

  const remove = (id: string) => {
    setError(null);
    if (!account) {
      setFavs((prev) => prev.filter((x) => x !== id));
      setLocalStages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    startTransition(async () => {
      const res = await setSaved(id, false).catch(() => ({ ok: false as const, message: "לא הצלחנו להסיר. אפשר לנסות שוב." }));
      if (!res.ok) setError(res.message);
      else router.refresh();
    });
  };

  return (
    <div>
      {/* Header band with the route */}
      <section className="bg-navy-950 text-paper">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl animate-rise">
              <p className="text-sm font-semibold text-teal-100">המסע שלי</p>
              <h1 className="mt-2 font-display text-[2.1rem] font-bold leading-tight sm:text-5xl">מהשאלון ועד השיבוץ</h1>
              <p className="mt-3 leading-7 text-mist-300">
                כאן רואים איפה אתה עומד, מה הצעד הבא, ואיפה נמצא כל מקום שאתה בודק.{" "}
                {account ? "הכול שמור בחשבון שלך ופרטי לך בלבד." : "בלי חשבון, הכול נשמר רק בדפדפן הזה."}
              </p>
            </div>
            <ProgressRing percent={percent} size={84} tone="dark" />
          </div>
          <div className="mt-10">
            <JourneyMap milestones={milestones} tone="dark" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        {accountError && <Notice tone="error">{accountError}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        {/* Next step */}
        {current && (
          <section aria-labelledby="h-next" className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[28px] border border-sand-200 bg-paper p-6 shadow-card sm:p-8">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Footprints className="size-4" aria-hidden="true" />
                הצעד הבא שלך
              </p>
              <h2 id="h-next" className="mt-2 font-display text-2xl font-bold text-navy-950">
                {current.title}
              </h2>
              <p className="mt-2 leading-7 text-stone-600">{nextStepText(current.id, answered, active.length)}</p>
              <Link
                href={current.action.href}
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-paper hover:bg-navy-800"
              >
                {current.action.label}
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
            </div>
            {lead && leadAction && (
              <div className="rounded-[28px] border border-teal-600/20 bg-teal-100/60 p-6 sm:p-8">
                <p className="text-sm font-semibold text-teal-700">הכי מתקדם אצלך</p>
                <p className="mt-2 font-display text-xl font-bold text-navy-950">{lead.inst.name}</p>
                <p className="mt-1 text-sm text-stone-600">{stageLabel(lead.stage, lead.inst.kind)}</p>
                <ActionLine action={leadAction} />
              </div>
            )}
          </section>
        )}

        {/* My places */}
        <section id="places" aria-labelledby="h-places" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="h-places" className="font-display text-3xl font-bold text-navy-950">
                המקומות שאני בודק
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-stone-600">
                לכל מקום מסמנים איפה אתה בתהליך. הסימון שלך בלבד, והמסגרות לא רואות אותו.
              </p>
            </div>
            {active.length >= 2 && (
              <Link href="/compare" className="inline-flex items-center gap-2 rounded-full border border-navy-900 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-sand-100">
                <Scale className="size-4" aria-hidden="true" />
                להשוואה
              </Link>
            )}
          </div>

          {active.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-sand-300 p-8 text-center">
              <p className="font-display text-xl font-bold text-navy-950">הרשימה עוד ריקה</p>
              <p className="mx-auto mt-2 max-w-lg leading-7 text-stone-600">
                {answered
                  ? "אפשר להוסיף מההמלצות שלמטה, או לשמור מקומות מעמוד החיפוש."
                  : "כדאי להתחיל מהשאלון, כדי לקבל המלצות. אפשר גם לחפש ולשמור מקומות ישירות."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {!answered && (
                  <Link href="/questionnaire" className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper">
                    להתחיל את השאלון
                  </Link>
                )}
                <Link href="/institutions" className="rounded-full border border-sand-300 px-5 py-2.5 text-sm font-medium text-navy-900 hover:bg-sand-100">
                  לחיפוש מסגרות
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 grid gap-5 lg:grid-cols-2">
              {active.map((p) => (
                <PlaceCard key={p.inst.id} place={p} onStage={(s) => changeStage(p.inst.id, s)} onRemove={() => remove(p.inst.id)} />
              ))}
            </ul>
          )}

          {dropped.length > 0 && (
            <details className="mt-6 rounded-2xl border border-sand-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-navy-900">מקומות שהחלטתי לא להמשיך איתם ({dropped.length})</summary>
              <ul className="mt-3 space-y-2">
                {dropped.map((p) => (
                  <li key={p.inst.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-stone-600">{p.inst.name}</span>
                    <button type="button" onClick={() => changeStage(p.inst.id, "interested")} className="font-medium text-teal-700 underline underline-offset-4">
                      להחזיר לרשימה
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Suggestions from the engine */}
        {suggestions.length > 0 && (
          <section aria-labelledby="h-sugg">
            <h2 id="h-sugg" className="font-display text-2xl font-bold text-navy-950">
              מההמלצות שלך, עוד לא ברשימה
            </h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {suggestions.map((r) => (
                <li key={r.institution.id} className="flex flex-col rounded-3xl border border-sand-200 bg-paper p-5 shadow-card">
                  <p className="text-xs font-medium text-teal-700">{r.institution.typeLabel}</p>
                  <Link href={`/institutions/${r.institution.slug}`} className="mt-1 font-display text-lg font-bold text-navy-950 underline-offset-4 hover:underline">
                    {r.institution.name}
                  </Link>
                  <p className="mt-1 text-sm text-stone-600">ציון התאמה להעדפות שלך: {r.score} מתוך 100</p>
                  <button
                    type="button"
                    onClick={() => changeStage(r.institution.id, "interested")}
                    className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-full bg-navy-900 px-4 py-2 text-sm font-medium text-paper hover:bg-navy-800"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    להוסיף למסע
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tools along the way */}
        <section aria-labelledby="h-tools" className="grid gap-4 sm:grid-cols-3">
          <h2 id="h-tools" className="sr-only">
            כלים בדרך
          </h2>
          <ToolLink href="/plan" icon={ClipboardList} title="תוכנית הפעולה" text="צעדים מעשיים לפי ההמלצות, עם קישורים ומקורות." />
          <ToolLink href={account ? "/my-path" : "/login?next=%2Fmy-path"} icon={MapPin} title="צעדים אישיים" text={account ? "צעדים שהוספת בעצמך, עם תאריכי יעד." : "צעדים משלך עם תאריכי יעד (דורש חשבון)."} />
          <ToolLink href="/community" icon={Footprints} title="לשאול מי שכבר שם" text="שאלות ותשובות על מסגרות ומסלולים." />
        </section>

        {!account && canSignIn && active.length > 0 && (
          <Notice title="רוצה שהמסע יישמר בכל מכשיר?">
            עם חשבון, הרשימה והשלבים נשמרים בחשבון שלך.{" "}
            <Link href="/login?next=%2Fsaved" className="font-medium underline">
              להתחברות
            </Link>{" "}
            ואז אפשר להעביר את המקומות מהמכשיר לחשבון בעמוד ״המסגרות ששמרתי״.
          </Notice>
        )}
        {account && favs.length > 0 && (
          <Notice title="יש מקומות ששמרת במכשיר הזה">
            <Link href="/saved" className="font-medium underline">
              להעביר אותם לחשבון
            </Link>{" "}
            כדי שיופיעו גם כאן.
          </Notice>
        )}
      </div>
    </div>
  );
}

function nextStepText(id: string, answered: number, listed: number) {
  switch (id) {
    case "discover":
      return "כמה דקות של שאלות על מה שחשוב לך. אפשר לדלג, לחזור ולשנות.";
    case "shortlist":
      return answered ? "יש לך המלצות. כדאי לשמור את המקומות שמעניינים אותך, כדי לעקוב אחריהם כאן." : "כדאי לשמור כמה מקומות שמעניינים אותך.";
    case "explore":
      return listed ? "בחר מקום אחד מהרשימה, צור קשר ושאל על ביקור. אחר כך סמן ״יצרתי קשר״." : "כדאי ליצור קשר עם אחד המקומות.";
    case "compare":
      return "כשיש שני מקומות או יותר שבדקת, כדאי לשים אותם זה לצד זה.";
    case "apply":
      return "בדוק איך ומתי מגישים מועמדות למקומות שמתאימים לך, וסמן כשהגשת.";
    default:
      return "כשתקבל תשובה ותחליט, סמן ״זו הבחירה שלי״.";
  }
}

function PlaceCard({ place, onStage, onRemove }: { place: Place; onStage: (s: Stage) => void; onRemove: () => void }) {
  const { inst, stage } = place;
  const stages = stagesFor(inst.kind);
  const idx = stages.indexOf(stage);
  const action = nextActionFor(inst, stage);
  const chosen = stage === "chosen";
  return (
    <li className={`rounded-[28px] border bg-paper p-6 shadow-card ${chosen ? "border-teal-600 ring-2 ring-teal-600/20" : "border-sand-200"}`} data-place={inst.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-teal-700">{inst.typeLabel}</p>
          <h3 className="mt-1 font-display text-xl font-bold text-navy-950">
            <Link href={`/institutions/${inst.slug}`} className="underline-offset-4 hover:underline">
              {inst.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-stone-600">{inst.locationLabel}</p>
        </div>
        {chosen && <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-paper">הבחירה שלי</span>}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-navy-900">איפה אני עם המקום הזה?</legend>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {stages.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-teal-600" : "bg-sand-200"}`} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {stages.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === stage}
              onClick={() => onStage(s)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                s === stage ? "bg-navy-900 font-medium text-paper" : "border border-sand-300 text-navy-800 hover:bg-sand-100"
              }`}
            >
              {stageLabel(s, inst.kind)}
            </button>
          ))}
        </div>
      </fieldset>

      {action && (
        <div className="mt-5 rounded-2xl bg-sand-100/70 p-4">
          <p className="text-xs font-semibold text-stone-600">מה עכשיו</p>
          <ActionLine action={action} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <button type="button" onClick={() => onStage("dropped")} className="text-stone-600 underline underline-offset-4 hover:text-navy-900">
          לא ממשיך עם המקום הזה
        </button>
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-stone-600 underline underline-offset-4 hover:text-navy-900">
          <X className="size-3.5" aria-hidden="true" />
          הסרה מהרשימה
        </button>
      </div>
    </li>
  );
}

function ActionLine({ action }: { action: { text: string; href?: string } }) {
  const external = action.href?.startsWith("http");
  return (
    <p className="mt-1 leading-7 text-navy-900">
      {action.text}
      {action.href &&
        (external ? (
          <>
            {" "}
            <a href={action.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-700 underline underline-offset-4">
              לקישור
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(נפתח בלשונית חדשה)</span>
            </a>
          </>
        ) : (
          <>
            {" "}
            <Link href={action.href} className="font-medium text-teal-700 underline underline-offset-4">
              לקישור
            </Link>
          </>
        ))}
    </p>
  );
}

function ToolLink({ href, icon: Icon, title, text }: { href: string; icon: typeof ClipboardList; title: string; text: string }) {
  return (
    <Link href={href} className="group rounded-3xl border border-sand-200 bg-paper p-5 transition hover:-translate-y-0.5 hover:shadow-card">
      <Icon className="size-5 text-teal-700" aria-hidden="true" />
      <p className="mt-3 font-semibold text-navy-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
    </Link>
  );
}
