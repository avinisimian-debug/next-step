"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessagesSquare, Route, Search } from "lucide-react";

const TABS = [
  { href: "/", label: "בית", icon: Home, match: (p: string) => p === "/" },
  { href: "/institutions", label: "מסגרות", icon: Search, match: (p: string) => p.startsWith("/institutions") },
  { href: "/journey", label: "המסע שלי", icon: Route, match: (p: string) => ["/journey", "/results", "/plan", "/compare", "/saved", "/my-path"].some((x) => p.startsWith(x)) },
  { href: "/community", label: "קהילה", icon: MessagesSquare, match: (p: string) => p.startsWith("/community") },
  { href: "/assistant", label: "עוזר", icon: Compass, match: (p: string) => p.startsWith("/assistant") },
];

/** App-style tab bar on phones and tablets. Hidden inside the questionnaire, which has its own controls. */
export function BottomNav() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/questionnaire")) return null;
  return (
    <>
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] print:hidden lg:hidden" aria-hidden="true" />
      <nav
        aria-label="ניווט מהיר"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {TABS.map((t) => {
            const active = t.match(pathname);
            const center = t.href === "/journey";
            return (
              <li key={t.href} className="flex">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                    active ? "text-navy-950" : "text-mist-500 hover:text-navy-800"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center rounded-full transition ${
                      center ? `size-9 ${active ? "bg-teal-600 text-paper" : "bg-navy-900 text-paper"}` : `h-7 w-12 ${active ? "bg-sand-200" : ""}`
                    }`}
                  >
                    <t.icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
