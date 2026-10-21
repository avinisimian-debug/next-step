import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { RecordEditor } from "@/components/admin/RecordEditor";
import type { Institution } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const TEMPLATE: Institution = {
  id: "",
  slug: "",
  name: "",
  pathway: "mechina",
  typeLabel: "",
  kind: "institution",
  regions: ["center"],
  locationLabel: "",
  shortDescription: "",
  highlights: [],
  limitations: [],
  attributes: {
    torahIntensity: 0,
    militaryEmphasis: 0,
    militaryModel: "unknown",
    torahServiceBalance: null,
    religiousEnvironments: ["general"],
    development: [],
    serviceInterests: [],
    environmentStyles: [],
    learningStyles: [],
    strengths: [],
    residential: "residential",
    duration: "varies",
    communitySize: "unknown",
    audience: "unknown",
  },
  profile: { overview: "", faq: [] },
  sources: [],
  lastVerified: new Date().toISOString().slice(0, 10),
  verificationStatus: "unverified",
  verificationNotes: "",
  published: false,
};

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = id === "new" ? TEMPLATE : (await getRepository().listAll()).find((i) => i.id === id);
  if (!record) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-950">{id === "new" ? "רשומה חדשה" : `עריכה: ${record.name}`}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        כל טענה עובדתית חייבת להיות מגובה במקור ברשימת <code>sources</code>. אין להוסיף עלויות, סדרי יום או תנאי קבלה שלא
        מופיעים במקור. לפני פרסום: לבדוק שהאתר הרשמי נפתח ושפרטי הקשר תואמים.
      </p>
      <RecordEditor initial={record} />
    </div>
  );
}
