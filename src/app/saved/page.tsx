import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth/viewer";
import { getRepository } from "@/lib/data/repository";
import { loginHref } from "@/lib/auth/redirect";
import { userErrorMessage } from "@/lib/supabase/errors";
import { ButtonLink, EmptyState, Notice, PageHeader, card } from "@/components/ui/ui";
import { Location, VerificationBadge } from "@/components/institution/bits";
import { DeviceFavorites } from "@/components/saved/DeviceFavorites";
import { SavedControls } from "@/components/saved/SavedNote";

export const metadata: Metadata = { title: "המסגרות ששמרתי", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const [viewer, catalog] = await Promise.all([getViewer(), getRepository().listPublic()]);
  const entries = catalog.map(({ id, slug, name, typeLabel }) => ({ id, slug, name, typeLabel }));

  if (viewer.state !== "signed_in") {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
        <PageHeader title="המסגרות ששמרתי" lead="בלי חשבון, המסגרות נשמרות רק בדפדפן הזה." />
        {viewer.state === "anonymous" && (
          <Notice title="רוצים לשמור בחשבון?">
            עם חשבון, המסגרות השמורות זמינות מכל מכשיר.{" "}
            <Link href={loginHref("/saved")} className="font-medium underline">
              להתחברות
            </Link>
          </Notice>
        )}
        <DeviceFavorites catalog={entries} canImport={false} />
        <EmptyState title="איך שומרים מסגרת?" action={<ButtonLink href="/institutions">לחיפוש מסגרות</ButtonLink>}>
          בעמוד של כל מסגרת יש כפתור ״שמירה״.
        </EmptyState>
      </div>
    );
  }

  const { data, error } = await viewer.supabase
    .from("saved_institutions")
    .select("institution_id, note, created_at")
    .order("created_at", { ascending: false });
  const byId = new Map(catalog.map((i) => [i.id, i]));
  const saved = (data ?? [])
    .map((row) => ({ row, inst: byId.get(row.institution_id) }))
    .filter((x): x is { row: typeof x.row; inst: NonNullable<typeof x.inst> } => Boolean(x.inst));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader title="המסגרות ששמרתי" lead="שמורות בחשבון שלך. ההערות פרטיות ולא מוצגות לאף אחד אחר.">
        {saved.length >= 2 && (
          <ButtonLink variant="secondary" href="/compare">
            להשוואה
          </ButtonLink>
        )}
      </PageHeader>
      {error && <Notice tone="error">{userErrorMessage(error)}</Notice>}
      <DeviceFavorites catalog={entries} canImport />
      {!error && saved.length === 0 ? (
        <EmptyState title="עדיין לא שמרת מסגרות" action={<ButtonLink href="/institutions">לחיפוש מסגרות</ButtonLink>}>
          בעמוד של כל מסגרת יש כפתור ״שמירה״.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {saved.map(({ row, inst }) => (
            <li key={inst.id} className={card}>
              <p className="text-xs font-medium text-teal-700">{inst.typeLabel}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
                <Link href={`/institutions/${inst.slug}`} className="underline-offset-4 hover:underline">
                  {inst.name}
                </Link>
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Location inst={inst} />
                <VerificationBadge inst={inst} />
              </div>
              <SavedControls institutionId={inst.id} name={inst.name} note={row.note} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
