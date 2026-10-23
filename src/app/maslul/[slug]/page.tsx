import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import {
  PATHWAY_INFO,
  PATHWAY_ORDER,
  REGION_LABELS,
} from "@/lib/domain/pathways";
import { REGIONS, type Institution } from "@/lib/domain/types";
import { institutionQueryHref } from "@/lib/search/institutions";
import {
  PATHWAY_PAGES,
  SITE_URL,
  pathwayFromSlug,
  pathwayHref,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Dust } from "@/components/motion/Dust";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { PATHWAY_PHOTOS } from "@/lib/photos";
import { PhotoCredit, PhotoFrame } from "@/components/art/PhotoFrame";

export const revalidate = 300;

export function generateStaticParams() {
  return PATHWAY_ORDER.map((p) => ({ slug: PATHWAY_PAGES[p].slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const pathway = pathwayFromSlug((await params).slug);
  if (!pathway) return { title: "לא נמצא" };
  const page = PATHWAY_PAGES[pathway];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: pathwayHref(pathway) },
    openGraph: {
      title: page.title,
      description: page.description,
      url: pathwayHref(pathway),
    },
  };
}

export default async function PathwayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const pathway = pathwayFromSlug((await params).slug);
  if (!pathway) notFound();
  const page = PATHWAY_PAGES[pathway];
  const info = PATHWAY_INFO[pathway];
  const list = (await getRepository().listPublic()).filter(
    (i) => i.pathway === pathway,
  );
  const byRegion = REGIONS.map((r) => ({
    region: r,
    items: list.filter((i) => i.regions[0] === r),
  })).filter((g) => g.items.length);
  const others = PATHWAY_ORDER.filter((p) => p !== pathway);

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: page.h1,
          numberOfItems: list.length,
          itemListElement: list.map((i, n) => ({
            "@type": "ListItem",
            position: n + 1,
            name: i.name,
            url: `${SITE_URL}/institutions/${i.slug}`,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "הצעד הבא",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: info.name,
              item: `${SITE_URL}${pathwayHref(pathway)}`,
            },
          ],
        }}
      />
      {/* A cinematic opening: the pathway's photo behind night blue, light dust, and the title rising in. */}
      <header className="grain relative isolate overflow-hidden bg-night text-paper">
        <div className="absolute inset-0 -z-20 opacity-35">
          <div className="parallax absolute inset-0">
            <PhotoFrame
              photo={PATHWAY_PHOTOS[pathway]}
              credit={false}
              priority
              sizes="100vw"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/85 to-night/60"
        />
        <div
          aria-hidden="true"
          className="animate-glow absolute -end-32 -top-32 -z-10 size-[34rem] rounded-full bg-sky-500/25 blur-[110px]"
        />
        <Dust count={45} className="-z-10" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <p className="animate-rise text-sm font-semibold tracking-wide text-sky-300">
            {info.short} · {list.length} {page.noun} באתר
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            <span className="line">
              <span className="line-in animate-rise">
                {page.h1.split(":")[0]}
              </span>
            </span>
            <span className="sr-only">: </span>
            <span className="line text-sky-400">
              <span className="line-in animate-rise [animation-delay:150ms]">
                {page.h1.split(":")[1]?.trim()}
              </span>
            </span>
          </h1>
          <p className="animate-rise mt-6 max-w-3xl text-lg leading-8 text-mist-100 [animation-delay:300ms]">
            {info.description}
          </p>
          <div className="animate-rise mt-9 flex flex-col gap-3 [animation-delay:450ms] sm:flex-row sm:items-center">
            <Magnetic>
              <Link
                href="/questionnaire"
                className="shine group inline-flex w-full items-center justify-center gap-2 rounded-full bg-paper px-7 py-4 font-bold text-night shadow-[0_18px_50px_-12px_rgb(63_208_255/0.6)] sm:w-auto"
              >
                לשאלון שמתאים לך מסלול ומקום
                <ArrowLeft
                  className="size-5 transition-transform group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Magnetic>
            <Link
              href={institutionQueryHref({ pathway })}
              className="px-2 py-3 font-medium text-sky-300 underline underline-offset-4 hover:text-paper"
            >
              חיפוש וסינון ב{page.noun}
            </Link>
          </div>
        </div>
        <PhotoCredit
          photo={PATHWAY_PHOTOS[pathway]}
          className="bottom-2 end-3"
        />
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <h2 className="text-lg font-semibold text-navy-950">למי זה מתאים</h2>
          <ul className="mt-2 list-disc space-y-1 ps-6 leading-7 text-navy-800">
            {info.goodFor.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Reveal>

        <p className="mt-12 text-stone-600">
          באתר {list.length} {page.noun}. ליד כל מקום מופיעים המקורות ותאריך
          הבדיקה, ולפני החלטה כדאי לוודא את הפרטים מול המקום עצמו.
        </p>
        {byRegion.map(({ region, items }) => (
          <section
            key={region}
            aria-labelledby={`r-${region}`}
            className="mt-8"
          >
            <h2
              id={`r-${region}`}
              className="font-display text-2xl font-bold text-navy-950"
            >
              {page.noun} ב
              {REGION_LABELS[region] === "בכל הארץ"
                ? "כל הארץ"
                : REGION_LABELS[region]}
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {items.map((i: Institution) => (
                <li key={i.id}>
                  <Link
                    href={`/institutions/${i.slug}`}
                    className="block rounded-2xl border border-sand-200 bg-paper px-4 py-3 hover:border-navy-700"
                  >
                    <span className="block font-semibold text-navy-950">
                      {i.name}
                    </span>
                    <span className="block text-sm text-stone-600">
                      {i.locationLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <nav
          aria-label="מסלולים נוספים"
          className="mt-14 border-t border-sand-200 pt-8"
        >
          <h2 className="text-lg font-semibold text-navy-950">
            מסלולים נוספים אחרי י״ב
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {others.map((p) => (
              <li key={p}>
                <Link
                  href={pathwayHref(p)}
                  className="inline-block rounded-full bg-sand-100 px-4 py-2 text-navy-800 hover:bg-sand-200"
                >
                  {PATHWAY_PAGES[p].h1.split(":")[0]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
