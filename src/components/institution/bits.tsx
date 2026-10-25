"use client";

import { BadgeCheck, CircleDashed, ExternalLink, Heart, Mail, MapPin, Phone, Scale } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { useEffect, useState, useTransition } from "react";
import { KEYS, useStored } from "@/lib/client/store";
import { getSaveState, setSaved, type SaveState } from "@/app/actions/saved";
import { AUDIENCE_LABELS } from "@/lib/domain/pathways";
import { emphasisLabels } from "@/lib/domain/emphases";

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

export function VerificationBadge({ inst }: { inst: Institution }) {
  const verified = inst.verificationStatus === "verified";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${verified ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}
      title={inst.verificationNotes}
    >
      {verified ? <BadgeCheck className="size-3.5" aria-hidden="true" /> : <CircleDashed className="size-3.5" aria-hidden="true" />}
      {verified ? "אומת מול מקור רשמי" : "אומת חלקית"}
    </span>
  );
}

export function AudienceChip({ inst }: { inst: Institution }) {
  const a = inst.attributes.audience;
  if (a === "all") return null;
  return (
    <span className="inline-flex items-center rounded-full border border-sand-300 px-2.5 py-1 text-xs text-stone-600">
      {a === "unknown" ? "קהל היעד לא אומת" : `מיועד ${AUDIENCE_LABELS[a]}`}
    </span>
  );
}

export function ScoreRing({ score, size = 76 }: { score: number; size?: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className="stroke-sand-200" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-teal-600 transition-[stroke-dashoffset] duration-700"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-navy-950" aria-hidden="true">
          {score}
        </span>
      </span>
      <span className="sr-only">ציון התאמה להעדפות שציינת: {score} מתוך 100</span>
    </div>
  );
}

export function Location({ inst }: { inst: Institution }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
      <MapPin className="size-4 text-mist-500" aria-hidden="true" />
      {inst.locationLabel}
    </span>
  );
}

export function ContactBlock({ inst, compact = false }: { inst: Institution; compact?: boolean }) {
  const c = inst.contact;
  if (!c || (c.phone.length === 0 && !c.email && !c.address)) {
    return <p className="text-sm text-mist-500">פרטי קשר — המידע עדיין לא אומת.</p>;
  }
  return (
    <ul className={`space-y-1.5 text-sm text-navy-800 ${compact ? "" : "leading-7"}`}>
      {c.phone.map((p) => (
        <li key={p} className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
          <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="ltr inline-flex min-h-11 items-center hover:underline">
            {p}
          </a>
        </li>
      ))}
      {c.email && (
        <li className="flex items-center gap-2">
          <Mail className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
          <a href={`mailto:${c.email}`} className="ltr inline-flex min-h-11 items-center break-all hover:underline">
            {c.email}
          </a>
        </li>
      )}
      {c.address && !compact && (
        <li className="flex items-start gap-2">
          <MapPin className="mt-1.5 size-4 shrink-0 text-mist-500" aria-hidden="true" />
          <span>{c.address}</span>
        </li>
      )}
    </ul>
  );
}

export function OfficialLink({ inst, variant = "button" }: { inst: Institution; variant?: "button" | "link" }) {
  if (!inst.website) {
    return variant === "button" ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-sand-300 px-4 py-2.5 text-sm text-mist-500">
        האתר הרשמי טרם אומת
      </span>
    ) : null;
  }
  const host = new URL(inst.website).hostname.replace(/^www\./, "");
  return (
    <a
      href={inst.website}
      target="_blank"
      rel="noopener noreferrer"
      className={
        variant === "button"
          ? "inline-flex items-center gap-2 min-h-11 rounded-full border border-sand-300 px-4 py-2.5 text-sm font-medium text-navy-900 hover:bg-sand-100"
          : "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-teal-700 underline underline-offset-4"
      }
    >
      לאתר הרשמי
      <span className="ltr text-xs text-mist-500">{host}</span>
      <ExternalLink className="size-3.5" aria-hidden="true" />
      <span className="sr-only">(נפתח בלשונית חדשה)</span>
    </a>
  );
}

/**
 * Saves an institution. Signed-in visitors save to their account; everyone else saves on
 * this device only, and the button says so. The account state is loaded after mount so
 * pages stay cacheable.
 */
export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const [favs, setFavs] = useStored<string[]>(KEYS.favorites, []);
  const [state, setState] = useState<SaveState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [announced, setAnnounced] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    getSaveState(id)
      .then((s) => live && setState(s))
      .catch(() => live && setState({ mode: "local", canSignIn: false }));
    return () => {
      live = false;
    };
  }, [id]);

  const account = state?.mode === "account";
  const on = account ? state.saved : favs.includes(id);
  const savedLabel = account ? "נשמר בחשבון" : "נשמר במכשיר";

  const toggle = () => {
    setMessage(null);
    setAnnounced(true);
    if (!account) {
      setFavs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }
    startTransition(async () => {
      const res = await setSaved(id, !on).catch(() => ({ ok: false as const, message: "לא הצלחנו לשמור. אפשר לנסות שוב." }));
      if (res.ok) setState({ mode: "account", saved: res.saved });
      else setMessage(res.message);
    });
  };

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        disabled={pending || state === null}
        onClick={toggle}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${on ? "bg-rose-50 text-rose-700" : "text-navy-800 hover:bg-sand-100"}`}
        aria-label={on ? `${savedLabel}, הסרה מהשמורים: ${name}` : `שמירה: ${name}`}
      >
        <Heart className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden="true" />
        {on ? savedLabel : "שמירה"}
      </button>
      <span aria-live="polite" className="px-4 text-xs text-stone-600">
        {announced && !message && (
          <span className="sr-only">{on ? `${name} ${savedLabel}` : `${name} הוסר מהשמורים`}</span>
        )}
        {message ? (
          <span className="text-rose-700">{message}</span>
        ) : on && state?.mode === "local" && state.canSignIn ? (
          <a href={`/login?next=${encodeURIComponent("/saved")}`} className="underline">
            להתחבר כדי לשמור בחשבון
          </a>
        ) : null}
      </span>
    </span>
  );
}

export const MAX_COMPARE = 3;

export function CompareButton({ id, name }: { id: string; name: string }) {
  const [list, setList] = useStored<string[]>(KEYS.compare, []);
  const on = list.includes(id);
  const full = !on && list.length >= MAX_COMPARE;
  const [announced, setAnnounced] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={full}
        title={full ? "אפשר להשוות עד שלוש מסגרות" : undefined}
        onClick={() => {
          setAnnounced(true);
          setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-MAX_COMPARE)));
        }}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${on ? "bg-teal-100 text-teal-700" : "text-navy-800 hover:bg-sand-100"}`}
        aria-label={on ? `בהשוואה, הסרה מההשוואה: ${name}` : `השוואה, הוספה להשוואה: ${name}`}
      >
        <Scale className="size-4" aria-hidden="true" />
        {on ? "בהשוואה" : "השוואה"}
      </button>
      <span aria-live="polite" className="sr-only">
        {announced && (on ? `${name} נוסף להשוואה (${list.length} מתוך ${MAX_COMPARE})` : `${name} הוסר מההשוואה`)}
      </span>
    </>
  );
}

/** What the institution stresses in its own description of itself, as chips. */
export function EmphasisChips({ inst, label, tone = "light" }: { inst: Institution; label: string; tone?: "light" | "dark" }) {
  const labels = emphasisLabels(inst);
  if (labels.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {labels.map((l) => (
        <li
          key={l}
          className={
            tone === "dark"
              ? "rounded-full border border-sky-300/30 bg-sky-300/10 px-3.5 py-1.5 text-sm font-medium text-sky-300 shadow-[0_0_24px_-8px_rgb(63_208_255/0.5)]"
              : "rounded-full bg-teal-100 px-3 py-1.5 text-sm text-teal-700"
          }
        >
          {l}
        </li>
      ))}
    </ul>
  );
}

/** The institution's self-description with its source. Says plainly that this is the place's own view. */
export function SelfDescriptionSection({ inst }: { inst: Institution }) {
  const self = inst.selfDescription;
  if (!self) return null;
  const who = inst.pathway === "hesder" || inst.pathway === "yeshiva" ? "הישיבה" : "המקום";
  return (
    <section
      aria-labelledby="h-self"
      className="grain relative isolate overflow-hidden rounded-[28px] bg-night p-7 text-paper shadow-lift sm:p-10"
    >
      <div aria-hidden="true" className="absolute -start-24 -top-24 -z-10 size-72 rounded-full bg-sky-500/20 blur-[90px]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 end-5 -z-10 select-none font-display text-[10rem] leading-none text-sky-400/15"
      >
        ״
      </span>
      <h2 id="h-self" className="text-sm font-semibold tracking-wide text-sky-300">
        כך {who} מציגה את עצמה
      </h2>
      <p className="mt-4 font-display text-xl leading-9 text-paper sm:text-2xl sm:leading-10">{self.summary}</p>
      <p className="mt-6 border-t border-paper/10 pt-4 text-sm leading-6 text-mist-300">
        סיכום שלנו מתוך{" "}
        <a href={self.source.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-4 hover:text-paper">
          {self.source.label}
          <span className="sr-only"> (נפתח בלשונית חדשה)</span>
        </a>
        , נבדק ב־<time dateTime={self.checkedOn}>{formatDate(self.checkedOn)}</time>. זה התיאור של {who} על עצמה, לא בדיקה שלנו,
        ולכן כדאי לבקר בשבת או בשבוע ישיבה ולהרגיש בעצמך.
      </p>
    </section>
  );
}
