import type { Metadata } from "next";
import Link from "next/link";
import { COMPONENT_LABELS, DEFAULT_CONFIG } from "@/lib/matching/config";

export const metadata: Metadata = {
  title: "אודות והשיטה",
  description: "מה זה ״הצעד הבא״, איך עובד מנגנון ההתאמה, ואיך אנחנו מאמתים את המידע על המסגרות.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const w = DEFAULT_CONFIG.weights;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950 sm:text-5xl">אודות ״הצעד הבא״</h1>
      <div className="mt-6 space-y-5 text-lg leading-8 text-navy-800">
        <p>
          ״הצעד הבא״ נבנה כדי לעזור לתלמידי י״א–י״ב ולבוגרי תיכון להכיר את האפשרויות שאחרי התיכון — שירות בצה״ל, מכינה
          קדם־צבאית, ישיבת הסדר וישיבה גבוהה — ולמצוא את הכיוונים שהכי מתאימים להם.
        </p>
        <p>
          אנחנו לא מדרגים מסלולים ולא אנשים. אין מסלול ״נכון יותר״, ואין תשובה לא נכונה בשאלון. ההמלצות הן נקודת פתיחה
          לבדיקה, והבחירה תמיד שלך.
        </p>
      </div>

      <section id="method" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-3xl font-bold text-navy-950">איך עובד מנגנון ההתאמה</h2>
        <ol className="mt-5 list-decimal space-y-3 ps-6 leading-8 text-navy-800">
          <li>לכל מסגרת במאגר יש מאפיינים מובנים: מסלול, היקף לימוד תורה, אופן השילוב עם השירות, אווירה, מיקום, משך ועוד.</li>
          <li>כל תשובה שלך מושווית למאפיינים האלה ומקבלת ציון בין 0 ל־1.</li>
          <li>הציונים מתחברים לפי משקלות קבועים (בטבלה למטה) ומנורמלים לסולם של 0–100.</li>
          <li>שאלה שדילגת עליה לא נספרת בכלל — היא לא מורידה ציון לאף מסגרת.</li>
          <li>
            מגבלה מוחלטת יש רק במקרה אחד: אם ציינת שאתה מחפש מסגרות לבנים או לבנות, ומסגרת מיועדת בבירור לקהל אחר. אם המידע
            לא אומת — המסגרת נשארת, עם סימון.
          </li>
          <li>
            מוצגות עד שלוש מסגרות שקיבלו לפחות {DEFAULT_CONFIG.minScore}. אם אתה פתוח לכמה מסלולים, נעדיף גיוון בין מסלולים.
            אם אין שלוש התאמות טובות — נציג פחות, ולא נמלא מקומות בהתאמות חלשות.
          </li>
          <li>כל המלצה מציגה למה היא מתאימה, מה עלול לא להתאים, מה לבדוק ומה עוד לא ידוע.</li>
        </ol>

        <div className="mt-8 overflow-hidden rounded-2xl border border-sand-200">
          <table className="w-full text-sm">
            <caption className="sr-only">משקלות מנגנון ההתאמה</caption>
            <thead className="bg-sand-100">
              <tr>
                <th scope="col" className="p-3 text-start font-semibold text-navy-950">רכיב</th>
                <th scope="col" className="p-3 text-start font-semibold text-navy-950">משקל</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(w) as (keyof typeof w)[]).map((k) => (
                <tr key={k} className="border-t border-sand-200">
                  <td className="p-3 text-navy-800">{COMPONENT_LABELS[k]}</td>
                  <td className="p-3 text-navy-800">{Math.round((w[k] / total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          ציון ההתאמה הוא כלי עזר שנבנה מההעדפות שציינת. הוא אינו הסתברות מדעית להצלחה, אינו דירוג של המוסד ואינו קשור
          לכמות המידע השיווקי שיש למוסד ברשת.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-bold text-navy-950">איך אנחנו מאמתים מידע</h2>
        <ul className="mt-5 list-disc space-y-3 ps-6 leading-8 text-navy-800">
          <li>כל מסגרת במאגר מבוססת על מקורות ציבוריים שמוצגים בדף שלה, עם תאריך הבדיקה האחרון.</li>
          <li>
            <strong>אומת מול מקור רשמי</strong> — הפרטים נבדקו באתר הרשמי של המוסד או באתר ממשלתי.
          </li>
          <li>
            <strong>אומת חלקית</strong> — קיום המוסד ופרטיו הבסיסיים אומתו ממקור משני (למשל אנציקלופדיה), אבל האתר הרשמי לא
            נבדק ישירות. במקרה כזה לא מוצג קישור לאתר.
          </li>
          <li>מסגרות שלא הצלחנו לאמת לא מוצגות בכלל.</li>
          <li>אנחנו לא ממציאים סדרי יום, עלויות, תנאי קבלה או נתוני בוגרים. מה שלא אומת מסומן ״המידע עדיין לא אומת״.</li>
          <li>אם מצאת טעות — נשמח לדעת, ונבדוק מול המוסד.</li>
        </ul>
      </section>

      <section className="mt-14 rounded-3xl bg-sand-100/70 p-6 leading-8 text-navy-800">
        <h2 className="font-semibold text-navy-950">חשוב לזכור</h2>
        ההמלצות הן מידע בלבד. הן אינן מחליפות הכוונה רשמית של צה״ל או של משרד הביטחון, ייעוץ קבלה של המוסדות או שיחה עם
        יועץ, הורים ואנשים שמכירים אותך. אין התחייבות לקבלה או לשיבוץ בתפקיד צבאי כלשהו.{" "}
        <Link href="/privacy" className="font-medium text-teal-700 underline">
          מדיניות הפרטיות
        </Link>
      </section>
    </div>
  );
}
