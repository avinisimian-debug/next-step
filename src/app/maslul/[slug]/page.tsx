import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO, PATHWAY_ORDER, REGION_LABELS } from "@/lib/domain/pathways";
import { REGIONS, type Institution } from "@/lib/domain/types";
import { institutionQueryHref } from "@/lib/search/institutions";
import { PATHWAY_PAGES, SITE_URL, pathwayFromSlug, pathwayHref } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

export function generateStaticParams() {
  return PATHWAY_ORDER.map((p) => ({ slug: PATHWAY_PAGES[p].slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const pathway = pathwayFromSlug((await params).slug);
  if (!pathway) return { title: "לא נמצא" };
  const page = PATHWAY_PAGES[pathway];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: pathwayHref(pathway) },
    openGraph: { title: page.title, description: page.description, url: pathwayHref(pathway) },
  };
}

export default async function PathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const pathway = pathwayFromSlug((await params).slug);
  if (!pathway) notFound();
  const page = PATHWAY_PAGES[pathway];
  const info = PATHWAY_INFO[pathway];
  const list = (await getRepository().listPublic()).filter((i) => i.pathway === pathway);
  const byRegion = REGIONS.map((r) => ({ region: r, items: list.filter((i) => i.regions[0] === r) })).filter((g) => g.items.length);
  const others = PATHWAY_ORDER.filter((p) => p !== pathway);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: page.h1,
          numberOfItems: list.length,
          itemListElement: list.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: i.name, url: `${SITE_URL}/institutions/${i.slug}` })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "הצעד הבא", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: info.name, item: `${SITE_URL}${pathwayHref(pathway)}` },
          ],
        }}
      />
      <h1 className="font-display text-4xl font-bold leading-tight text-navy-950 sm:text-5xl">{page.h1}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-navy-800">{info.description}</p>
      <h2 className="mt-8 text-lg font-semibold text-navy-950">למי זה מתאים</h2>
      <ul className="mt-2 list-disc space-y-1 ps-6 leading-7 text-navy-800">
        {info.goodFor.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/questionnaire"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-6 py-3.5 font-semibold text-paper hover:bg-navy-800"
        >
          לשאלון שמתאים לך מסלול ומקום
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <Link href={institutionQueryHref({ pathway })} className="px-2 py-3 font-medium text-navy-800 underline underline-offset-4">
          חיפוש וסינון ב{page.noun}
        </Link>
      </div>

      <p className="mt-12 text-stone-600">
        באתר {list.length} {page.noun}. ליד כל מקום מופיעים המקורות ותאריך הבדיקה, ולפני החלטה כדאי לוודא את הפרטים מול המקום עצמו.
      </p>
      {byRegion.map(({ region, items }) => (
        <section key={region} aria-labelledby={`r-${region}`} className="mt-8">
          <h2 id={`r-${region}`} className="font-display text-2xl font-bold text-navy-950">
            {page.noun} ב{REGION_LABELS[region] === "בכל הארץ" ? "כל הארץ" : REGION_LABELS[region]}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((i: Institution) => (
              <li key={i.id}>
                <Link
                  href={`/institutions/${i.slug}`}
                  className="block rounded-2xl border border-sand-200 bg-paper px-4 py-3 hover:border-navy-700"
                >
                  <span className="block font-semibold text-navy-950">{i.name}</span>
                  <span className="block text-sm text-stone-600">{i.locationLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <nav aria-label="מסלולים נוספים" className="mt-14 border-t border-sand-200 pt-8">
        <h2 className="text-lg font-semibold text-navy-950">מסלולים נוספים אחרי י״ב</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {others.map((p) => (
            <li key={p}>
              <Link href={pathwayHref(p)} className="inline-block rounded-full bg-sand-100 px-4 py-2 text-navy-800 hover:bg-sand-200">
                {PATHWAY_PAGES[p].h1.split(":")[0]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
