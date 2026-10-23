"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Answers } from "@/lib/questionnaire/questions";
import { KEYS, useStored } from "@/lib/client/store";
import { computeJourney, journeyPercent, type Stage } from "@/lib/journey/journey";
import { getAccountPlaces } from "@/app/actions/saved";
import { JourneyMap, ProgressRing } from "./JourneyMap";

/**
 * The journey on the homepage. A first-time visitor sees the route with step one ahead;
 * a returning one sees where they actually are, from their own saved data.
 */
export function HomeJourney() {
  const [answers, , hydrated] = useStored<Answers>(KEYS.answers, {});
  const [favs] = useStored<string[]>(KEYS.favorites, []);
  const [compare] = useStored<string[]>(KEYS.compare, []);
  const [localStages] = useStored<Record<string, Stage>>(KEYS.journey, {});
  const [account, setAccount] = useState<{ stage: Stage }[] | null>(null);

  useEffect(() => {
    let live = true;
    getAccountPlaces()
      .then((rows) => live && setAccount(rows))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const places = account ?? favs.map((id) => ({ stage: localStages[id] ?? ("interested" as Stage) }));
  const answered = Object.keys(answers).length;
  const milestones = computeJourney({ answered, places, compared: compare.length });
  const returning = hydrated && (answered > 0 || places.length > 0);
  const current = milestones.find((m) => m.status === "current");
  const percent = journeyPercent(milestones);

  return (
    <section id="how" aria-labelledby="h-journey" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-teal-700">{returning ? "המסע שלך" : "איך זה עובד"}</p>
            <h2 id="h-journey" className="mt-2 font-display text-3xl font-bold text-navy-950 sm:text-4xl">
              {returning ? "ממשיכים מאיפה שעצרת" : "מהשאלון ועד השיבוץ, צעד אחרי צעד"}
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-600">
              {returning
                ? `הצעד הבא: ${current ? current.title : "סיימת את כל השלבים"}. כל ההתקדמות שלך נמצאת במקום אחד.`
                : "לא רק המלצה וזהו. ״הצעד הבא״ מלווה אותך לאורך כל הדרך: מהיכרות עם עצמך, דרך בדיקה והשוואה של מקומות, ועד שאתה יודע לאן אתה הולך."}
            </p>
          </div>
          {returning && <ProgressRing percent={percent} size={72} />}
        </div>

        <div className="mt-10 rounded-[32px] border border-sand-200 bg-paper p-6 shadow-card sm:p-10">
          <JourneyMap milestones={milestones} linked={returning} />
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sand-200 pt-6">
            {returning ? (
              <>
                <Link
                  href="/journey"
                  className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper hover:bg-navy-800"
                >
                  למסע שלי
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
                {current && (
                  <Link href={current.action.href} className="rounded-full px-4 py-3 text-sm font-medium text-navy-800 underline underline-offset-4">
                    {current.action.label}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/questionnaire"
                  className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-paper hover:bg-navy-800"
                >
                  מתחילים בשלב הראשון
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
                <p className="text-sm text-stone-600">כ־5 דקות. בלי הרשמה, ואפשר לעצור ולחזור.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
