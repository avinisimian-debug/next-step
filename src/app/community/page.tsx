import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleQuestion, Search } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { PATHWAYS, type Pathway } from "@/lib/domain/types";
import { listQuestions, type QuestionFilters } from "@/lib/community/queries";
import { STATUS_LABELS } from "@/lib/community/labels";
import { userErrorMessage } from "@/lib/supabase/errors";
import { ButtonLink, EmptyState, NotConfigured, Notice, PageHeader, inputStyles } from "@/components/ui/ui";
import { AuthorLine, ContentLabel } from "@/components/community/bits";

export const metadata: Metadata = {
  title: "קהילה",
  description: "שאלות ותשובות על המסלולים והמסגרות — מניסיון אישי של אנשים, ותשובות רשמיות מנציגים מאומתים.",
  alternates: { canonical: "/community" },
};
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (Array.isArray(p[k]) ? p[k][0] : p[k]);

export default async function CommunityPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [viewer, catalog] = await Promise.all([getViewer(), getRepository().listPublic()]);
  const instName = (id: string) => catalog.find((i) => i.id === id)?.name;

  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <PageHeader title="קהילה" />
        <div className="mt-8">
          <NotConfigured feature="הקהילה" />
        </div>
      </div>
    );

  const pathway = one(params, "pathway");
  const institution = one(params, "institution");
  const filters: QuestionFilters = {
    q: (one(params, "q") ?? "").trim().slice(0, 100),
    pathway: PATHWAYS.includes(pathway as Pathway) ? (pathway as Pathway) : null,
    institution: institution && catalog.some((i) => i.id === institution) ? institution : null,
    unanswered: one(params, "unanswered") === "1",
    mineOf: one(params, "mine") === "1" && viewer.state === "signed_in" ? viewer.userId : null,
    page: Math.max(1, Math.min(50, Number.parseInt(one(params, "page") ?? "1", 10) || 1)),
  };
  const { questions, hasMore, error } = await listQuestions(viewer.supabase, filters);
  const pageHref = (page: number) => {
    const p = new URLSearchParams();
    for (const k of ["q", "pathway", "institution", "unanswered", "mine"]) {
      const v = one(params, k);
      if (v) p.set(k, v);
    }
    if (page > 1) p.set("page", String(page));
    return `/community${p.size ? `?${p}` : ""}`;
  };
  const askHref = `/community/ask${filters.institution ? `?institution=${filters.institution}` : ""}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader
        title={filters.mineOf ? "השאלות שלי" : "קהילה"}
        lead="שאלות ותשובות של תלמידים, הורים ובוגרים. תשובות בקהילה הן ניסיון אישי — לא מידע רשמי, אלא אם מסומנות כתשובה רשמית של המסגרת."
      >
        <ButtonLink href={viewer.state === "signed_in" ? askHref : loginHref(askHref)}>
          <MessageCircleQuestion className="size-4" aria-hidden="true" />
          לשאול שאלה
        </ButtonLink>
      </PageHeader>

      <form role="search" action="/community" className="grid gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-5 sm:grid-cols-[1fr_auto_auto_auto]">
        {filters.mineOf && <input type="hidden" name="mine" value="1" />}
        <label htmlFor="cq" className="sr-only">
          חיפוש שאלות
        </label>
        <input id="cq" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="חיפוש שאלות" className={inputStyles} />
        <label htmlFor="cpathway" className="sr-only">
          מסלול
        </label>
        <select id="cpathway" name="pathway" defaultValue={filters.pathway ?? ""} className={inputStyles}>
          <option value="">כל המסלולים</option>
          {PATHWAY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PATHWAY_INFO[p].name}
            </option>
          ))}
        </select>
        <label htmlFor="cinst" className="sr-only">
          מסגרת
        </label>
        <select id="cinst" name="institution" defaultValue={filters.institution ?? ""} className={inputStyles}>
          <option value="">כל המסגרות</option>
          {catalog.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-medium text-paper hover:bg-navy-800">
          <Search className="size-4" aria-hidden="true" />
          חיפוש
        </button>
        <label className="flex items-center gap-2 text-sm text-navy-900 sm:col-span-4">
          <input type="checkbox" name="unanswered" value="1" defaultChecked={filters.unanswered} className="size-5 accent-teal-700" />
          רק שאלות שעוד אין להן תשובה
        </label>
      </form>

      {error ? (
        <Notice tone="error" title="לא הצלחנו לטעון את השאלות">
          {userErrorMessage(error)}
        </Notice>
      ) : questions.length === 0 ? (
        <EmptyState
          title={filters.q || filters.pathway || filters.institution || filters.unanswered ? "לא נמצאו שאלות" : "עדיין אין שאלות"}
          action={<ButtonLink href={viewer.state === "signed_in" ? askHref : loginHref(askHref)}>לשאול את השאלה הראשונה</ButtonLink>}
        >
          {filters.q ? "אפשר לנסות מילים אחרות, או לשאול בעצמך." : "הקהילה חדשה. שאלה טובה עוזרת גם לאחרים שמתלבטים כמוך."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="rounded-3xl border border-sand-200 bg-paper p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                {q.is_test && <ContentLabel kind="test" />}
                {q.status !== "published" && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">{STATUS_LABELS[q.status]}</span>
                )}
                {q.pathway && <span className="text-xs font-medium text-teal-700">{PATHWAY_INFO[q.pathway].name}</span>}
                {q.institution_id && instName(q.institution_id) && <span className="text-xs text-stone-600">· {instName(q.institution_id)}</span>}
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
                <Link href={`/community/${q.id}`} className="underline-offset-4 hover:underline">
                  {q.title}
                </Link>
              </h2>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-navy-800">{q.body}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <AuthorLine author={q.author} createdAt={q.created_at} institutionName={instName} />
                <span className="text-sm text-stone-600">{q.answer_count === 0 ? "אין עדיין תשובות" : q.answer_count === 1 ? "תשובה אחת" : `${q.answer_count} תשובות`}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(filters.page > 1 || hasMore) && (
        <nav aria-label="דפים" className="flex justify-between">
          {filters.page > 1 ? <Link href={pageHref(filters.page - 1)} className="underline">הקודם</Link> : <span />}
          {hasMore && <Link href={pageHref(filters.page + 1)} className="underline">הבא</Link>}
        </nav>
      )}
    </div>
  );
}
