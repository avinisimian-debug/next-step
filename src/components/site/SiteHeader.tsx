"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#pathways", label: "המסלולים" },
  { href: "/#how", label: "איך זה עובד" },
  { href: "/compare", label: "השוואה" },
  { href: "/about", label: "אודות" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inFlow = pathname?.startsWith("/questionnaire");

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NEXT STEP — לדף הבית" className="shrink-0">
          <Logo />
        </Link>

        {!inFlow && (
          <nav aria-label="ניווט ראשי" className="hidden md:block">
            <ul className="flex items-center gap-1 text-[15px] text-navy-800">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="rounded-lg px-3 py-2 transition-colors hover:bg-sand-100 hover:text-navy-950">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!inFlow && (
            <Link
              href="/questionnaire"
              className="hidden rounded-full bg-navy-900 px-4 py-2 text-sm font-medium text-paper transition hover:bg-navy-800 sm:inline-flex"
            >
              להתחיל את השאלון
            </Link>
          )}
          {!inFlow && (
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-sand-100 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
        </div>
      </div>

      {open && !inFlow && (
        <nav id="mobile-nav" aria-label="ניווט ראשי" className="border-t border-sand-200 bg-paper md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-navy-900 hover:bg-sand-100">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="py-2">
              <Link
                href="/questionnaire"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-navy-900 px-4 py-3 text-center font-medium text-paper"
              >
                להתחיל את השאלון
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
