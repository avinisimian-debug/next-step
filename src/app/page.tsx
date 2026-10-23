import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Scale, ShieldCheck, Sparkles, Eye } from "lucide-react";
import { PhotoCredit, PhotoFrame } from "@/components/art/PhotoFrame";
import { PATHWAY_PHOTOS } from "@/lib/photos";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { getRepository } from "@/lib/data/repository";
import { HomeJourney } from "@/components/journey/HomeJourney";
import { ResumeLink } from "@/components/journey/ResumeLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { CountUp } from "@/components/motion/CountUp";
import { PATHWAY_PAGES, SITE_NAME, SITE_URL, pathwayHref } from "@/lib/seo";
import hero from "@/assets/brand/hero.webp";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const WHY = [
  { icon: Sparkles, title: "התאמה אישית לפי ההעדפות שלך", text: "לא לפי מי שמפרסם יותר. כל מוסד נבחן לפי אותם קריטריונים." },
  { icon: Eye, title: "היכרות עם אפשרויות שאולי לא הכרת", text: "ההמלצות מגוונות בין מסלולים כשאתה פתוח לכמה כיוונים." },
  { icon: Scale, title: "השוואה ברורה בין מסגרות", text: "רואים את ההבדלים במקום אחד, גם בטלפון." },
  { icon: ShieldCheck, title: "גם יתרונות וגם נקודות לבדיקה", text: "כל המלצה מציגה מה עלול לא להתאים ומה עוד לא אומת." },
];

const CYCLE = ["מכינה", "ישיבת הסדר", "ישיבה גבוהה", "צה״ל"];

/** Splits a line into words that rise in one after another (see .word in globals.css). */
function Words({ text, from = 0, className = "" }: { text: string; from?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className={`word ${className}`} style={{ "--i": from + i } as React.CSSProperties}>
            {w}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export default async function Home() {
  const all = await getRepository().listPublic();
  const count = (p: (typeof PATHWAY_ORDER)[number]) => all.filter((i) => i.pathway === p).length;
  // Two rows of real names from the catalog for the moving band.
  const names = all.filter((i) => i.pathway !== "idf").map((i) => i.name.replace(/^ישיבת ההסדר /, "ישיבת "));
  const rows = [names.filter((_, i) => i % 2 === 0), names.filter((_, i) => i % 2 === 1)];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          inLanguage: "he",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/institutions?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* Hero: night, a lit doorway, and the path toward it. */}
      <Spotlight className="relative isolate overflow-hidden bg-night text-paper">
        <section aria-labelledby="h-hero">
          <div className="spotlight-layer" aria-hidden="true" />
          {/* Fine grid that fades out from the centre. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgb(127_220_255/0.25)_1px,transparent_1px),linear-gradient(90deg,rgb(127_220_255/0.25)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_40%,#000_10%,transparent_65%)]"
          />
          <div aria-hidden="true" className="animate-glow absolute -end-40 top-0 -z-10 size-[42rem] rounded-full bg-sky-500/25 blur-[120px]" />
          <div aria-hidden="true" className="animate-glow absolute -start-20 bottom-[-10rem] -z-10 size-[30rem] rounded-full bg-dawn/10 blur-[110px] [animation-delay:-3s]" />

          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-12 sm:px-6 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-10">
            <div className="relative z-10">
              <p className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-sm text-sky-300 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60" aria-hidden="true" />
                  <span className="relative inline-flex size-2 rounded-full bg-sky-400" aria-hidden="true" />
                </span>
                לבוגרי י״ב ולתלמידי י״א–י״ב
              </p>
              <h1 id="h-hero" className="font-display text-[3.1rem] font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.4rem]">
                <Words text="הצעד" />
                <span className="word bg-gradient-to-l from-sky-300 via-sky-400 to-sky-500 bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_rgb(63_208_255/0.45))]" style={{ "--i": 1 } as React.CSSProperties}>
                  הבא
                </span>{" "}
                <Words text="שלך" from={2} />
                <br />
                <Words text="מתחיל כאן." from={3} className="text-mist-300" />
              </h1>

              <p className="animate-rise mt-7 font-display text-2xl text-mist-100 [animation-delay:550ms] sm:text-3xl">
                <span className="sr-only">צה״ל, מכינה, ישיבת הסדר או ישיבה גבוהה?</span>
                <span aria-hidden="true">
                  אולי{" "}
                  <span className="relative inline-flex h-[1.5em] overflow-hidden align-bottom">
                    <span className="animate-cycle flex flex-col font-bold text-paper">
                      {CYCLE.map((w) => (
                        <span key={w} className="h-[1.5em] leading-[1.5em]">
                          {w}?
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </p>
              <p className="animate-rise mt-4 max-w-xl text-lg leading-8 text-mist-100 [animation-delay:650ms]">
                הדרך הנכונה מתחילה בהיכרות עם עצמך. כמה שאלות קצרות, ונמצא יחד את המסלולים והמקומות שהכי מתאימים לך.
              </p>

              <div className="animate-rise mt-9 flex flex-col gap-3 [animation-delay:750ms] sm:flex-row sm:items-center">
                <Link
                  href="/questionnaire"
                  className="shine group inline-flex items-center justify-center gap-2 rounded-full bg-paper px-8 py-4 text-base font-bold text-night shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_18px_50px_-12px_rgb(63_208_255/0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(255_255_255/0.3),0_24px_60px_-10px_rgb(63_208_255/0.75)]"
                >
                  בוא נמצא את המסלול שלך
                  <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/questionnaire?mode=explore"
                  className="inline-flex items-center justify-center rounded-full border border-paper/20 px-6 py-4 text-base font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/5"
                >
                  אני עדיין לא יודע מה מתאים לי
                </Link>
              </div>
              <ResumeLink />
              <p className="animate-rise mt-7 flex items-start gap-2 text-sm text-mist-300 [animation-delay:900ms]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sky-400" aria-hidden="true" />
                ההמלצות מותאמות להעדפות שלך. הבחירה הסופית תמיד בידיים שלך.
              </p>
            </div>

            {/* The brand artwork, melted into the night around it. */}
            <div className="animate-rise relative -mx-4 [animation-delay:200ms] sm:mx-0">
              <Image
                src={hero}
                alt=""
                priority
                sizes="(min-width: 768px) 560px, 100vw"
                className="w-full [mask-image:radial-gradient(ellipse_70%_70%_at_55%_45%,#000_45%,transparent_78%)]"
              />
              <span aria-hidden="true" className="animate-glow absolute start-[52%] top-[18%] size-40 rounded-full bg-dawn/30 blur-3xl" />
            </div>
          </div>

          {/* Scroll cue */}
          <a href="#pathways" className="group absolute inset-x-0 bottom-6 mx-auto hidden w-fit flex-col items-center gap-2 text-xs text-mist-300 md:flex">
            <span>גוללים למסלולים</span>
            <span className="relative h-10 w-px overflow-hidden bg-paper/15" aria-hidden="true">
              <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-sky-400" />
            </span>
          </a>
        </section>
      </Spotlight>

      {/* A moving band of real names from the catalog. Decorative: the full list is one link away. */}
      <section aria-labelledby="h-names" className="relative overflow-hidden border-y border-navy-800 bg-navy-950 py-6 text-mist-300">
        <h2 id="h-names" className="sr-only">
          המוסדות שבאתר
        </h2>
        <div aria-hidden="true" dir="ltr" className="space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          {rows.map((row, r) => (
            <div key={r} className="marquee">
              <div className="marquee-track" data-back={r === 1 ? "" : undefined} style={{ "--speed": `${row.length * 2.6}s` } as React.CSSProperties}>
                {[...row, ...row].map((n, i) => (
                  <span key={i} className="flex items-center whitespace-nowrap px-5 font-display text-xl" dir="rtl">
                    {n}
                    <span className="ms-10 size-1.5 rounded-full bg-sky-400/60" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/institutions" className="text-sky-300 underline underline-offset-4 hover:text-paper">
            לכל {all.length} המסגרות במאגר
          </Link>
        </p>
      </section>

      {/* Numbers */}
      <section aria-labelledby="h-numbers" className="bg-navy-950 pb-20 pt-14 text-paper">
        <h2 id="h-numbers" className="sr-only">
          המאגר במספרים
        </h2>
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-navy-800 bg-navy-800 px-0 md:grid-cols-4">
          {PATHWAY_ORDER.map((p, i) => (
            <Reveal as="li" key={p} delay={i * 90} className="bg-navy-950">
              <Link href={pathwayHref(p)} className="group block p-6 transition hover:bg-navy-900 sm:p-8">
                <span className="block font-display text-5xl font-bold text-paper sm:text-6xl">
                  <CountUp to={count(p)} />
                </span>
                <span className="mt-2 block text-sm text-mist-300 group-hover:text-paper">
                  {PATHWAY_PAGES[p].h1.split(":")[0]}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Pathways: cards that stack as you scroll. */}
      <section id="pathways" aria-labelledby="h-pathways" className="scroll-mt-20 bg-paper py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-teal-700">ארבעה מסלולים</p>
            <h2 id="h-pathways" className="mt-2 font-display text-4xl font-bold text-navy-950 sm:text-6xl">
              מה אפשר לעשות אחרי י״ב?
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              לכל מסלול יש אופי משלו. אין כאן דירוג, רק היכרות, כדי שתוכל לבחור ממקום של ידע.
            </p>
          </Reveal>
          <ol className="mt-14 space-y-6">
            {PATHWAY_ORDER.map((id, n) => {
              const p = PATHWAY_INFO[id];
              return (
                <li key={id} className="sticky" style={{ top: `calc(5.5rem + ${n * 1.25}rem)` }}>
                  <Link
                    href={pathwayHref(id)}
                    className="group grid overflow-hidden rounded-[32px] border border-sand-200 bg-paper shadow-lift transition-shadow hover:shadow-[0_30px_80px_-30px_rgb(15_34_54/0.5)] md:min-h-[26rem] md:grid-cols-[1fr_1.1fr]"
                  >
                    <div className="relative h-56 overflow-hidden md:h-auto">
                      <div className="parallax absolute inset-0">
                        <PhotoFrame photo={PATHWAY_PHOTOS[id]} credit={false} sizes="(min-width: 768px) 560px, 100vw" className="transition-transform duration-700 group-hover:scale-105" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent md:bg-gradient-to-l" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col p-7 sm:p-10">
                      <span className="font-display text-6xl font-bold text-sky-500 transition-colors group-hover:text-navy-950" aria-hidden="true">
                        0{n + 1}
                      </span>
                      <p className="mt-4 text-sm font-medium text-mist-500">{p.short}</p>
                      <h3 className="mt-1 font-display text-3xl font-bold text-navy-950 sm:text-4xl">{p.name}</h3>
                      <p className="mt-4 flex-1 text-base leading-8 text-navy-800">{p.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 font-semibold text-navy-950">
                        <span className="relative">
                          לכל ה{PATHWAY_PAGES[id].noun} במסלול
                          <span className="absolute -bottom-1 start-0 h-0.5 w-full origin-right scale-x-0 bg-sky-500 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
                        </span>
                        <span className="grid size-9 place-items-center rounded-full bg-navy-950 text-paper transition-transform duration-500 group-hover:-translate-x-1.5">
                          <ArrowLeft className="size-4" aria-hidden="true" />
                        </span>
                      </span>
                    </div>
                  </Link>
                  <PhotoCredit photo={PATHWAY_PHOTOS[id]} className="start-3 top-3" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <HomeJourney />

      {/* Why: cards whose borders light up under the pointer. */}
      <Spotlight className="relative overflow-hidden bg-night py-24 text-paper">
        <section aria-labelledby="h-why">
          <div className="spotlight-layer" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
              <Reveal>
                <p className="text-sm font-semibold tracking-wide text-sky-300">למה דווקא ״הצעד הבא״</p>
                <h2 id="h-why" className="mt-2 font-display text-4xl font-bold sm:text-5xl">
                  מידע שקוף,
                  <br />
                  <span className="text-sky-400">החלטה שלך.</span>
                </h2>
                <p className="mt-5 max-w-md leading-8 text-mist-300">
                  ההתאמה מבוססת על נתונים מובנים על כל מסגרת, ועל מקורות ציבוריים שמוצגים עם תאריך אימות. מה שלא אומת מסומן
                  ככזה.
                </p>
                <Link href="/about" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 underline underline-offset-4 hover:text-paper">
                  איך עובד מנגנון ההתאמה
                </Link>
              </Reveal>
              <ul className="grid gap-4 sm:grid-cols-2">
                {WHY.map((w, i) => (
                  <Reveal as="li" key={w.title} delay={i * 100} className="spot-card rounded-3xl border border-navy-800 bg-navy-950/70 p-6 backdrop-blur">
                    <span className="grid size-11 place-items-center rounded-2xl bg-sky-400/10 ring-1 ring-sky-400/30">
                      <w.icon className="size-5 text-sky-300" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">{w.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-mist-300">{w.text}</p>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Spotlight>

      {/* Closing: the doorway again. */}
      <section aria-labelledby="h-close" className="px-4 pt-24 sm:px-6">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-night">
          <div aria-hidden="true" className="animate-glow absolute inset-0 m-auto size-[36rem] rounded-full bg-sky-500/30 blur-[100px]" />
          <div aria-hidden="true" className="absolute inset-0 m-auto h-64 w-40 rounded-t-xl bg-gradient-to-b from-dawn/60 via-dawn/20 to-transparent blur-sm" />
          <div className="relative px-6 py-20 text-center sm:py-28">
            <h2 id="h-close" className="font-display text-4xl font-bold text-paper sm:text-6xl">
              לא צריך לדעת הכול מראש.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-mist-100">מתחילים ממה שחשוב לך היום, ומתקדמים צעד אחד בכל פעם.</p>
            <Link
              href="/questionnaire"
              className="shine group mt-10 inline-flex items-center gap-2 rounded-full bg-paper px-8 py-4 font-bold text-night shadow-[0_18px_50px_-12px_rgb(63_208_255/0.6)] transition hover:-translate-y-0.5"
            >
              מתחילים למצוא את המסלול שלי
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
