import Link from "next/link";
import { ArrowLeft, Scale, ShieldCheck, Sparkles, Eye } from "lucide-react";
import { Landscape } from "@/components/art/Landscape";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { HomeJourney } from "@/components/journey/HomeJourney";
import { ResumeLink } from "@/components/journey/ResumeLink";

const WHY = [
  { icon: Sparkles, title: "התאמה אישית לפי ההעדפות שלך", text: "לא לפי מי שמפרסם יותר. כל מוסד נבחן לפי אותם קריטריונים." },
  { icon: Eye, title: "היכרות עם אפשרויות שאולי לא הכרת", text: "ההמלצות מגוונות בין מסלולים כשאתה פתוח לכמה כיוונים." },
  { icon: Scale, title: "השוואה ברורה בין מסגרות", text: "רואים את ההבדלים במקום אחד, גם בטלפון." },
  { icon: ShieldCheck, title: "גם יתרונות וגם נקודות לבדיקה", text: "כל המלצה מציגה מה עלול לא להתאים ומה עוד לא אומת." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-16">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sand-300 bg-sand-100 px-3 py-1 text-sm text-stone-600">
              <span className="size-1.5 rounded-full bg-teal-600" aria-hidden="true" />
              לבוגרי י״ב ולתלמידי י״א–י״ב
            </p>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.1] text-navy-950 sm:text-6xl">
              הצעד הבא שלך
              <br />
              מתחיל כאן.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-navy-800">
              בין צה״ל, מכינה, ישיבת הסדר וישיבה גבוהה — הדרך הנכונה מתחילה בהיכרות עם עצמך.
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
              ענה על כמה שאלות קצרות ונמצא יחד את המסלולים והמקומות שהכי מתאימים לך.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/questionnaire"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-7 py-4 text-base font-semibold text-paper shadow-lift transition hover:bg-navy-800"
              >
                בוא נמצא את המסלול שלך
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/questionnaire?mode=explore"
                className="inline-flex items-center justify-center rounded-full px-5 py-4 text-base font-medium text-navy-800 underline decoration-sand-300 underline-offset-[6px] hover:decoration-navy-700"
              >
                אני עדיין לא יודע מה מתאים לי
              </Link>
            </div>
            <ResumeLink />
            <p className="mt-6 flex items-start gap-2 text-sm text-stone-600">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
              ההמלצות מותאמות להעדפות שלך. הבחירה הסופית תמיד בידיים שלך.
            </p>
          </div>

          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="aspect-[4/3.4] overflow-hidden rounded-[28px] shadow-lift ring-1 ring-navy-900/5">
              <Landscape variant="hero" className="size-full" />
            </div>
            <div className="absolute -bottom-6 start-6 hidden max-w-[260px] rounded-2xl border border-sand-200 bg-paper/95 p-4 shadow-card backdrop-blur sm:block">
              <p className="text-xs font-medium text-mist-500">איך זה עובד</p>
              <p className="mt-1 text-sm leading-6 text-navy-900">
                כ־5 דקות של שאלות, ושלושה כיוונים עם הסבר שקוף למה הם מתאימים לך.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section id="pathways" className="scroll-mt-20 bg-sand-100/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-teal-700">ארבעה מסלולים</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-navy-950 sm:text-4xl">מה אפשר לעשות אחרי י״ב?</h2>
            <p className="mt-4 text-base leading-7 text-stone-600">
              לכל מסלול יש אופי משלו. אין כאן דירוג — רק היכרות, כדי שתוכל לבחור ממקום של ידע.
            </p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PATHWAY_ORDER.map((id) => {
              const p = PATHWAY_INFO[id];
              return (
                <li key={id}>
                  <Link
                    href={`/institutions?pathway=${id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-paper shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="h-32 overflow-hidden">
                      <Landscape variant={id} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-xs font-medium text-mist-500">{p.short}</p>
                      <h3 className="mt-1 font-display text-2xl font-bold text-navy-950">{p.name}</h3>
                      <p className="mt-3 flex-1 text-sm leading-7 text-navy-800">{p.description}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
                        למסגרות במסלול
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <HomeJourney />

      {/* Why */}
      <section className="bg-navy-900 py-20 text-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold tracking-wide text-teal-100">למה להשתמש ב־NEXT STEP</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">מידע שקוף, החלטה שלך</h2>
              <p className="mt-4 max-w-md leading-8 text-mist-300">
                ההתאמה מבוססת על נתונים מובנים על כל מסגרת, ועל מקורות ציבוריים שמוצגים עם תאריך אימות. מה שלא אומת —
                מסומן ככזה.
              </p>
              <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-100 underline underline-offset-4">
                איך עובד מנגנון ההתאמה
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {WHY.map((w) => (
                <li key={w.title} className="rounded-2xl border border-navy-700 bg-navy-800/60 p-5">
                  <w.icon className="size-5 text-teal-100" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-mist-300">{w.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 pt-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-navy-950">
          <Landscape variant="closing" className="absolute inset-0 size-full opacity-90" />
          <div className="relative px-6 py-16 text-center sm:py-20">
            <h2 className="font-display text-3xl font-bold text-paper sm:text-5xl">לא צריך לדעת הכול מראש.</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-mist-100">
              מתחילים ממה שחשוב לך היום, ומתקדמים צעד אחד בכל פעם.
            </p>
            <Link
              href="/questionnaire"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-7 py-4 font-semibold text-navy-950 transition hover:bg-sand-100"
            >
              מתחילים למצוא את המסלול שלי
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
