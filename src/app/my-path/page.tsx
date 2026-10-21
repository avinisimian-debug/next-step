import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { getRepository } from "@/lib/data/repository";
import { userErrorMessage } from "@/lib/supabase/errors";
import { EmptyState, NotConfigured, Notice, PageHeader, card } from "@/components/ui/ui";
import { StepList, type StepView } from "@/components/path/StepList";
import { AddStepForm } from "@/components/path/AddStepForm";
import { ImportFromPlan } from "@/components/path/ImportFromPlan";

export const metadata: Metadata = { title: "מפת הדרך שלי", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyPathPage() {
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <NotConfigured feature="מפת הדרך האישית" />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref("/my-path"));

  const [catalog, res] = await Promise.all([
    getRepository().listPublic(),
    viewer.supabase.from("pathway_steps").select("id, title, detail, status, due_date, institution_id").order("position").order("created_at"),
  ]);
  const byId = new Map(catalog.map((i) => [i.id, i]));
  const steps: StepView[] = (res.data ?? []).map((s) => {
    const inst = s.institution_id ? byId.get(s.institution_id) : undefined;
    return { ...s, institution: inst ? { name: inst.name, slug: inst.slug } : null };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:py-16">
      <PageHeader
        title="מפת הדרך שלי"
        lead="הצעדים שלך לקראת ההחלטה — שמורים בחשבון ופרטיים לך בלבד. אפשר להוסיף, לעדכן מצב ולסדר מחדש."
      />
      <ImportFromPlan catalog={catalog} />
      {res.error ? (
        <Notice tone="error">{userErrorMessage(res.error)}</Notice>
      ) : steps.length ? (
        <StepList steps={steps} />
      ) : (
        <EmptyState title="המפה עדיין ריקה">אפשר להוסיף צעד ראשון למטה, או להעתיק את תוכנית הפעולה מהשאלון.</EmptyState>
      )}
      <section className={card} aria-labelledby="h-add">
        <h2 id="h-add" className="font-display text-xl font-bold text-navy-950">
          צעד חדש
        </h2>
        <div className="mt-4">
          <AddStepForm institutions={catalog.map((i) => ({ id: i.id, name: i.name }))} />
        </div>
      </section>
    </div>
  );
}
