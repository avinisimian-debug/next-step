import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import {
  AudienceChip,
  CompareButton,
  ContactBlock,
  FavoriteButton,
  Location,
  OfficialLink,
  SelfDescriptionSection,
  VerificationBadge,
} from "@/components/institution/bits";
import { PersonalFit } from "@/components/institution/PersonalFit";
import { DURATION_LABELS, INTENSITY_LABELS, MILITARY_MODEL_LABELS, PATHWAY_INFO } from "@/lib/domain/pathways";
import type { Pathway } from "@/lib/domain/types";
import { SITE_URL, pathwayHref } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

const NOT_VERIFIED = "המידע עדיין לא אומת";

export async function generateStaticParams() {
  return (await getRepository().listPublic()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const inst = await getRepository().getPublicBySlug((await params).slug);
  if (!inst) return { title: "לא נמצא" };
  const path = `/institutions/${inst.slug}`;
  return {
    title: `${inst.name}: ${inst.typeLabel}`,
    description: inst.shortDescription,
    alternates: { canonical: path },
    openGraph: { title: inst.name, description: inst.shortDescription, url: path },
  };
}

// A tint per pathway instead of a photo: a stock photo here would read as a picture of this specific place.
const HEADER_TINT: Record<Pathway, string> = {
  idf: "from-[#e4e8d6] via-sand-100",
  mechina: "from-[#f3e2c9] via-sand-100",
  hesder: "from-[#dbe7e2] via-sand-100",
  yeshiva: "from-[#dfe6f0] via-sand-100",
  national_service: "from-[#f0e0e4] via-sand-100",
  midrasha: "from-[#e8e1f0] via-sand-100",
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
  const unknown = sections.filter((s) => isUnverified(s.body));

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
      <header className="relative overflow-hidden border-b border-sand-200">
        <div className={`absolute inset-0 bg-gradient-to-bl ${HEADER_TINT[inst.pathway]} to-paper`} aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
          <Link href="/results" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 hover:underline">
            <ArrowRight className="size-4" aria-hidden="true" />
            חזרה להמלצות
          </Link>
          <p className="mt-6 text-sm font-semibold text-teal-700">
            <Link href={pathwayHref(inst.pathway)} className="underline-offset-4 hover:underline">
              {PATHWAY_INFO[inst.pathway].name}
            </Link>{" "}
            · {inst.typeLabel}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-navy-950 sm:text-5xl">{inst.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Location inst={inst} />
            <VerificationBadge inst={inst} />
            <AudienceChip inst={inst} />
          </div>
          {/* A directory record's short text is its self-description, shown in full in its own section below. */}
          {inst.shortDescription !== inst.selfDescription?.summary && (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-navy-800">{inst.shortDescription}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <OfficialLink inst={inst} />
            <CompareButton id={inst.id} name={inst.name} />
            <FavoriteButton id={inst.id} name={inst.name} />
          </div>
        </div>
      </header>

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
                className="mt-4 inline-flex text-sm font-medium text-teal-700 underline underline-offset-4"
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
              <Link href={`/community?institution=${encodeURIComponent(inst.id)}`} className="text-teal-700 underline-offset-4 hover:underline">
                שאלות על {inst.name}
              </Link>
              <Link href={`/community/ask?institution=${encodeURIComponent(inst.id)}`} className="text-teal-700 underline-offset-4 hover:underline">
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
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-teal-700 hover:underline">
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
