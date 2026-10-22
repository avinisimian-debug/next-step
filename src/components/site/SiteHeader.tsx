"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { AccountLink } from "./AccountLink";

const NAV = [
  { href: "/journey", label: "המסע שלי" },
  { href: "/institutions", label: "חיפוש מסגרות" },
  { href: "/community", label: "קהילה" },
  { href: "/assistant", label: "שאלו את העוזר" },
  { href: "/#pathways", label: "המסלולים" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inFlow = pathname?.startsWith("/questionnaire");
  const toggle = useRef<HTMLButtonElement>(null);

  // Esc closes the mobile menu and returns focus to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 print:hidden border-b border-sand-200/80 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NEXT STEP — לדף הבית" className="shrink-0">
          <Logo />
        </Link>

        {!inFlow && (
          <nav aria-label="ניווט ראשי" className="hidden lg:block">
            <ul className="flex items-center gap-1 text-[15px] text-navy-800">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={pathname === n.href ? "page" : undefined}
                    className="rounded-lg px-3 py-2 transition-colors hover:bg-sand-100 hover:text-navy-950 aria-[current=page]:bg-sand-100 aria-[current=page]:font-medium aria-[current=page]:text-navy-950"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!inFlow && (
            <span className="hidden lg:inline-flex">
              <AccountLink />
            </span>
          )}
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
              ref={toggle}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-sand-100 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      {open && !inFlow && (
        <nav id="mobile-nav" aria-label="ניווט ראשי" className="border-t border-sand-200 bg-paper lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-navy-900 hover:bg-sand-100">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <AccountLink block onNavigate={() => setOpen(false)} />
            </li>
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
