"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Einkaufsliste" },
  { href: "/admin/personen", label: "Pro Person" },
  { href: "/admin/produkte", label: "Produkte" },
  { href: "/admin/archiv", label: "Archiv" },
];

/** Reiter-Navigation im Admin-Bereich. */
export function AdminNavigation() {
  const pfad = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {links.map((l) => {
        const aktiv = pfad === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              "shrink-0 rounded-weich px-4 py-2.5 text-sm font-semibold transition " +
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
