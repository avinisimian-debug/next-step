import type { Metadata } from "next";
import { ClearDataButton } from "@/components/site/ClearDataButton";

export const metadata: Metadata = {
  title: "פרטיות",
  description: "איזה מידע NEXT STEP שומר, איפה, ולמה — ואיך למחוק אותו.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950 sm:text-5xl">פרטיות</h1>
      <p className="mt-4 text-lg leading-8 text-navy-800">
        השירות מיועד גם לבני נוער, ולכן בנינו אותו כך שיאסוף כמה שפחות מידע. בקצרה: התשובות שלך נשארות במכשיר שלך.
      </p>

      <div className="mt-10 space-y-10 leading-8 text-navy-800">
        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">מה נשמר ואיפה</h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            <li>התשובות לשאלון, המיקום שלך בשאלון, המועדפים והבחירות להשוואה — נשמרים רק באחסון המקומי של הדפדפן (localStorage) במכשיר הזה.</li>
            <li>חישוב ההתאמה נעשה בדפדפן שלך. התשובות לא נשלחות לשרת שלנו לצורך החישוב.</li>
            <li>אנחנו לא מבקשים שם, טלפון, מספר זהות, פרטים רפואיים או פרופיל צבאי, ולא צריך להירשם.</li>
            <li>אין באתר כלי אנליטיקה או מעקב כברירת מחדל.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">סיכום בעזרת AI (רק באישור שלך)</h2>
          <p className="mt-3">
            אם השירות מוגדר לכך, בדף ההמלצות תופיע אפשרות לקבל סיכום בניסוח חופשי. רק אם תסמן את תיבת האישור, התשובות שלך
            (כולל הטקסט החופשי) והמידע על המסגרות שהומלצו יישלחו לשירות של Anthropic לצורך ניסוח הסיכום. אנחנו לא שומרים את
            התשובות בשרת. אפשר לבטל את האישור בכל רגע.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">מה אנחנו לא עושים</h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            <li>לא משתפים את התשובות שלך עם מוסדות.</li>
            <li>לא מוכרים מידע.</li>
            <li>לא מקבלים תשלום ממוסדות על הופעה בהמלצות.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-paper p-6">
          <h2 className="font-display text-2xl font-bold text-navy-950">מחיקת המידע</h2>
          <p className="mt-2">הכפתור מוחק מהדפדפן הזה את כל מה ש־NEXT STEP שמר: תשובות, מועדפים, השוואות והסכמות.</p>
          <div className="mt-4">
            <ClearDataButton />
          </div>
        </section>
      </div>
    </div>
  );
}
