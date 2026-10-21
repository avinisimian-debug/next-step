"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KEYS, useStored } from "@/lib/client/store";
import { importDeviceFavorites } from "@/app/actions/saved";
import { Button, Notice } from "@/components/ui/ui";

export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  typeLabel: string;
}

/** Institutions saved on this device. Signed-in visitors can move them into their account. */
export function DeviceFavorites({ catalog, canImport }: { catalog: CatalogEntry[]; canImport: boolean }) {
  const [favs, setFavs, hydrated] = useStored<string[]>(KEYS.favorites, []);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const items = favs.map((id) => catalog.find((c) => c.id === id)).filter((c): c is CatalogEntry => Boolean(c));

  if (!hydrated) return null;
  if (!items.length) return message ? <Notice tone={message.tone}>{message.text}</Notice> : null;

  const move = () =>
    startTransition(async () => {
      const res = await importDeviceFavorites(items.map((i) => i.id));
      if (!res.ok) return setMessage({ tone: "error", text: res.message });
      setFavs([]);
      setMessage({ tone: "success", text: res.imported === 1 ? "מסגרת אחת הועברה לחשבון." : `${res.imported} מסגרות הועברו לחשבון.` });
      router.refresh();
    });

  return (
    <section aria-labelledby="h-device" className="rounded-3xl border border-sand-200 bg-sand-50 p-6">
      <h2 id="h-device" className="font-display text-xl font-bold text-navy-950">
        שמורים במכשיר הזה
      </h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">
        {canImport ? "המסגרות האלה נשמרו בדפדפן לפני שהתחברת. אפשר להעביר אותן לחשבון." : "המסגרות האלה שמורות רק בדפדפן הזה."}
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id}>
            <Link href={`/institutions/${i.slug}`} className="font-medium text-navy-900 underline-offset-4 hover:underline">
              {i.name}
            </Link>
            <span className="text-sm text-stone-600"> · {i.typeLabel}</span>
          </li>
        ))}
      </ul>
      {canImport && (
        <Button className="mt-4" onClick={move} disabled={pending} aria-busy={pending}>
          {pending ? "מעביר…" : "העברה לחשבון"}
        </Button>
      )}
      {message && <div className="mt-3"><Notice tone={message.tone}>{message.text}</Notice></div>}
    </section>
  );
}
