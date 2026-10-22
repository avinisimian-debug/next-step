import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO } from "@/lib/domain/pathways";
import type { Pathway } from "@/lib/domain/types";
import { userErrorMessage } from "@/lib/supabase/errors";
import { EmptyState, NotConfigured, Notice, PageHeader, card } from "@/components/ui/ui";
import { ReviewRow } from "@/components/registry/ReviewRow";

export const metadata: Metadata = { title: "בדיקת רשימות ייחוס", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Entry {
  id: string;
  registry: string;
  category: Pathway;
  external_name: string;
  location: string | null;
  source_url: string;
  retrieved_on: string;
  status: string;
  notes: string | null;
}

const STATUS = { matched: "הותאם", unresolved: "חסר במאגר", ambiguous: "דורש בדיקה", inactive: "לא פעילה", not_applicable: "לא רלוונטי" } as const;

export default async function RegistryReviewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <NotConfigured feature="בדיקת רשימות הייחוס" standalone />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref("/registry-review"));
  if (viewer.profile.role !== "admin") notFound();

  const filter = status && status in STATUS ? status : "ambiguous";
  const [{ data, error }, counts, catalog] = await Promise.all([
    viewer.supabase.from("registry_entries").select("id, registry, category, external_name, location, source_url, retrieved_on, status, notes").eq("status", filter).order("external_name").limit(200),
    viewer.supabase.from("registry_entries").select("status"),
    getRepository().listPublic(),
  ]);
  const tally = new Map<string, number>();
  for (const r of counts.data ?? []) tally.set(r.status, (tally.get(r.status) ?? 0) + 1);
  const entries = (data ?? []) as Entry[];
  const candidatesOf = (notes: string | null) => (notes?.match(/^candidates: (.*)$/)?.[1].split(", ") ?? []);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader
        title="בדיקת רשימות ייחוס"
        lead="רשומות מרשימות רשמיות שההתאמה האוטומטית לא הכריעה בהן. הוספת מסגרת חדשה למאגר עדיין דורשת אימות מול מקור רשמי."
      />
      <nav aria-label="סינון לפי מצב">
        <ul className="flex flex-wrap gap-2">
          {Object.entries(STATUS).map(([k, label]) => (
            <li key={k}>
              <Link
                href={`/registry-review?status=${k}`}
                aria-current={filter === k ? "page" : undefined}
                className={`inline-flex rounded-full px-4 py-2 text-sm ${filter === k ? "bg-navy-900 text-paper" : "border border-sand-300 text-navy-900"}`}
              >
                {label} ({tally.get(k) ?? 0})
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {error && <Notice tone="error">{userErrorMessage(error)}</Notice>}
      {!error && entries.length === 0 && <EmptyState title="אין רשומות במצב הזה" />}
      <ul className="space-y-4">
        {entries.map((e) => (
          <li key={e.id} className={card}>
            <p className="text-xs text-stone-600">
              {PATHWAY_INFO[e.category].name} ·{" "}
              <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="underline">
                {e.registry}
              </a>{" "}
              · נאסף {e.retrieved_on} · {STATUS[e.status as keyof typeof STATUS]}
            </p>
            <p className="mt-1 font-display text-lg font-bold text-navy-950">{e.external_name}</p>
            {e.location && <p className="text-sm text-stone-600">{e.location}</p>}
            <ReviewRow id={e.id} candidates={candidatesOf(e.notes)} notes={e.notes} options={catalog.map((i) => ({ id: i.id, name: i.name }))} />
          </li>
        ))}
      </ul>
    </div>
  );
}
