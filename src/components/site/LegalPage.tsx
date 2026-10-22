import { LEGAL_UPDATED } from "@/lib/site";

/** Shared layout for the accessibility statement, terms, privacy and credits pages. */
export function LegalPage({ title, lead, children }: { title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-navy-950 sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 text-lg leading-8 text-navy-800">{lead}</p>}
      <div className="mt-10 space-y-10 leading-8 text-navy-800 [&_a]:font-medium [&_a]:text-teal-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-navy-950 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-6 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-6">
        {children}
      </div>
      <p className="mt-12 text-sm text-mist-500">
        עודכן לאחרונה: <time dateTime={LEGAL_UPDATED}>{new Date(LEGAL_UPDATED).toLocaleDateString("he-IL")}</time>
      </p>
    </div>
  );
}

/** Contact lines for the site operator; phone and email are links so they work with one tap. */
export function ContactLines({ name, email, phone, phoneHref }: { name: string; email: string; phone: string; phoneHref: string }) {
  return (
    <ul>
      <li>שם: {name}</li>
      <li>
        טלפון: <a href={phoneHref} className="ltr">{phone}</a>
      </li>
      <li>
        דוא״ל: <a href={`mailto:${email}`} className="ltr">{email}</a>
      </li>
    </ul>
  );
}
