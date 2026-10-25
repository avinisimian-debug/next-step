import type { Metadata } from "next";
import Link from "next/link";
import { ClearDataButton } from "@/components/site/ClearDataButton";
import { ContactLines, LegalPage } from "@/components/site/LegalPage";
import { SITE_OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "מדיניות עוגיות",
  description: "אילו עוגיות ואיזה אחסון מקומי ״הצעד הבא״ משתמש בהם, למה, לכמה זמן ואיך מוחקים אותם.",
};

const ROWS: { name: string; kind: string; purpose: string; duration: string }[] = [
  {
    name: "עוגיות התחברות (sb-…)",
    kind: "עוגייה הכרחית, של האתר עצמו",
    purpose: "שומרות אותך מחובר/ת לחשבון. נוצרות רק אחרי כניסה לחשבון.",
    duration: "עד היציאה מהחשבון, או עד שפג תוקף ההתחברות",
  },
  {
    name: "תשובות, התקדמות בשאלון, מועדפים, השוואה, תוכנית פעולה ומסע (nextstep.*)",
    kind: "אחסון מקומי בדפדפן (localStorage)",
    purpose: "זוכר את מה שבחרת כדי שלא תצטרך/י להתחיל מחדש. לא נשלח אלינו.",
    duration: "עד שתמחק/י אותו בכפתור למטה או בהגדרות הדפדפן",
  },
  {
    name: "הגדרות תפריט הנגישות (nextstep.a11y.v1)",
    kind: "אחסון מקומי בדפדפן (localStorage)",
    purpose: "זוכר את גודל הטקסט, הניגודיות ושאר הבחירות שלך בתפריט הנגישות.",
    duration: "עד שתאפס/י את התפריט או תמחק/י את נתוני האתר",
  },
  {
    name: "הודעת העוגיות (nextstep.cookieNotice.v1)",
    kind: "אחסון מקומי בדפדפן (localStorage)",
    purpose: "זוכר שכבר ראית את ההודעה על עוגיות, כדי שלא תופיע שוב.",
    duration: "עד שתמחק/י את נתוני האתר",
  },
  {
    name: "Vercel Web Analytics",
    kind: "מדידת כניסות בלי עוגיות",
    purpose: "סופר כמה אנשים נכנסים ולאילו עמודים. לא שומר דבר במכשיר ולא מזהה אותך.",
    duration: "לא נשמר במכשיר",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="מדיניות עוגיות"
      lead="עוגיות (Cookies) הן קבצים קטנים שאתר שומר בדפדפן. באתר הזה אין עוגיות פרסום, אין עוגיות מעקב ואין עוגיות של צד שלישי. יש רק מה שנחוץ כדי שהאתר יעבוד."
    >
      <section>
        <h2>מה נשמר במכשיר שלך</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200" tabIndex={0} role="region" aria-label="טבלת העוגיות והאחסון המקומי">
          <table className="w-full min-w-[640px] border-collapse text-sm leading-6">
            <caption className="sr-only">העוגיות והאחסון המקומי שהאתר משתמש בהם</caption>
            <thead className="bg-sand-100 text-navy-950">
              <tr>
                <th scope="col" className="p-3 text-start">שם</th>
                <th scope="col" className="p-3 text-start">סוג</th>
                <th scope="col" className="p-3 text-start">למה</th>
                <th scope="col" className="p-3 text-start">לכמה זמן</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-t border-sand-200 align-top">
                  <th scope="row" className="p-3 text-start font-semibold text-navy-950">{r.name}</th>
                  <td className="p-3">{r.kind}</td>
                  <td className="p-3">{r.purpose}</td>
                  <td className="p-3">{r.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>למה אין כאן כפתור ״אני מסכים/ה״</h2>
        <p>
          כל מה שמופיע בטבלה נחוץ כדי לתת את השירות שביקשת (התחברות, שמירת התשובות וההגדרות שלך), או שאינו שומר דבר במכשיר. לכן
          אנחנו מודיעים עליו ולא מבקשים הסכמה נפרדת. אם בעתיד נוסיף עוגיות שאינן הכרחיות, כמו עוגיות פרסום או מדידה מזהה, נבקש
          את הסכמתך מראש ונאפשר לסרב בלי לפגוע בשימוש באתר.
        </p>
      </section>

      <section>
        <h2>איך מוחקים או חוסמים</h2>
        <ul>
          <li>הכפתור כאן מוחק מהדפדפן הזה את התשובות, ההתקדמות, המועדפים ושאר הבחירות שנשמרו. את הגדרות הנגישות מאפסים בתפריט הנגישות עצמו.</li>
          <li>יציאה מהחשבון מוחקת את עוגיות ההתחברות.</li>
          <li>
            אפשר גם לחסום או למחוק עוגיות בהגדרות הדפדפן. אם תחסום/י עוגיות, האתר ימשיך לעבוד, אבל לא תוכל/י להתחבר לחשבון.
          </li>
        </ul>
        <div className="mt-4">
          <ClearDataButton />
        </div>
      </section>

      <section>
        <h2>עוד מידע</h2>
        <p>
          מה נשמר בחשבון ואיך מטפלים בו מוסבר ב<Link href="/privacy">מדיניות הפרטיות</Link>. לשאלות:
        </p>
        <ContactLines {...SITE_OPERATOR} />
      </section>
    </LegalPage>
  );
}
