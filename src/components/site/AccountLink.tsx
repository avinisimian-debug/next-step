"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { getHeaderState, type HeaderState } from "@/app/actions/session";

export function AccountLink({
  onNavigate,
  block = false,
  tone = "dark",
}: {
  onNavigate?: () => void;
  block?: boolean;
  tone?: "dark" | "light";
}) {
  const [state, setState] = useState<HeaderState | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let live = true;
    getHeaderState()
      .then((s) => live && setState(s))
      .catch(() => live && setState({ state: "unconfigured" }));
    return () => {
      live = false;
    };
  }, [pathname]);

  if (!state || state.state === "unconfigured") return null;
  const cls = block
    ? "flex items-center gap-2 rounded-lg px-2 py-3 text-navy-900 hover:bg-sand-100"
    : `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
        tone === "light" ? "text-paper hover:bg-paper/10" : "text-navy-900 hover:bg-sand-100"
      }`;
  if (state.state === "anonymous")
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname ?? "/")}`} onClick={onNavigate} className={cls}>
        <UserRound className="size-4" aria-hidden="true" />
        התחברות
      </Link>
    );
  if (state.state !== "signed_in") return null;
  return (
    <Link href="/account" onClick={onNavigate} className={cls} aria-label={`החשבון שלי${state.unread ? `, ${state.unread} התראות חדשות` : ""}`}>
      <UserRound className="size-4" aria-hidden="true" />
      <span className="max-w-[9rem] truncate">{state.name}</span>
      {state.unread > 0 && <span className="rounded-full bg-navy-900 px-1.5 text-xs text-paper">{state.unread}</span>}
    </Link>
  );
}
