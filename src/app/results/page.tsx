import type { Metadata } from "next";
import { getRepository } from "@/lib/data/repository";
import { ResultsView } from "@/components/results/ResultsView";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ההמלצות שלי",
  description: "שלושה כיוונים שכדאי לך להכיר, לפי התשובות שלך — עם הסבר למה הם מתאימים ומה כדאי לבדוק.",
  robots: { index: false },
};

export default async function ResultsPage() {
  const catalog = await getRepository().listPublic();
  return <ResultsView catalog={catalog} />;
}
