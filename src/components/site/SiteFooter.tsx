import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy-950 print:hidden text-mist-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo tone="light" />
          <p className="max-w-sm text-sm leading-7">
            NEXT STEP עוזר לבוגרי תיכון להכיר מסלולים אחרי י״ב ולהשוות ביניהם. ההמלצות הן מידע בלבד ואינן מחליפות
            ייעוץ אישי, הכוונה רשמית לגיוס או פנייה ישירה למוסדות. האתר אינו קשור לצה״ל או למוסדות המופיעים בו.
          </p>
        </div>
        <nav aria-label="קישורים">
          <h2 className="mb-3 text-sm font-semibold text-paper">ניווט</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-paper" href="/questionnaire">השאלון</Link></li>
            <li><Link className="hover:text-paper" href="/results">ההמלצות שלי</Link></li>
            <li><Link className="hover:text-paper" href="/journey">המסע שלי</Link></li>
            <li><Link className="hover:text-paper" href="/compare">השוואה</Link></li>
            <li><Link className="hover:text-paper" href="/institutions">חיפוש מסגרות</Link></li>
            <li><Link className="hover:text-paper" href="/community">קהילה</Link></li>
            <li><Link className="hover:text-paper" href="/assistant">שאלו את העוזר</Link></li>
            <li><Link className="hover:text-paper" href="/my-path">מפת הדרך שלי</Link></li>
          </ul>
        </nav>
        <nav aria-label="מידע">
          <h2 className="mb-3 text-sm font-semibold text-paper">מידע</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-paper" href="/about">אודות והשיטה</Link></li>
            <li><Link className="hover:text-paper" href="/privacy">מדיניות פרטיות</Link></li>
            <li><Link className="hover:text-paper" href="/terms">תנאי שימוש</Link></li>
            <li><Link className="hover:text-paper" href="/accessibility">הצהרת נגישות</Link></li>
            <li><Link className="hover:text-paper" href="/credits">קרדיטים ומקורות</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-navy-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-mist-300 sm:px-6">
          המידע על המוסדות נאסף ממקורות ציבוריים ומוצג עם תאריך האימות. לפני החלטה יש לוודא את הפרטים העדכניים מול כל מוסד.
        </p>
      </div>
    </footer>
  );
}
