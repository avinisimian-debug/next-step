import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import {
  AudienceChip,
  CompareButton,
  ContactBlock,
  EmphasisChips,
  FavoriteButton,
  Location,
  OfficialLink,
  SelfDescriptionSection,
  VerificationBadge,
} from "@/components/institution/bits";
import { PersonalFit } from "@/components/institution/PersonalFit";
import { DURATION_LABELS, INTENSITY_LABELS, MILITARY_MODEL_LABELS, PATHWAY_INFO } from "@/lib/domain/pathways";
import type { Pathway } from "@/lib/domain/types";
import { OG_IMAGE, SITE_URL, pathwayHref } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Dust } from "@/components/motion/Dust";

export const revalidate = 300;

const NOT_VERIFIED = "המידע עדיין לא אומת";

export async function generateStaticParams() {
  return (await getRepository().listPublic()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const inst = await getRepository().getPublicBySlug((await params).slug);
  if (!inst) return { title: "הדף לא נמצא" };
  const path = `/institutions/${inst.slug}`;
  return {
    title: `${inst.name}: ${inst.typeLabel}`,
    description: inst.shortDescription,
    alternates: { canonical: path },
    openGraph: { title: inst.name, description: inst.shortDescription, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}

// A glow per pathway instead of a photo: a stock photo here would read as a picture of this specific place.
const HEADER_GLOW: Record<Pathway, string> = {
  idf: "from-[#26361f]",
  mechina: "from-[#3a2a17]",
  hesder: "from-[#123a3a]",
  yeshiva: "from-[#14284a]",
  national_service: "from-[#3a1a2a]",
  midrasha: "from-[#2a1f45]",
};

export default async function InstitutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const inst = await getRepository().getPublicBySlug((await params).slug);
  if (!inst) notFound();
  const p = inst.profile;

  const sections: { id: string; title: string; body?: string }[] = [
    { id: "overview", title: "סקירה", body: p.overview },
    { id: "philosophy", title: "גישה חינוכית", body: p.philosophy },
    { id: "structure", title: "מבנה התוכנית", body: p.programStructure },
    { id: "routine", title: "סדר יום", body: p.dailyRoutine },
    { id: "military", title: inst.pathway === "mechina" ? "הכנה לשירות" : "שילוב השירות הצבאי", body: p.militaryIntegration },
    { id: "living", title: "מיקום ומגורים", body: [inst.locationLabel, p.livingArrangements].filter(Boolean).join(". ") },
    { id: "admissions", title: "תהליך קבלה", body: p.admissions },
    { id: "financial", title: "עלויות וסיוע כלכלי", body: p.financial },
  ];
  // Sections with nothing verified are listed together instead of repeating "not verified" under each heading.
  const isUnverified = (body?: string) => !body || body.replace(/[\s.—-]|מיקום/g, "") === NOT_VERIFIED.replace(/\s/g, "");
  const known = sections.filter((s) => !isUnverified(s.body));
  // A self-description covers the educational approach, in the place's own words.
  const unknown = sections.filter((s) => isUnverified(s.body) && !(s.id === "philosophy" && inst.selfDescription));

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: inst.name,
          description: inst.shortDescription,
          url: `${SITE_URL}/institutions/${inst.slug}`,
          ...(inst.website ? { sameAs: [inst.website] } : {}),
          // Only a location a source states; the "not verified" placeholder is left out.
          ...(inst.locationLabel.includes(NOT_VERIFIED)
            ? {}
            : { address: { "@type": "PostalAddress", addressLocality: inst.locationLabel, addressCountry: "IL" } }),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "הצעד הבא", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: PATHWAY_INFO[inst.pathway].name, item: `${SITE_URL}${pathwayHref(inst.pathway)}` },
            { "@type": "ListItem", position: 3, name: inst.name, item: `${SITE_URL}/institutions/${inst.slug}` },
          ],
        }}
      />
      {/* Night-blue opening like the pathway pages, without a photo: a stock photo would read as this specific place. */}
      <header className="grain relative isolate overflow-hidden bg-night text-paper">
        <div aria-hidden="true" className={`absolute inset-0 -z-20 bg-gradient-to-bl ${HEADER_GLOW[inst.pathway]} via-night to-night`} />
        <div
          aria-hidden="true"
          className="animate-glow absolute -end-40 -top-40 -z-10 size-[36rem] rounded-full bg-sky-500/20 blur-[120px]"
        />
        <Dust count={36} className="-z-10" />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
          <Link href="/results" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-mist-100 hover:text-paper hover:underline">
            <ArrowRight className="size-4" aria-hidden="true" />
            חזרה להמלצות
          </Link>
          <p className="animate-rise mt-8 text-sm font-semibold tracking-wide text-sky-300">
            <Link href={pathwayHref(inst.pathway)} className="underline-offset-4 hover:underline">
              {PATHWAY_INFO[inst.pathway].name}
            </Link>{" "}
            · {inst.typeLabel}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
            <span className="line">
              <span className="line-in animate-rise [animation-delay:120ms]">{inst.name}</span>
            </span>
          </h1>
          {/* A directory record's short text is its self-description, shown in full in its own section below. */}
          {inst.shortDescription !== inst.selfDescription?.summary && (
            <p className="animate-rise mt-6 max-w-3xl text-lg leading-8 text-mist-100 [animation-delay:240ms]">{inst.shortDescription}</p>
          )}
          {inst.selfDescription && inst.selfDescription.emphases.length > 0 && (
            <div className="animate-rise mt-8 [animation-delay:300ms]">
              <p className="text-xs font-semibold tracking-wide text-mist-300">מה הישיבה מדגישה, במילים שלה</p>
              <div className="mt-3">
                <EmphasisChips inst={inst} label="מה הישיבה מדגישה" tone="dark" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* The facts and actions float on a paper bar over the header's edge. */}
      <div className="relative z-10 mx-auto -mt-14 max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-sand-200 bg-paper/95 p-5 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Location inst={inst} />
            <VerificationBadge inst={inst} />
            <AudienceChip inst={inst} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OfficialLink inst={inst} />
            <CompareButton id={inst.id} name={inst.name} />
            <FavoriteButton id={inst.id} name={inst.name} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <SelfDescriptionSection inst={inst} />

          <PersonalFit inst={inst} />

          {inst.highlights.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="דגשים">
              {inst.highlights.map((h) => (
                <li key={h} className="rounded-full bg-sand-100 px-3 py-1.5 text-sm text-navy-800">
                  {h}
                </li>
              ))}
            </ul>
          )}

          {known.map((s) => (
            <section key={s.id} aria-labelledby={`h-${s.id}`}>
              <h2 id={`h-${s.id}`} className="font-display text-2xl font-bold text-navy-950">
                {s.title}
              </h2>
              <p className="mt-3 leading-8 text-navy-800">{s.body}</p>
            </section>
          ))}

          {unknown.length > 0 && (
            <section aria-labelledby="h-unknown" className="rounded-3xl border border-dashed border-sand-300 bg-sand-50 p-6">
              <h2 id="h-unknown" className="font-display text-xl font-bold text-navy-950">
                מה עוד לא אומת
              </h2>
              <p className="mt-2 leading-7 text-stone-600">
                על הנושאים האלה עדיין אין לנו מידע ממקור שבדקנו, ולכן לא כתבנו עליהם כלום. כדאי לשאול את המוסד ישירות, או מי שכבר
                היה שם.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="נושאים שלא אומתו">
                {unknown.map((s) => (
                  <li key={s.id} className="rounded-full border border-sand-300 bg-paper px-3 py-1.5 text-sm text-navy-800">
                    {s.title}
                  </li>
                ))}
              </ul>
              <Link
                href={`/community/ask?institution=${encodeURIComponent(inst.id)}`}
                className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal-700 underline underline-offset-4"
              >
                לשאול בקהילה על {inst.name}
              </Link>
            </section>
          )}

          {inst.limitations.length > 0 && (
            <section aria-labelledby="h-limits">
              <h2 id="h-limits" className="font-display text-2xl font-bold text-navy-950">
                חשוב לדעת
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 leading-7 text-navy-800">
                {inst.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          )}

          {p.faq.length > 0 && (
            <section aria-labelledby="h-faq">
              <h2 id="h-faq" className="font-display text-2xl font-bold text-navy-950">
                שאלות נפוצות
              </h2>
              <div className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200">
                {p.faq.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none font-medium text-navy-950 marker:hidden">
                      {f.q}
                    </summary>
                    <p className="mt-2 leading-7 text-navy-800">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-sand-200 bg-paper p-6 shadow-card">
            <h2 className="text-sm font-semibold text-navy-950">במבט מהיר</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="לימוד תורה" value={INTENSITY_LABELS[inst.attributes.torahIntensity]} />
              <Row label="שירות צבאי" value={MILITARY_MODEL_LABELS[inst.attributes.militaryModel]} />
              <Row label="משך" value={DURATION_LABELS[inst.attributes.duration]} />
              <Row label="מגורים" value={inst.attributes.residential === "residential" ? "מגורים במקום" : "משתנה"} />
            </dl>
            <p className="mt-4 text-xs leading-5 text-mist-500">
              ״במבט מהיר״ הוא סיווג של המערכת לצורך התאמה, על בסיס המקורות שלמטה — ולא נתון רשמי של המוסד.
            </p>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-paper p-6">
            <h2 className="mb-3 text-sm font-semibold text-navy-950">יצירת קשר</h2>
            <ContactBlock inst={inst} />
            <div className="mt-4">
              <OfficialLink inst={inst} variant="link" />
            </div>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-paper p-6">
            <h2 className="text-sm font-semibold text-navy-950">שאלות בקהילה</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              תשובות בקהילה הן ניסיון אישי של משתמשים, אלא אם מסומנות כתשובה רשמית של נציג מאומת.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
              <Link href={`/community?institution=${encodeURIComponent(inst.id)}`} className="inline-flex min-h-11 items-center text-teal-700 underline-offset-4 hover:underline">
                שאלות על {inst.name}
              </Link>
              <Link href={`/community/ask?institution=${encodeURIComponent(inst.id)}`} className="inline-flex min-h-11 items-center text-teal-700 underline-offset-4 hover:underline">
                לשאול שאלה
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-sand-100/50 p-6">
            <h2 className="text-sm font-semibold text-navy-950">מקורות ואימות</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{inst.verificationNotes}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {inst.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 py-1.5 text-teal-700 hover:underline">
                    <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-mist-500">
              נבדק לאחרונה: <time dateTime={inst.lastVerified}>{new Date(inst.lastVerified).toLocaleDateString("he-IL")}</time>
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-600">{label}</dt>
      <dd className="text-end font-medium text-navy-950">{value}</dd>
    </div>
  );
}
