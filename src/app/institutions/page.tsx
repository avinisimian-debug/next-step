import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { PATHWAYS, type Pathway } from "@/lib/domain/types";
import { Location, VerificationBadge } from "@/components/institution/bits";

export const metadata: Metadata = {
  title: "כל המסגרות",
  description: "המסגרות והמסלולים שבמאגר של NEXT STEP — צה״ל, מכינות קדם־צבאיות, ישיבות הסדר וישיבות גבוהות — עם מקורות ותאריך אימות.",
};

export default async function InstitutionsIndex({ searchParams }: { searchParams: Promise<{ pathway?: string }> }) {
  const { pathway } = await searchParams;
  const active = PATHWAYS.includes(pathway as Pathway) ? (pathway as Pathway) : null;
  const all = await getRepository().listPublic();
  const list = active ? all.filter((i) => i.pathway === active) : all;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950">המסגרות במאגר</h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        המאגר כולל רק מסגרות שאת קיומן ופרטיהן הבסיסיים אימתנו ממקורות ציבוריים. זו אינה רשימה מלאה של כל המסגרות בארץ — היא
        תתרחב בהדרגה.
      </p>

      <nav aria-label="סינון לפי מסלול" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <FilterLink href="/institutions" active={!active}>
              הכול ({all.length})
            </FilterLink>
          </li>
          {PATHWAY_ORDER.map((p) => (
            <li key={p}>
              <FilterLink href={`/institutions?pathway=${p}`} active={active === p}>
                {PATHWAY_INFO[p].name} ({all.filter((i) => i.pathway === p).length})
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>

      {active && <p className="mt-6 max-w-3xl leading-7 text-navy-800">{PATHWAY_INFO[active].description}</p>}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-navy-900 text-paper" : "border border-sand-300 text-navy-900 hover:bg-sand-100"}`}
    >
      {children}
    </Link>
  );
}
