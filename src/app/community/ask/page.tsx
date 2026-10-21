import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { getRepository } from "@/lib/data/repository";
import { NotConfigured, PageHeader } from "@/components/ui/ui";
import { AskForm } from "@/components/community/AskForm";

export const metadata: Metadata = { title: "שאלה חדשה", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ institution?: string }> }) {
  const { institution } = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <NotConfigured feature="הקהילה" />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref(`/community/ask${institution ? `?institution=${encodeURIComponent(institution)}` : ""}`));
  const catalog = await getRepository().listPublic();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:py-16">
      <PageHeader title="שאלה חדשה" lead="שאלה ברורה מקבלת תשובות טובות יותר. כדאי לבדוק קודם אם מישהו כבר שאל משהו דומה." />
      <AskForm
        institutions={catalog.map((i) => ({ id: i.id, name: i.name }))}
        defaultInstitution={catalog.some((i) => i.id === institution) ? institution : undefined}
      />
    </div>
  );
}
