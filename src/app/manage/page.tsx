import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getViewer, isAdmin } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { ROLE_LABELS } from "@/lib/community/labels";
import type { Role } from "@/lib/auth/viewer";
import { userErrorMessage } from "@/lib/supabase/errors";
import { EmptyState, NotConfigured, Notice, PageHeader, card } from "@/components/ui/ui";

export const metadata: Metadata = { title: "ניהול: נרשמים", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Signup {
  email: string;
  display_name: string | null;
  role: Role;
  signed_up_at: string;
  last_sign_in_at: string | null;
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" }) : "—");

/** Admins only: how many people signed up, and who. Emails come from a database function that checks the role. */
export default async function ManagePage() {
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <NotConfigured feature="אזור הניהול" standalone />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref("/manage"));
  // Not an admin: behave as if the page does not exist.
  if (!isAdmin(viewer)) notFound();

  const { data, error } = await viewer.supabase.rpc("admin_signups");
  const rows = (data ?? []) as Signup[];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = rows.filter((r) => new Date(r.signed_up_at).getTime() >= weekAgo).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader
        title="נרשמים"
        lead="כל מי שפתח חשבון באתר. המידע הזה פרטי: אין להעביר אותו לאחרים, ויש להשתמש בו רק כפי שמתואר במדיניות הפרטיות."
      />
      {error && <Notice tone="error">{userErrorMessage(error)}</Notice>}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <dt className="text-sm text-navy-800">סך הכול נרשמים</dt>
          <dd className="mt-1 font-display text-4xl font-bold text-navy-950">{rows.length}</dd>
        </div>
        <div className={card}>
          <dt className="text-sm text-navy-800">נרשמו בשבוע האחרון</dt>
          <dd className="mt-1 font-display text-4xl font-bold text-navy-950">{thisWeek}</dd>
        </div>
      </dl>

      {!error && rows.length === 0 && <EmptyState title="עדיין אין נרשמים" />}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-sand-200" tabIndex={0} role="region" aria-label="טבלת הנרשמים">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">רשימת הנרשמים, מהחדש לישן</caption>
            <thead className="bg-sand-100 text-navy-950">
              <tr>
                <th scope="col" className="p-3 text-start">דוא״ל</th>
                <th scope="col" className="p-3 text-start">שם תצוגה</th>
                <th scope="col" className="p-3 text-start">תפקיד</th>
                <th scope="col" className="p-3 text-start">נרשם/ה</th>
                <th scope="col" className="p-3 text-start">כניסה אחרונה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} className="border-t border-sand-200">
                  <th scope="row" className="ltr p-3 text-start font-medium text-navy-950">{r.email}</th>
                  <td className="p-3">{r.display_name ?? "—"}</td>
                  <td className="p-3">{ROLE_LABELS[r.role]}</td>
                  <td className="p-3">{date(r.signed_up_at)}</td>
                  <td className="p-3">{date(r.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
