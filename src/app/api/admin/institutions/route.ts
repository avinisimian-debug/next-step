import { NextResponse } from "next/server";
import { dataSourceLabel, getRepository } from "@/lib/data/repository";
import { institutionSchema } from "@/lib/domain/types";

export const runtime = "nodejs";

// Access is enforced by src/middleware.ts (Basic auth on /api/admin/*).
export async function POST(req: Request) {
  const parsed = institutionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") }, { status: 400 });
  }
  if (dataSourceLabel() === "seed") {
    return NextResponse.json(
      {
        message:
          "הרשומה תקינה, אבל המאגר כרגע הוא קובץ seed לקריאה בלבד. כדי לשמור מכאן, חברו Supabase (ראו README). לחלופין, העתיקו את הרשומה ל-src/data/institutions.ts.",
      },
      { status: 501 },
    );
  }
  try {
    await getRepository().upsert(parsed.data);
    return NextResponse.json({ message: "נשמר במאגר." });
  } catch (err) {
    // The details go to the server log; the page gets a plain message.
    console.error("admin upsert failed", err);
    return NextResponse.json({ message: "השמירה נכשלה. הפרטים נרשמו ביומן השרת." }, { status: 500 });
  }
}
