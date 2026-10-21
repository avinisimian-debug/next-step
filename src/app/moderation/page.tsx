import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer, isModerator } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { REPORT_REASONS, STATUS_LABELS, type ReportReason } from "@/lib/community/labels";
import { userErrorMessage } from "@/lib/supabase/errors";
import { EmptyState, NotConfigured, Notice, PageHeader, card } from "@/components/ui/ui";
import { relativeDate } from "@/components/community/bits";
import { ReportActions } from "@/components/community/ReportActions";

export const metadata: Metadata = { title: "תור הדיווחים", robots: { index: false } };
export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  target_type: "question" | "answer";
  target_id: string;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

export default async function ModerationPage() {
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <NotConfigured feature="ניהול הקהילה" />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref("/moderation"));
  // Not a moderator: behave as if the page does not exist.
  if (!isModerator(viewer)) notFound();

  const { data, error } = await viewer.supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, created_at")
    .eq("status", "open")
    .order("created_at")
    .limit(100);
  const reports = (data ?? []) as ReportRow[];
  const qIds = reports.filter((r) => r.target_type === "question").map((r) => r.target_id);
  const aIds = reports.filter((r) => r.target_type === "answer").map((r) => r.target_id);
  const [qs, as, log] = await Promise.all([
    qIds.length ? viewer.supabase.from("questions").select("id, title, body, status").in("id", qIds) : { data: [] },
    aIds.length ? viewer.supabase.from("answers").select("id, body, status, question_id").in("id", aIds) : { data: [] },
    viewer.supabase.from("moderation_log").select("id, action, target_type, created_at").order("id", { ascending: false }).limit(15),
  ]);
  const targets = new Map<string, { text: string; status: "published" | "hidden" | "removed"; href: string }>();
  for (const q of qs.data ?? []) targets.set(q.id, { text: `${q.title}\n${q.body}`, status: q.status, href: `/community/${q.id}` });
  for (const a of as.data ?? []) targets.set(a.id, { text: a.body, status: a.status, href: `/community/${a.question_id}` });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader title="תור הדיווחים" lead="דיווחים פתוחים, מהישן לחדש. כל פעולה נרשמת ביומן." />
      {error && <Notice tone="error">{userErrorMessage(error)}</Notice>}
      {!error && reports.length === 0 && <EmptyState title="אין דיווחים פתוחים" />}
      <ul className="space-y-4">
        {reports.map((r) => {
          const t = targets.get(r.target_id);
          return (
            <li key={r.id} className={card}>
              <p className="text-sm text-stone-600">
                {r.target_type === "question" ? "שאלה" : "תשובה"} · {REPORT_REASONS[r.reason]} · {relativeDate(r.created_at)}
              </p>
              {r.details && <p className="mt-1 text-sm text-navy-900">פירוט המדווח/ת: {r.details}</p>}
              {t ? (
                <blockquote className="mt-3 line-clamp-6 whitespace-pre-line border-s-4 border-sand-300 ps-4 text-navy-900">{t.text}</blockquote>
              ) : (
                <p className="mt-3 text-sm text-stone-600">התוכן נמחק.</p>
              )}
              {t && (
                <p className="mt-2 text-xs text-stone-600">
                  מצב: {STATUS_LABELS[t.status]} ·{" "}
                  <Link href={t.href} className="underline">
                    לצפייה בהקשר
                  </Link>
                </p>
              )}
              <div className="mt-4">
                <ReportActions reportId={r.id} targetType={r.target_type} targetId={r.target_id} targetVisible={t?.status === "published"} />
              </div>
            </li>
          );
        })}
      </ul>
      {(log.data?.length ?? 0) > 0 && (
        <section aria-labelledby="h-log">
          <h2 id="h-log" className="font-display text-xl font-bold text-navy-950">
            פעולות אחרונות
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-600">
            {log.data!.map((l) => (
              <li key={l.id}>
                {relativeDate(l.created_at)} · {l.target_type === "question" ? "שאלה" : l.target_type === "answer" ? "תשובה" : "דיווח"} · {l.action}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
