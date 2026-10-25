import type { Metadata } from "next";
import { Suspense } from "react";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";
import { Loading } from "@/components/site/Loading";

export const metadata: Metadata = {
  title: "השאלון",
  description: "כמה שאלות קצרות על מה שחשוב לך, כדי למצוא את המסלולים שהכי מתאימים לך אחרי י״ב.",
  alternates: { canonical: "/questionnaire" },
};

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<Loading title="השאלון" label="טוען את השאלון…" />}>
      <Questionnaire />
    </Suspense>
  );
}
