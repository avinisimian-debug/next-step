import type { Metadata } from "next";
import Link from "next/link";
import { isAiConfigured } from "@/lib/ai/explain";
import { PageHeader } from "@/components/ui/ui";
import { AssistantForm } from "@/components/assistant/AssistantForm";

export const metadata: Metadata = {
  title: "שאלו את העוזר",
  description: "עוזר שעונה רק מתוך המידע המאומת במאגר ומהקהילה, עם מקור לכל טענה.",
};
export const dynamic = "force-dynamic";

export default function AssistantPage() {
  const available = isAiConfigured();
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:py-16">
      <PageHeader
        title="שאלו את העוזר"
        lead="העוזר עונה רק מתוך המידע שבמאגר ומשאלות שנענו בקהילה, ומציין מקור לכל טענה. אם אין מספיק מידע — הוא יגיד את זה ולא ינחש."
      />
      {available ? (
        <>
          <AssistantForm />
          <p className="text-xs leading-5 text-stone-600">
            השאלה שלך נשלחת לשירות בינה מלאכותית (Anthropic) יחד עם קטעי המידע הרלוונטיים מהמאגר, כדי לנסח תשובה. אל תכתבו פרטים מזהים. התשובות
            לא נשמרות אצלנו. העוזר יכול לטעות — לפני החלטה כדאי לוודא את הפרטים מול המסגרת.{" "}
            <Link href="/privacy" className="underline">
              פרטיות
            </Link>
          </p>
        </>
      ) : (
        <div role="status" className="rounded-3xl border border-dashed border-sand-300 p-8 text-center">
          <p className="font-display text-xl font-bold text-navy-950">העוזר לא זמין באתר הזה כרגע</p>
          <p className="mx-auto mt-2 max-w-lg leading-7 text-stone-600">
            הוא דורש חיבור לשירות בינה מלאכותית, והחיבור לא הוגדר. במקום תשובה מומצאת — אפשר לחפש במאגר או לשאול בקהילה.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/institutions" className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-paper">
              חיפוש מסגרות
            </Link>
            <Link href="/community" className="rounded-full border border-navy-900 px-5 py-2.5 text-sm font-medium text-navy-900">
              לקהילה
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
