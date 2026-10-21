import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Bookmark, LogOut, Map, MessagesSquare, ShieldCheck } from "lucide-react";
import { getViewer, isModerator } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { ROLE_LABELS } from "@/lib/community/labels";
import { getRepository } from "@/lib/data/repository";
import { userErrorMessage } from "@/lib/supabase/errors";
import { NotConfigured, Notice, PageHeader, card } from "@/components/ui/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signOut } from "@/app/login/actions";
import { NameForm } from "./NameForm";
import { markNotificationsRead } from "./actions";

export const metadata: Metadata = { title: "החשבון שלי", robots: { index: false } };
export const dynamic = "force-dynamic";

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });

export default async function AccountPage() {
  const viewer = await getViewer();
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <NotConfigured feature="החשבון האישי" />
      </div>
    );
  if (viewer.state === "anonymous") redirect(loginHref("/account"));

  const { data: notes, error } = await viewer.supabase
    .from("notifications")
    .select("id, kind, read_at, created_at, question:questions(id, title)")
    .order("created_at", { ascending: false })
    .limit(20);
  const unread = (notes ?? []).filter((n) => !n.read_at).length;
  const represented = viewer.profile.represented_institution_id
    ? (await getRepository().listPublic()).find((i) => i.id === viewer.profile.represented_institution_id)
    : undefined;

  const links = [
    { href: "/saved", label: "המסגרות ששמרתי", Icon: Bookmark },
    { href: "/my-path", label: "מפת הדרך שלי", Icon: Map },
    { href: "/community?mine=1", label: "השאלות שלי בקהילה", Icon: MessagesSquare },
    ...(isModerator(viewer) ? [{ href: "/moderation", label: "תור הדיווחים", Icon: ShieldCheck }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:py-16">
      <PageHeader title="החשבון שלי">
        <form action={signOut}>
          <SubmitButton variant="ghost" pendingLabel="מתנתק…">
            <LogOut className="size-4" aria-hidden="true" />
            התנתקות
          </SubmitButton>
        </form>
      </PageHeader>

      <section className={card} aria-labelledby="h-profile">
        <h2 id="h-profile" className="font-display text-xl font-bold text-navy-950">
          פרטים
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="text-stone-600">מייל</dt>
          <dd className="ltr text-navy-900 sm:text-right">{viewer.email}</dd>
          <dt className="text-stone-600">תפקיד</dt>
          <dd className="text-navy-900">
            {ROLE_LABELS[viewer.profile.role]}
            {represented && ` · ${represented.name}`}
          </dd>
        </dl>
        <div className="mt-5">
          <NameForm current={viewer.profile.display_name} />
        </div>
      </section>

      <nav aria-label="האזור האישי">
        <ul className="grid gap-3 sm:grid-cols-2">
          {links.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className={`${card} flex items-center gap-3 !p-4 font-medium text-navy-900 transition hover:shadow-lift`}>
                <Icon className="size-5 text-teal-700" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={card} aria-labelledby="h-notes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-notes" className="flex items-center gap-2 font-display text-xl font-bold text-navy-950">
            <Bell className="size-5" aria-hidden="true" />
            התראות {unread > 0 && <span className="rounded-full bg-navy-900 px-2 py-0.5 text-xs text-paper">{unread} חדשות</span>}
          </h2>
          {unread > 0 && (
            <form action={markNotificationsRead}>
              <SubmitButton variant="ghost" pendingLabel="מסמן…">
                סימון הכול כנקרא
              </SubmitButton>
            </form>
          )}
        </div>
        {error ? (
          <div className="mt-4">
            <Notice tone="error">{userErrorMessage(error)}</Notice>
          </div>
        ) : !notes?.length ? (
          <p className="mt-3 text-sm text-stone-600">אין התראות. כשמישהו יענה על שאלה שלך, זה יופיע כאן.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand-200">
            {notes.map((n) => {
              const q = Array.isArray(n.question) ? n.question[0] : n.question;
              return (
                <li key={n.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <span className={n.read_at ? "text-stone-600" : "font-medium text-navy-950"}>
                    תשובה חדשה לשאלה{" "}
                    {q ? (
                      <Link href={`/community/${q.id}`} className="underline underline-offset-4">
                        {q.title}
                      </Link>
                    ) : (
                      "שהוסרה"
                    )}
                  </span>
                  <time dateTime={n.created_at} className="text-xs text-stone-600">
                    {dateTime(n.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
