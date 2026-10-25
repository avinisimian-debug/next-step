import type { Metadata } from "next";
import { getRepository } from "@/lib/data/repository";
import { CompareView } from "@/components/compare/CompareView";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "השוואה",
  description: "השוואה צד לצד בין עד שלוש מסגרות: לימוד, שירות, מיקום, משך, עלויות ותנאי קבלה.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const catalog = await getRepository().listPublic();
  return <CompareView catalog={catalog} />;
}
