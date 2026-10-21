import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import { AUDIENCE_LABELS, PATHWAY_INFO, PATHWAY_ORDER, REGION_LABELS } from "@/lib/domain/pathways";
import { REGIONS } from "@/lib/domain/types";
import {
  AUDIENCE_FILTERS,
  institutionQueryHref,
  isFiltered,
  parseInstitutionQuery,
  searchInstitutions,
} from "@/lib/search/institutions";
import { Location, VerificationBadge } from "@/components/institution/bits";

export const metadata: Metadata = {
  title: "חיפוש מסגרות",
  description: "חיפוש במסגרות ובמסלולים שבמאגר של NEXT STEP — צה״ל, מכינות קדם־צבאיות, ישיבות הסדר וישיבות גבוהות — עם מקורות ותאריך אימות.",
};

const field =
  "w-full rounded-2xl border border-sand-300 bg-paper px-4 py-3 text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

export default async function InstitutionsIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseInstitutionQuery(await searchParams);
  const all = await getRepository().listPublic();
  const list = searchInstitutions(all, query);
  const filtered = isFiltered(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950">חיפוש מסגרות</h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        המאגר כולל רק מסגרות שאת קיומן ופרטיהן הבסיסיים אימתנו ממקורות ציבוריים. זו אינה רשימה מלאה של כל המסגרות בארץ — היא
        תתרחב בהדרגה.
      </p>

      <form role="search" action="/institutions" method="get" className="mt-8 rounded-3xl border border-sand-200 bg-sand-50 p-5">
        <label htmlFor="q" className="block text-sm font-medium text-navy-900">
          חיפוש לפי שם, מקום או תיאור
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-stone-500" aria-hidden="true" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q}
            maxLength={100}
            placeholder="למשל: ירושלים, הסדר, עין פרת"
            className={`${field} pr-12`}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select id="pathway" label="מסלול" value={query.pathway ?? ""}>
            <option value="">כל המסלולים</option>
            {PATHWAY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PATHWAY_INFO[p].name}
              </option>
            ))}
          </Select>
          <Select id="region" label="אזור" value={query.region ?? ""}>
            <option value="">כל האזורים</option>
            {REGIONS.filter((r) => r !== "nationwide").map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select id="audience" label="מיועד" value={query.audience ?? ""}>
            <option value="">לכולם</option>
            {AUDIENCE_FILTERS.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a]}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <label className="flex min-h-12 items-center gap-3 text-sm text-navy-900">
              <input type="checkbox" name="verified" value="1" defaultChecked={query.verifiedOnly} className="size-5 accent-teal-700" />
              רק רשומות מאומתות במלואן
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-medium text-paper transition hover:bg-navy-800"
          >
            <Search className="size-4" aria-hidden="true" />
            חיפוש
          </button>
          {filtered && (
            <Link href="/institutions" className="inline-flex items-center gap-1 text-sm font-medium text-navy-800 underline-offset-4 hover:underline">
              <X className="size-4" aria-hidden="true" />
              ניקוי הסינון
            </Link>
          )}
        </div>
        {query.region && (
          <p className="mt-3 text-xs leading-5 text-stone-600">מסלולי שירות שפועלים בכל הארץ מופיעים בכל אזור.</p>
        )}
        {query.audience && (
          <p className="mt-1 text-xs leading-5 text-stone-600">
            מסגרות שקהל היעד שלהן לא אומת נשארות ברשימה — כדאי לברר ישירות.
          </p>
        )}
      </form>

      <nav aria-label="מעבר מהיר לפי מסלול" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {PATHWAY_ORDER.map((p) => (
            <li key={p}>
              <Link
                href={institutionQueryHref({ ...query, pathway: query.pathway === p ? null : p })}
                aria-current={query.pathway === p ? "page" : undefined}
                className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${query.pathway === p ? "bg-navy-900 text-paper" : "border border-sand-300 text-navy-900 hover:bg-sand-100"}`}
              >
                {PATHWAY_INFO[p].name} ({all.filter((i) => i.pathway === p).length})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {query.pathway && <p className="mt-6 max-w-3xl leading-7 text-navy-800">{PATHWAY_INFO[query.pathway].description}</p>}

      <p role="status" className="mt-8 text-sm font-medium text-navy-900">
        {list.length === 0 ? "לא נמצאו מסגרות" : list.length === 1 ? "נמצאה מסגרת אחת" : `נמצאו ${list.length} מסגרות`}
        {filtered && list.length > 0 && ` מתוך ${all.length}`}
      </p>

      {list.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-sand-300 p-8 text-center">
          <p className="font-display text-xl font-bold text-navy-950">אין במאגר מסגרת שמתאימה לחיפוש הזה</p>
          <p className="mx-auto mt-2 max-w-xl leading-7 text-stone-600">
            ייתכן שהמסגרת קיימת אבל עדיין לא נוספה או לא אומתה. אפשר לנסות מילה אחרת, להסיר חלק מהסינון, או לשאול בקהילה.
          </p>
          <Link href="/institutions" className="mt-4 inline-flex rounded-full border border-navy-900 px-5 py-2 text-sm font-medium text-navy-900 hover:bg-sand-100">
            להצגת כל המסגרות
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => (
            <li key={i.id}>
              <Link
                href={`/institutions/${i.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-sand-200 bg-paper p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <p className="text-xs font-medium text-teal-700">{i.typeLabel}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-navy-950">{i.name}</h2>
                <div className="mt-2">
                  <Location inst={i} />
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-navy-800">{i.shortDescription}</p>
                <div className="mt-4 flex items-center justify-between">
                  <VerificationBadge inst={i} />
                  <ArrowLeft className="size-4 text-navy-700 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({ id, label, value, children }: { id: string; label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy-900">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value} className={`${field} mt-2`}>
        {children}
      </select>
    </div>
  );
}
