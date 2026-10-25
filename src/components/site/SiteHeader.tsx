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
  // The homepage opens on night-blue sections, so the header goes dark while it sits over them.
  const home = pathname === "/";
  const [overDark, setOverDark] = useState(true);
  useEffect(() => {
    if (!home) return;
    const onScroll = () => {
      // Dark over the opening scene until its doorway light starts to fill the screen (see CinemaHero).
      const door = document.getElementById("door");
      // Phones: the night lasts until the doorway's light floods the screen.
      if (door && door.offsetHeight > 0) {
        const pinned = door.offsetHeight - window.innerHeight;
        return setOverDark(
          window.scrollY <
            door.offsetTop +
              (pinned > 0 ? pinned * 0.55 : door.offsetHeight - 64),
        );
      }
      const hero = document.getElementById("hero");
      if (!hero) return setOverDark(false);
      const pinned = hero.offsetHeight - window.innerHeight;
      const end =
        pinned > window.innerHeight * 0.5
          ? hero.offsetTop + pinned * 0.7
          : hero.offsetTop + hero.offsetHeight - 64;
      setOverDark(window.scrollY < end);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);
  const dark = home && overDark;
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
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-colors duration-500 print:hidden ${
        dark
          ? "border-navy-800 bg-night"
          : "border-sand-200/80 bg-paper/90 supports-[backdrop-filter]:bg-paper/75"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo tone={dark ? "light" : "dark"} />
          <span className="sr-only">, לדף הבית</span>
        </Link>

        {!inFlow && (
          <nav aria-label="ניווט ראשי" className="hidden lg:block">
            <ul
              className={`flex items-center gap-1 text-[15px] ${dark ? "text-mist-100" : "text-navy-800"}`}
            >
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={pathname === n.href ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 transition-colors ${
                      dark
                        ? "hover:bg-paper/10 hover:text-paper"
                        : "hover:bg-sand-100 hover:text-navy-950 aria-[current=page]:bg-sand-100 aria-[current=page]:font-medium aria-[current=page]:text-navy-950"
                    }`}
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
              <AccountLink tone={dark ? "light" : "dark"} />
            </span>
          )}
          {!inFlow && (
            <Link
              href="/questionnaire"
              className={`hidden rounded-full px-4 py-2 text-sm font-medium transition sm:inline-flex ${
                dark
                  ? "bg-paper text-night hover:bg-sky-300"
                  : "bg-navy-900 text-paper hover:bg-navy-800"
              }`}
            >
              להתחיל את השאלון
            </Link>
          )}
          {!inFlow && (
            <button
              ref={toggle}
              type="button"
              className={`inline-flex size-11 items-center justify-center rounded-lg lg:hidden ${
                dark
                  ? "text-paper hover:bg-paper/10"
                  : "text-navy-900 hover:bg-sand-100"
              }`}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {open && !inFlow && (
        <nav
          id="mobile-nav"
          aria-label="ניווט ראשי"
          className="border-t border-sand-200 bg-paper lg:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-navy-900 hover:bg-sand-100"
                >
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
