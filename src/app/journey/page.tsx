import type { Metadata } from "next";
import { getViewer } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { userErrorMessage } from "@/lib/supabase/errors";
import { isStage } from "@/lib/journey/journey";
import { JourneyView, type AccountPlace } from "@/components/journey/JourneyView";

export const metadata: Metadata = { title: "המסע שלי", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const [viewer, catalog] = await Promise.all([getViewer(), getRepository().listPublic()]);

  let account: AccountPlace[] | null = null;
  let accountError: string | undefined;
  if (viewer.state === "signed_in") {
    const { data, error } = await viewer.supabase
      .from("saved_institutions")
      .select("institution_id, stage")
      .order("created_at", { ascending: false });
    if (error) accountError = userErrorMessage(error) ?? undefined;
    account = (data ?? []).map((r) => ({ institution_id: r.institution_id, stage: isStage(r.stage) ? r.stage : "interested" }));
  }

  return <JourneyView catalog={catalog} account={account} canSignIn={viewer.state === "anonymous"} accountError={accountError} />;
}
