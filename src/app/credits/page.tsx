import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { ALL_PHOTOS } from "@/lib/photos";

export const metadata: Metadata = {
  title: "קרדיטים ומקורות",
  description: "מאיפה התמונות, הגופנים והמידע באתר, ותחת איזה רישיון.",
};

export default function CreditsPage() {
  return (
    <LegalPage title="קרדיטים ומקורות" lead="תודה לכל מי שהתוכן שלו עוזר לבנות את ״הצעד הבא״.">
      <section>
        <h2>צילומים</h2>
        <p>
          כל הצילומים באתר לקוחים מוויקישיתוף (Wikimedia Commons) ומופיעים לפי הרישיון של כל אחד מהם. הצילומים ממחישים את
          המסלולים באופן כללי ואינם מציגים מוסד מסוים שמופיע באתר. צילומים ברישיון CC BY-SA הוקטנו והומרו לפורמט WebP, וגרסאות
          אלה זמינות לשימוש תחת אותו רישיון.
        </p>
        <ul className="!list-none !ps-0 space-y-4">
          {ALL_PHOTOS.map((p) => (
            <li key={p.source} className="flex gap-4">
              <Image src={p.src} alt="" width={96} height={64} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
              <div className="text-sm leading-6">
                <p className="!mt-0 font-medium text-navy-950">{p.alt}</p>
                <p className="!mt-0">
                  צילום: {p.author} · רישיון:{" "}
                  {p.licenseUrl ? (
                    <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer">
                      {p.license}
                    </a>
                  ) : (
                    p.license
                  )}{" "}
                  ·{" "}
                  <a href={p.source} target="_blank" rel="noopener noreferrer">
                    לדף המקור
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>גופנים ואייקונים</h2>
        <ul>
          <li>
            הגופנים Heebo ו־Frank Ruhl Libre, ברישיון{" "}
            <a href="https://openfontlicense.org" target="_blank" rel="noopener noreferrer">
              SIL Open Font License
            </a>
            .
          </li>
          <li>
            האייקונים מ־
            <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">
              Lucide
            </a>
            , ברישיון ISC.
          </li>
        </ul>
      </section>

      <section>
        <h2>המידע על המוסדות</h2>
        <p>
          המידע על כל מוסד נאסף ממקורות ציבוריים, ובראשם האתרים הרשמיים של המוסדות. בעמוד של כל מוסד מופיעים המקורות שעליהם
          התבססנו ותאריך הבדיקה האחרון. השיטה מוסברת בדף <Link href="/about">אודות והשיטה</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
