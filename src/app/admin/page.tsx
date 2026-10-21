import type { Metadata } from "next";
import Link from "next/link";
import { dataSourceLabel, getRepository } from "@/lib/data/repository";
import { PATHWAY_INFO } from "@/lib/domain/pathways";

export const metadata: Metadata = { title: "ניהול", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { verified: "מאומת", partial: "חלקי", unverified: "לא מאומת" };

export default async function AdminPage() {
  const all = await getRepository().listAll();
  const stale = (d: string) => Date.now() - new Date(d).getTime() > 1000 * 60 * 60 * 24 * 180;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-950">ניהול מאגר המסגרות</h1>
      <p className="mt-2 text-sm text-stone-600">
        מקור נתונים: <strong>{dataSourceLabel()}</strong>. {all.length} רשומות. רשומה מוצגת למשתמשים רק אם היא מפורסמת ולא
        במצב ״לא מאומת״.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/admin/edit/new" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-paper">
          רשומה חדשה
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-200 bg-paper">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sand-100 text-start">
            <tr>
              {["שם", "מסלול", "אימות", "מפורסם", "נבדק לאחרונה", "מקורות", ""].map((h) => (
                <th key={h} scope="col" className="p-3 text-start font-semibold text-navy-950">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((i) => (
              <tr key={i.id} className="border-t border-sand-200">
                <td className="p-3 font-medium text-navy-950">{i.name}</td>
                <td className="p-3">{PATHWAY_INFO[i.pathway].name}</td>
                <td className="p-3">{STATUS[i.verificationStatus]}</td>
                <td className="p-3">{i.published ? "כן" : "לא"}</td>
                <td className={`p-3 ${stale(i.lastVerified) ? "font-semibold text-amber-700" : ""}`}>
                  {i.lastVerified}
                  {stale(i.lastVerified) && " (דורש בדיקה)"}
                </td>
                <td className="p-3">{i.sources.length}</td>
                <td className="p-3">
                  <Link href={`/admin/edit/${i.id}`} className="text-teal-700 underline">
                    עריכה
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
