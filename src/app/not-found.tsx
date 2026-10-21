import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-sand-300">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-navy-950">הדף לא נמצא</h1>
      <p className="mt-3 leading-7 text-stone-600">ייתכן שהקישור שגוי, או שהמסגרת הוסרה מהמאגר עד לאימות מחודש.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-paper">
          לדף הבית
        </Link>
        <Link href="/institutions" className="rounded-full border border-sand-300 px-5 py-2.5 text-sm font-medium text-navy-900">
          לכל המסגרות
        </Link>
      </div>
    </div>
  );
}
