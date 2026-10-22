import type { Metadata } from "next";
import Link from "next/link";
import { ClearDataButton } from "@/components/site/ClearDataButton";
import { ContactLines } from "@/components/site/LegalPage";
import { LEGAL_UPDATED, SITE_OPERATOR } from "@/lib/site";

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
          <h2 className="font-display text-2xl font-bold text-navy-950">מי אחראית על המידע</h2>
          <p className="mt-3">
            האתר מופעל על ידי {SITE_OPERATOR.name}, שהיא האחראית על המידע שנאסף בו. אפשר לפנות בכל שאלה או בקשה בנושא פרטיות
            לפרטי הקשר שבסוף העמוד.
          </p>
        </section>

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

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">עוגיות ואחסון מקומי</h2>
          <p className="mt-3">
            האתר לא משתמש בעוגיות פרסום או מעקב. אם נכנסת לחשבון, נשמרות עוגיות התחברות (שמתחילות ב־sb-) שנחוצות כדי שתישאר/י
            מחובר/ת. בחירות כמו התשובות לשאלון והגדרות תפריט הנגישות נשמרות באחסון המקומי של הדפדפן ולא נשלחות אלינו.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">ספקים שמעבדים מידע בשבילנו</h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            <li>Vercel — אחסון האתר והפעלתו.</li>
            <li>Supabase — מסד הנתונים והתחברות לחשבון (רק למי שנכנס לחשבון).</li>
            <li>Anthropic — ניסוח תשובות העוזר והסיכומים, רק כשהשירות פעיל ובהיקף שמתואר למעלה.</li>
          </ul>
          <p className="mt-3">
            השרתים של הספקים האלה עשויים להיות מחוץ לישראל. הם מקבלים רק את המידע הדרוש לשירות שהם נותנים.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">הזכויות שלך</h2>
          <p className="mt-3">
            לפי חוק הגנת הפרטיות, התשמ״א־1981, אפשר לבקש לעיין במידע שנשמר עליך בחשבון, לתקן אותו, או למחוק את החשבון ואת
            המידע שבו. את המסגרות השמורות, הצעדים ושם התצוגה אפשר לשנות ולמחוק בעצמך באתר. למחיקת החשבון כולו, או לכל בקשה אחרת,
            פנה/י אלינו בדוא״ל ונטפל בבקשה. המידע בחשבון נשמר עד שתבקש/י למחוק אותו.
          </p>
          <p className="mt-3">
            השירות מיועד גם לבני נוער. אם טרם מלאו לך 18, כדאי לשתף הורה או מבוגר אחראי לפני שפותחים חשבון או מפרסמים בקהילה.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">אבטחה</h2>
          <p className="mt-3">
            התקשורת עם האתר מוצפנת (HTTPS), והגישה למידע בחשבון מוגבלת במסד הנתונים כך שכל משתמש רואה רק את המידע הפרטי שלו. אין
            אבטחה מושלמת, ואם יתגלה אירוע שפוגע במידע שלך נפעל לפי הדין.
          </p>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-paper p-6">
          <h2 className="font-display text-2xl font-bold text-navy-950">מחיקת המידע</h2>
          <p className="mt-2">הכפתור מוחק מהדפדפן הזה את כל מה ש־NEXT STEP שמר: תשובות, מועדפים, השוואות, סימונים בתוכנית הפעולה והסכמות. הוא לא מוחק את מה שנשמר בחשבון — את המסגרות השמורות והצעדים אפשר להסיר מהחשבון עצמו.</p>
          <div className="mt-4">
            <ClearDataButton />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-navy-950">יצירת קשר</h2>
          <div className="[&_a]:font-medium [&_a]:text-teal-700 [&_a]:underline [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-6">
            <ContactLines {...SITE_OPERATOR} />
          </div>
          <p className="mt-3">
            ראו גם את <Link href="/terms" className="font-medium text-teal-700 underline">תנאי השימוש</Link>.
          </p>
        </section>
      </div>
      <p className="mt-12 text-sm text-mist-500">
        עודכן לאחרונה: <time dateTime={LEGAL_UPDATED}>{new Date(LEGAL_UPDATED).toLocaleDateString("he-IL")}</time>
      </p>
    </div>
  );
}
