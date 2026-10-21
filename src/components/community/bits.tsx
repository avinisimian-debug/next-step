import { BadgeCheck, ShieldCheck } from "lucide-react";
import { CONTENT_LABELS } from "@/lib/community/labels";
import type { Author } from "@/lib/community/queries";

export function ContentLabel({ kind }: { kind: keyof typeof CONTENT_LABELS }) {
  const { text, tone } = CONTENT_LABELS[kind];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{text}</span>;
}

export const relativeDate = (iso: string) =>
  new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem" });

/** Author name and any verified role. Roles come from the database, never from what the author typed. */
export function AuthorLine({
  author,
  createdAt,
  institutionName,
}: {
  author: Author | null;
  createdAt: string;
  institutionName?: (id: string) => string | undefined;
}) {
  const rep = author?.role === "representative" && author.represented_institution_id;
  const repName = rep && institutionName ? institutionName(author.represented_institution_id!) : undefined;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
      <span className="font-medium text-navy-900">{author?.display_name ?? "משתמש/ת"}</span>
      {rep && (
        <span className="inline-flex items-center gap-1 text-teal-700">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          נציג/ה מאומת/ת{repName ? ` של ${repName}` : ""}
        </span>
      )}
      {(author?.role === "moderator" || author?.role === "admin") && (
        <span className="inline-flex items-center gap-1 text-navy-800">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          מנהל/ת קהילה
        </span>
      )}
      <span aria-hidden="true">·</span>
      <time dateTime={createdAt}>{relativeDate(createdAt)}</time>
    </p>
  );
}
