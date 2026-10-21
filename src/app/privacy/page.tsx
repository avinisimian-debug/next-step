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
        השירות מיועד גם לבני נוער, ולכן בנינו אותו כך שיאסוף כמה שפחות מידע. בקצרה: התשובות לשאלון נשארות במכשיר שלך, וחשבון הוא אופציונלי.
      </p>

      <div className="mt-10 space-y-10 leading-8 text-navy-800">
        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">מה נשמר ואיפה</h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            <li>התשובות לשאלון, המיקום שלך בשאלון, המועדפים, הבחירות להשוואה והצעדים שסימנת בתוכנית הפעולה — נשמרים רק באחסון המקומי של הדפדפן (localStorage) במכשיר הזה.</li>
            <li>חישוב ההתאמה נעשה בדפדפן שלך. התשובות לא נשלחות לשרת שלנו לצורך החישוב.</li>
            <li>אנחנו לא מבקשים טלפון, מספר זהות, פרטים רפואיים או פרופיל צבאי. אפשר להשתמש בשאלון, בחיפוש ובהשוואה בלי להירשם.</li>
            <li>אין באתר כלי אנליטיקה או מעקב כברירת מחדל.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">אם נכנסת לחשבון</h2>
          <p className="mt-3">כניסה לחשבון נעשית בקישור שנשלח למייל, בלי סיסמה. אחרי הכניסה נשמרים בשרת (Supabase):</p>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            <li>כתובת המייל, ושם תצוגה אם בחרת להזין.</li>
            <li>מסגרות ששמרת והערות שכתבת עליהן — גלויות רק לך.</li>
            <li>מפת הדרך האישית שלך (צעדים וסטטוס) — גלויה רק לך.</li>
            <li>שאלות ותשובות שפרסמת בקהילה — גלויות לכולם, עם שם התצוגה שלך. מנהלי קהילה יכולים להסתיר תוכן שמפר את הכללים.</li>
            <li>התראות על תשובות לשאלות שלך, וסימוני ״עזר לי״ ודיווחים ששלחת.</li>
          </ul>
          <p className="mt-3">
            השמירה בחשבון נפרדת מהשמירה במכשיר: מה ששמרת במכשיר לא עובר לחשבון אלא אם בחרת לייבא אותו. ההרשאות נאכפות במסד הנתונים
            עצמו, כך שמשתמש אחד לא יכול לקרוא מידע פרטי של משתמש אחר.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">העוזר (שאלות בניסוח חופשי)</h2>
          <p className="mt-3">
            כשהעוזר פעיל, השאלה שכתבת וקטעי מידע מהמאגר ומהקהילה שנבחרו כמקורות נשלחים לשירות של Anthropic כדי לנסח תשובה עם
            הפניות. לא נשלחים פרטי החשבון שלך, המסגרות ששמרת או מפת הדרך שלך. אל תכתבו בשאלה פרטים מזהים.
          </p>
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
          <p className="mt-2">הכפתור מוחק מהדפדפן הזה את כל מה ש־NEXT STEP שמר: תשובות, מועדפים, השוואות, סימונים בתוכנית הפעולה והסכמות. הוא לא מוחק את מה שנשמר בחשבון — את המסגרות השמורות והצעדים אפשר להסיר מהחשבון עצמו.</p>
          <div className="mt-4">
            <ClearDataButton />
          </div>
        </section>
      </div>
    </div>
  );
}
