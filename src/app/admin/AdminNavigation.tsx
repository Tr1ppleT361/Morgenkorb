"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/bestellungen", label: "Bestellungen" },
  { href: "/admin/einkauf", label: "Einkaufsliste" },
  { href: "/admin/kunden", label: "Kunden" },
  { href: "/admin/produkte", label: "Produkte" },
  { href: "/admin/kategorien", label: "Kategorien" },
  { href: "/admin/kasse", label: "Kasse" },
  { href: "/admin/archiv", label: "Archiv" },
  { href: "/admin/einstellungen", label: "Zeiten" },
];

/** Reiter-Navigation im Admin-Bereich. */
export function AdminNavigation() {
  const pfad = usePathname();

  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map((l) => {
        const aktiv = pfad === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition " +
              (aktiv
                ? "bg-honig text-white"
                : "border border-linie bg-karte text-leise hover:bg-honigHell")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
