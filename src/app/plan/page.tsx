import type { Metadata } from "next";
import { getRepository } from "@/lib/data/repository";
import { PlanView } from "@/components/plan/PlanView";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "תוכנית הפעולה שלי",
  description: "צעדים מעשיים להמשך, לפי ההמלצות שקיבלת: מה לבדוק, עם מי לדבר ומתי.",
  robots: { index: false },
};

export default async function PlanPage() {
  const catalog = await getRepository().listPublic();
  return <PlanView catalog={catalog} />;
}
