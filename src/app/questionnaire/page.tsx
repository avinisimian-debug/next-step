import type { Metadata } from "next";
import { Suspense } from "react";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";

export const metadata: Metadata = {
  title: "השאלון",
  description: "כמה שאלות קצרות על מה שחשוב לך, כדי למצוא את המסלולים שהכי מתאימים לך אחרי י״ב.",
};

export default function QuestionnairePage() {
  return (
    <Suspense>
      <Questionnaire />
    </Suspense>
  );
}
