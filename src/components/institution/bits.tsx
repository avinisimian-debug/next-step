"use client";

import { BadgeCheck, CircleDashed, ExternalLink, Heart, Mail, MapPin, Phone, Scale } from "lucide-react";
import type { Institution } from "@/lib/domain/types";
import { KEYS, useStored } from "@/lib/client/store";
import { AUDIENCE_LABELS } from "@/lib/domain/pathways";

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
          <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="ltr hover:underline">
            {p}
          </a>
        </li>
      ))}
      {c.email && (
        <li className="flex items-center gap-2">
          <Mail className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
          <a href={`mailto:${c.email}`} className="ltr break-all hover:underline">
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
          ? "inline-flex items-center gap-2 rounded-full border border-sand-300 px-4 py-2.5 text-sm font-medium text-navy-900 hover:bg-sand-100"
          : "inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 underline underline-offset-4"
      }
    >
      לאתר הרשמי
      <span className="ltr text-xs text-mist-500">{host}</span>
      <ExternalLink className="size-3.5" aria-hidden="true" />
      <span className="sr-only">(נפתח בלשונית חדשה)</span>
    </a>
  );
}

export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const [favs, setFavs] = useStored<string[]>(KEYS.favorites, []);
  const on = favs.includes(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setFavs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${on ? "bg-rose-50 text-rose-700" : "text-navy-800 hover:bg-sand-100"}`}
      aria-label={on ? `הסרה מהמועדפים: ${name}` : `שמירה למועדפים: ${name}`}
    >
      <Heart className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden="true" />
      {on ? "נשמר" : "שמור למועדפים"}
    </button>
  );
}

export const MAX_COMPARE = 3;

export function CompareButton({ id, name }: { id: string; name: string }) {
  const [list, setList] = useStored<string[]>(KEYS.compare, []);
  const on = list.includes(id);
  const full = !on && list.length >= MAX_COMPARE;
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={full}
      title={full ? "אפשר להשוות עד שלוש מסגרות" : undefined}
      onClick={() => setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-MAX_COMPARE)))}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${on ? "bg-teal-100 text-teal-700" : "text-navy-800 hover:bg-sand-100"}`}
      aria-label={on ? `הסרה מההשוואה: ${name}` : `הוספה להשוואה: ${name}`}
    >
      <Scale className="size-4" aria-hidden="true" />
      {on ? "בהשוואה" : "השוואה"}
    </button>
  );
}
