import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { getViewer, isModerator } from "@/lib/auth/viewer";
import { loginHref } from "@/lib/auth/redirect";
import { getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO } from "@/lib/domain/pathways";
import { getQuestion, listAnswers, myHelpfulMarks } from "@/lib/community/queries";
import { STATUS_LABELS } from "@/lib/community/labels";
import { userErrorMessage } from "@/lib/supabase/errors";
import { ButtonLink, NotConfigured, Notice, card } from "@/components/ui/ui";
import { AuthorLine, ContentLabel } from "@/components/community/bits";
import { AnswerForm } from "@/components/community/AnswerForm";
import { HelpfulButton, ReportButton } from "@/components/community/PostActions";
import { ModerationControls } from "@/components/community/ModerationControls";

export const dynamic = "force-dynamic";

const uuid = z.string().uuid();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === "unconfigured" || !uuid.safeParse(id).success) return { title: "שאלה" };
  const { question } = await getQuestion(viewer.supabase, id);
  return question ? { title: question.title, robots: question.status === "published" ? undefined : { index: false } } : { title: "לא נמצא" };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const [viewer, catalog] = await Promise.all([getViewer(), getRepository().listPublic()]);
  if (viewer.state === "unconfigured")
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <NotConfigured feature="הקהילה" standalone />
      </div>
    );

  const { question, error } = await getQuestion(viewer.supabase, id);
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <Notice tone="error" title="לא הצלחנו לטעון את השאלה">
          {userErrorMessage(error)}
        </Notice>
      </div>
    );
  if (!question) notFound();

  const { answers, error: answersError } = await listAnswers(viewer.supabase, id);
  const signedIn = viewer.state === "signed_in";
  const marks = signedIn ? await myHelpfulMarks(viewer.supabase, answers.map((a) => a.id)) : new Set<string>();
  const instName = (iid: string) => catalog.find((i) => i.id === iid)?.name;
  const institution = question.institution_id ? catalog.find((i) => i.id === question.institution_id) : undefined;
  const canOfficial =
    signedIn &&
    viewer.profile.role === "representative" &&
    Boolean(question.institution_id) &&
    viewer.profile.represented_institution_id === question.institution_id;
  const moderator = isModerator(viewer);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:py-16">
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 hover:underline">
        <ArrowRight className="size-4" aria-hidden="true" />
        לכל השאלות
      </Link>

      <article className={card} aria-labelledby="q-title">
        <div className="flex flex-wrap items-center gap-2">
          {question.is_test && <ContentLabel kind="test" />}
          {question.status !== "published" && (
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {STATUS_LABELS[question.status]} — רק את/ה {moderator ? "ומנהלי הקהילה" : ""} רואים את השאלה
            </span>
          )}
          {question.pathway && <span className="text-xs font-medium text-teal-700">{PATHWAY_INFO[question.pathway].name}</span>}
          {institution && (
            <Link href={`/institutions/${institution.slug}`} className="text-xs text-stone-600 underline underline-offset-2">
              {institution.name}
            </Link>
          )}
        </div>
        <h1 id="q-title" className="mt-2 font-display text-3xl font-bold text-navy-950">
          {question.title}
        </h1>
        <div className="mt-2">
          <AuthorLine author={question.author} createdAt={question.created_at} institutionName={instName} />
        </div>
        <p className="mt-4 whitespace-pre-line leading-8 text-navy-900">{question.body}</p>
        <div className="mt-4 flex flex-wrap items-start gap-2">
          {signedIn && viewer.userId !== question.author_id && <ReportButton targetType="question" targetId={question.id} />}
          {moderator && <ModerationControls targetType="question" targetId={question.id} status={question.status} />}
        </div>
      </article>

      <section aria-labelledby="h-answers">
        <h2 id="h-answers" className="font-display text-2xl font-bold text-navy-950">
          {answers.length === 0 ? "אין עדיין תשובות" : answers.length === 1 ? "תשובה אחת" : `${answers.length} תשובות`}
        </h2>
        {answersError && (
          <div className="mt-4">
            <Notice tone="error">{userErrorMessage(answersError)}</Notice>
          </div>
        )}
        <ul className="mt-4 space-y-4">
          {answers.map((a) => (
            <li key={a.id} className={`${card} ${a.kind === "official" ? "border-teal-600/40" : ""}`} data-answer-kind={a.kind}>
              <div className="flex flex-wrap items-center gap-2">
                <ContentLabel kind={a.kind} />
                {a.status !== "published" && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">{STATUS_LABELS[a.status]}</span>
                )}
              </div>
              <div className="mt-2">
                <AuthorLine author={a.author} createdAt={a.created_at} institutionName={instName} />
              </div>
              <p className="mt-3 whitespace-pre-line leading-7 text-navy-900">{a.body}</p>
              <div className="mt-3 flex flex-wrap items-start gap-2">
                <HelpfulButton
                  answerId={a.id}
                  questionId={question.id}
                  count={a.helpful_count}
                  marked={marks.has(a.id)}
                  disabledReason={!signedIn ? "צריך להתחבר כדי לסמן" : viewer.userId === a.author_id ? "אי אפשר לסמן תשובה שלך" : undefined}
                />
                {signedIn && viewer.userId !== a.author_id && <ReportButton targetType="answer" targetId={a.id} />}
                {moderator && <ModerationControls targetType="answer" targetId={a.id} status={a.status} />}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="h-reply">
        <h2 id="h-reply" className="font-display text-xl font-bold text-navy-950">
          לענות על השאלה
        </h2>
        <div className="mt-4">
          {question.status !== "published" ? (
            <p className="text-sm text-stone-600">אי אפשר לענות על שאלה שהוסתרה.</p>
          ) : signedIn ? (
            <AnswerForm questionId={question.id} canAnswerOfficially={canOfficial} institutionName={institution?.name} />
          ) : (
            <ButtonLink href={loginHref(`/community/${question.id}`)}>להתחבר כדי לענות</ButtonLink>
          )}
        </div>
      </section>
    </div>
  );
}
