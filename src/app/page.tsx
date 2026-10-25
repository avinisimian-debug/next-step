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
import { Lines, Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { CountUp } from "@/components/motion/CountUp";
import { CinemaHero } from "@/components/motion/CinemaHero";
import { Dust } from "@/components/motion/Dust";
import { Magnetic } from "@/components/motion/Magnetic";
import { Tilt } from "@/components/motion/Tilt";
import { PATHWAY_PAGES, SITE_NAME, SITE_URL, pathwayHref } from "@/lib/seo";
import hero from "@/assets/brand/hero.webp";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const WHY = [
  {
    icon: Sparkles,
    title: "התאמה אישית לפי ההעדפות שלך",
    text: "לא לפי מי שמפרסם יותר. כל מוסד נבחן לפי אותם קריטריונים.",
  },
  {
    icon: Eye,
    title: "היכרות עם אפשרויות שאולי לא הכרת",
    text: "ההמלצות מגוונות בין מסלולים כשאתה פתוח לכמה כיוונים.",
  },
  {
    icon: Scale,
    title: "השוואה ברורה בין מסגרות",
    text: "רואים את ההבדלים במקום אחד, גם בטלפון.",
  },
  {
    icon: ShieldCheck,
    title: "גם יתרונות וגם נקודות לבדיקה",
    text: "כל המלצה מציגה מה עלול לא להתאים ומה עוד לא אומת.",
  },
];

const CYCLE = ["מכינה", "ישיבת הסדר", "ישיבה גבוהה", "צה״ל"];

/** Splits a line into words that rise in one after another (see .word in globals.css). */
function Words({
  text,
  from = 0,
  className = "",
}: {
  text: string;
  from?: number;
  className?: string;
}) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span
            className={`word ${className}`}
            style={{ "--i": from + i } as React.CSSProperties}
          >
            {w}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

const PRIMARY =
  "shine group inline-flex items-center justify-center gap-2 rounded-full bg-paper px-8 py-4 text-base font-bold text-night shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_18px_50px_-12px_rgb(63_208_255/0.55)] transition-shadow hover:shadow-[0_0_0_1px_rgb(255_255_255/0.3),0_24px_70px_-10px_rgb(63_208_255/0.85)]";

export default async function Home() {
  const all = await getRepository().listPublic();
  const count = (p: (typeof PATHWAY_ORDER)[number]) =>
    all.filter((i) => i.pathway === p).length;
  // Two rows of real names from the catalog for the moving band.
  const names = all
    .filter((i) => i.pathway !== "idf")
    .map((i) => i.name.replace(/^ישיבת ההסדר /, "ישיבת "));
  const rows = [
    names.filter((_, i) => i % 2 === 0),
    names.filter((_, i) => i % 2 === 1),
  ];

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

      {/* Opening scene: night, a lit doorway, and as you scroll the camera walks into its light. */}
      <CinemaHero className="bg-night text-paper">
        <Spotlight className="cinema-stage grain relative isolate overflow-hidden">
          <section aria-labelledby="h-hero" className="relative h-full">
            <div className="spotlight-layer cinema-fade" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="cinema-fade absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgb(127_220_255/0.25)_1px,transparent_1px),linear-gradient(90deg,rgb(127_220_255/0.25)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_40%,#000_10%,transparent_65%)]"
            />
            <div
              aria-hidden="true"
              className="animate-glow absolute -end-40 top-0 -z-10 size-[42rem] rounded-full bg-sky-500/25 blur-[120px]"
            />
            <div
              aria-hidden="true"
              className="animate-glow absolute -start-20 bottom-[-10rem] -z-10 size-[30rem] rounded-full bg-dawn/10 blur-[110px] [animation-delay:-3s]"
            />
            <Dust className="cinema-fade -z-10" />

            <div className="mx-auto grid h-full max-w-6xl items-center gap-4 px-4 pb-10 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-10">
              <div className="cinema-copy relative z-10">
                <p className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-sm text-sky-300 backdrop-blur">
                  <span className="relative flex size-2">
                    <span
                      className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60"
                      aria-hidden="true"
                    />
                    <span
                      className="relative inline-flex size-2 rounded-full bg-sky-400"
                      aria-hidden="true"
                    />
                  </span>
                  לבוגרי י״ב ולתלמידי י״א–י״ב
                </p>
                <h1
                  id="h-hero"
                  className="font-display text-[3.1rem] font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.4rem]"
                >
                  <Words text="הצעד" />
                  <span
                    className="word bg-gradient-to-l from-sky-300 via-sky-400 to-sky-500 bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_rgb(63_208_255/0.45))]"
                    style={{ "--i": 1 } as React.CSSProperties}
                  >
                    הבא
                  </span>{" "}
                  <Words text="שלך" from={2} />
                  <br />
                  <Words text="מתחיל כאן." from={3} className="text-mist-300" />
                </h1>

                <p className="animate-rise mt-6 font-display text-2xl text-mist-100 [animation-delay:550ms] sm:text-3xl">
                  <span className="sr-only">
                    צה״ל, מכינה, ישיבת הסדר או ישיבה גבוהה?
                  </span>
                  <span aria-hidden="true" className="flex items-center gap-2">
                    <span className="leading-[1.5em]">אולי</span>
                    <span className="relative block h-[1.5em] overflow-hidden">
                      <span className="animate-cycle flex flex-col font-bold text-paper">
                        {CYCLE.map((w) => (
                          <span
                            key={w}
                            className="block h-[1.5em] whitespace-nowrap leading-[1.5em]"
                          >
                            {w}?
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </p>
                <p className="animate-rise mt-4 max-w-xl text-base leading-7 text-mist-100 [animation-delay:650ms] sm:text-lg sm:leading-8">
                  הדרך הנכונה מתחילה בהיכרות עם עצמך. כמה שאלות קצרות, ונמצא יחד
                  את המסלולים והמקומות שהכי מתאימים לך.
                </p>

                <div className="animate-rise mt-8 flex flex-col gap-3 [animation-delay:750ms] sm:flex-row sm:items-center">
                  <Magnetic>
                    <Link
                      href="/questionnaire"
                      className={`${PRIMARY} w-full sm:w-auto`}
                    >
                      בוא נמצא את המסלול שלך
                      <ArrowLeft
                        className="size-5 transition-transform group-hover:-translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </Magnetic>
                  <Link
                    href="/questionnaire?mode=explore"
                    className="inline-flex items-center justify-center rounded-full border border-paper/20 bg-night/60 px-6 py-4 text-base font-medium text-paper backdrop-blur-md transition hover:border-paper/50 hover:bg-night/80 md:bg-transparent"
                  >
                    אני עדיין לא יודע מה מתאים לי
                  </Link>
                </div>
                <ResumeLink />
                <p className="animate-rise mt-6 hidden items-start gap-2 text-sm text-mist-300 [animation-delay:900ms] sm:flex">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-sky-400"
                    aria-hidden="true"
                  />
                  ההמלצות מותאמות להעדפות שלך. הבחירה הסופית תמיד בידיים שלך.
                </p>
              </div>

              {/* The brand artwork, melted into the night. The camera zooms toward its doorway. */}
              <div className="animate-rise relative hidden [animation-delay:200ms] md:block">
                <div className="cinema-art relative">
                  <Image
                    src={hero}
                    alt=""
                    priority
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="w-full [mask-image:radial-gradient(ellipse_70%_70%_at_55%_45%,#000_45%,transparent_78%)]"
                  />
                  <span
                    aria-hidden="true"
                    className="animate-glow absolute start-[52%] top-[18%] size-40 rounded-full bg-dawn/30 blur-3xl"
                  />
                </div>
              </div>
            </div>

            {/* The light from the doorway fills the screen, and the next scene begins. */}
            <div
              aria-hidden="true"
              className="cinema-flood pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_40%_38%,#fffaf0_0%,#ffe6bf_22%,#faf7f2_62%)]"
            />
            <p
              aria-hidden="true"
              className="cinema-caption pointer-events-none absolute inset-x-0 top-[38%] z-30 px-6 text-center font-display text-4xl font-bold text-navy-950 sm:text-6xl"
            >
              מאחורי כל דלת,
              <br />
              <span className="text-sky-500">מסלול אחר.</span>
            </p>

            <a
              href="#pathways"
              className="scroll-hint cinema-fade group absolute inset-x-0 bottom-6 z-10 mx-auto hidden w-fit flex-col items-center gap-2 text-xs text-mist-300 md:flex"
            >
              <span>גוללים פנימה</span>
              <span
                className="relative h-10 w-px overflow-hidden bg-paper/15"
                aria-hidden="true"
              >
                <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-sky-400" />
              </span>
            </a>
          </section>
        </Spotlight>
      </CinemaHero>

      {/* Phones: the doorway gets its own scene under the opening text. Scroll walks into its light. */}
      <CinemaHero
        id="door"
        media="(max-width: 767px)"
        className="door bg-night md:hidden"
      >
        <div className="door-stage grain relative isolate flex items-center justify-center overflow-hidden">
          <Dust className="-z-10" count={40} />
          <div className="door-art relative w-full max-w-md px-2">
            <Image
              src={hero}
              alt=""
              sizes="100vw"
              className="w-full [mask-image:radial-gradient(ellipse_72%_72%_at_55%_45%,#000_45%,transparent_80%)]"
            />
            <span
              aria-hidden="true"
              className="animate-glow absolute start-[52%] top-[18%] size-32 rounded-full bg-dawn/30 blur-3xl"
            />
          </div>
          <div
            aria-hidden="true"
            className="door-flood pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_60%_36%,#fffaf0_0%,#ffe6bf_24%,#faf7f2_64%)]"
          />
          <p
            aria-hidden="true"
            className="door-caption pointer-events-none absolute inset-x-0 top-[36%] z-30 px-6 text-center font-display text-4xl font-bold text-navy-950"
          >
            מאחורי כל דלת,
            <br />
            <span className="text-sky-500">מסלול אחר.</span>
          </p>
        </div>
      </CinemaHero>

      {/* Pathways: cards that stack as you scroll. */}
      <section
        id="pathways"
        aria-labelledby="h-pathways"
        className="scroll-mt-20 bg-paper pb-24 pt-10"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Reveal>
              <p className="text-sm font-semibold tracking-wide text-teal-700">
                שישה מסלולים, לבנים ולבנות
              </p>
            </Reveal>
            <Reveal
              as="h2"
              variant="lines"
              className="mt-2 font-display text-4xl font-bold text-navy-950 sm:text-6xl"
            >
              <span id="h-pathways">
                <Lines lines={["מה אפשר לעשות", "אחרי י״ב?"]} />
              </span>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-5 text-lg leading-8 text-stone-600">
                לכל מסלול יש אופי משלו. אין כאן דירוג, רק היכרות, כדי שתוכל
                לבחור ממקום של ידע.
              </p>
            </Reveal>
          </div>
          <ol className="mt-14 space-y-6">
            {PATHWAY_ORDER.map((id, n) => {
              const p = PATHWAY_INFO[id];
              return (
                <li
                  key={id}
                  className="sticky"
                  style={{ top: `calc(5.5rem + ${n * 1.25}rem)` }}
                >
                  <Link
                    href={pathwayHref(id)}
                    className="group grid overflow-hidden rounded-[32px] border border-sand-200 bg-paper shadow-lift transition-shadow hover:shadow-[0_30px_80px_-30px_rgb(15_34_54/0.5)] md:min-h-[26rem] md:grid-cols-[1fr_1.1fr]"
                  >
                    <div className="relative h-56 overflow-hidden md:h-auto">
                      <div className="parallax absolute inset-0">
                        <PhotoFrame
                          photo={PATHWAY_PHOTOS[id]}
                          credit={false}
                          sizes="(min-width: 768px) 560px, 100vw"
                          className="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                        />
                      </div>
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent md:bg-gradient-to-l"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex flex-col p-7 sm:p-10">
                      <span
                        className="font-display text-6xl font-bold text-sky-500 transition-colors group-hover:text-navy-950"
                        aria-hidden="true"
                      >
                        0{n + 1}
                      </span>
                      <p className="mt-4 text-sm font-medium text-mist-500">
                        {p.short}
                      </p>
                      <h3 className="mt-1 font-display text-3xl font-bold text-navy-950 sm:text-4xl">
                        {p.name}
                      </h3>
                      <p className="mt-4 flex-1 text-base leading-8 text-navy-800">
                        {p.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 font-semibold text-navy-950">
                        <span className="relative">
                          לכל ה{PATHWAY_PAGES[id].noun} במסלול
                          <span
                            className="absolute -bottom-1 start-0 h-0.5 w-full origin-right scale-x-0 bg-sky-500 transition-transform duration-500 group-hover:scale-x-100"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="grid size-9 place-items-center rounded-full bg-navy-950 text-paper transition-transform duration-500 group-hover:-translate-x-1.5">
                          <ArrowLeft className="size-4" aria-hidden="true" />
                        </span>
                      </span>
                    </div>
                  </Link>
                  <PhotoCredit
                    photo={PATHWAY_PHOTOS[id]}
                    className="start-3 top-3"
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* A moving band of real names from the catalog, and the numbers behind it. */}
      <section
        aria-labelledby="h-numbers"
        className="grain relative overflow-hidden bg-night pb-20 pt-16 text-paper"
      >
        <div
          aria-hidden="true"
          className="animate-glow absolute inset-x-0 -top-40 mx-auto size-[40rem] rounded-full bg-sky-500/15 blur-[120px]"
        />
        <Reveal
          as="h2"
          variant="lines"
          className="relative mx-auto max-w-6xl px-4 font-display text-4xl font-bold sm:px-6 sm:text-6xl"
        >
          <span id="h-numbers">
            <Lines
              lines={[
                `${all.length} מקומות.`,
                <span key="b" className="text-sky-400">
                  מסלול אחד שלך.
                </span>,
              ]}
            />
          </span>
        </Reveal>
        <div
          aria-hidden="true"
          dir="ltr"
          className="relative mt-12 space-y-3 text-mist-300 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
        >
          {rows.map((row, r) => (
            <div key={r} className="marquee">
              <div
                className="marquee-track"
                data-back={r === 1 ? "" : undefined}
                style={
                  { "--speed": `${row.length * 2.6}s` } as React.CSSProperties
                }
              >
                {[...row, ...row].map((n, i) => (
                  <span
                    key={i}
                    className={`flex items-center whitespace-nowrap px-5 font-display ${r === 0 ? "text-2xl text-paper/80" : "text-xl"}`}
                    dir="rtl"
                  >
                    {n}
                    <span className="ms-10 size-1.5 rounded-full bg-sky-400/60" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ul className="relative mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-navy-800 bg-navy-800 md:grid-cols-3">
          {PATHWAY_ORDER.map((p, i) => (
            <Reveal as="li" key={p} delay={i * 90} className="bg-night">
              <Link
                href={pathwayHref(p)}
                className="group relative block overflow-hidden p-6 transition hover:bg-navy-950 sm:p-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute -bottom-10 -end-10 size-32 rounded-full bg-sky-500/0 blur-2xl transition-colors duration-700 group-hover:bg-sky-500/30"
                />
                <span className="relative block font-display text-5xl font-bold text-paper sm:text-6xl">
                  <CountUp to={count(p)} />
                </span>
                <span className="relative mt-2 block text-sm text-mist-300 group-hover:text-paper">
                  {PATHWAY_PAGES[p].h1.split(":")[0]}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p className="relative mt-8 text-center text-sm">
          <Link
            href="/institutions"
            className="text-sky-300 underline underline-offset-4 hover:text-paper"
          >
            לחיפוש בכל {all.length} המסגרות
          </Link>
        </p>
      </section>

      <HomeJourney />

      {/* Why: tilting cards whose borders light up under the pointer. */}
      <Spotlight className="grain relative overflow-hidden bg-night py-28 text-paper">
        <section aria-labelledby="h-why">
          <div className="spotlight-layer" aria-hidden="true" />
          <Dust count={40} />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Reveal>
                  <p className="text-sm font-semibold tracking-wide text-sky-300">
                    למה דווקא ״הצעד הבא״
                  </p>
                </Reveal>
                <Reveal
                  as="h2"
                  variant="lines"
                  className="mt-2 font-display text-4xl font-bold sm:text-6xl"
                >
                  <span id="h-why">
                    <Lines
                      lines={[
                        "מידע שקוף,",
                        <span key="b" className="text-sky-400">
                          החלטה שלך.
                        </span>,
                      ]}
                    />
                  </span>
                </Reveal>
                <Reveal delay={200}>
                  <p className="mt-5 max-w-md leading-8 text-mist-300">
                    ההתאמה מבוססת על נתונים מובנים על כל מסגרת, ועל מקורות
                    ציבוריים שמוצגים עם תאריך אימות. מה שלא אומת מסומן ככזה.
                  </p>
                  <Link
                    href="/about"
                    className="mt-7 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-sky-300 underline underline-offset-4 hover:text-paper"
                  >
                    איך עובד מנגנון ההתאמה
                  </Link>
                </Reveal>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {WHY.map((w, i) => (
                  <Reveal as="li" key={w.title} delay={i * 110}>
                    <Tilt className="spot-card relative h-full rounded-3xl border border-navy-800 bg-navy-950/70 p-6 backdrop-blur">
                      <span className="grid size-11 place-items-center rounded-2xl bg-sky-400/10 ring-1 ring-sky-400/30">
                        <w.icon
                          className="size-5 text-sky-300"
                          aria-hidden="true"
                        />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold">{w.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-mist-300">
                        {w.text}
                      </p>
                    </Tilt>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Spotlight>

      {/* Closing: the doorway again. */}
      <section aria-labelledby="h-close" className="px-4 pt-24 sm:px-6">
        <Reveal className="grain relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-night">
          <div
            aria-hidden="true"
            className="animate-glow absolute inset-0 m-auto size-[36rem] rounded-full bg-sky-500/30 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-72 w-44 rounded-t-2xl bg-gradient-to-b from-dawn/70 via-dawn/20 to-transparent blur-[2px]"
          />
          <Dust count={30} />
          <div className="relative z-10 px-6 py-24 text-center sm:py-32">
            <Reveal
              as="h2"
              variant="lines"
              className="font-display text-4xl font-bold text-paper sm:text-7xl"
            >
              <span id="h-close">
                <Lines lines={["לא צריך לדעת", "הכול מראש."]} />
              </span>
            </Reveal>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-mist-100">
              מתחילים ממה שחשוב לך היום, ומתקדמים צעד אחד בכל פעם.
            </p>
            <Magnetic className="mt-10">
              <Link href="/questionnaire" className={PRIMARY}>
                מתחילים למצוא את המסלול שלי
                <ArrowLeft
                  className="size-5 transition-transform group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </>
  );
}
