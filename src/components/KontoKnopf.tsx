import Link from "next/link";
import { aktuellerNutzer } from "@/lib/auth";

/**
 * Rechts oben im Kopf: entweder "Anmelden" oder der eigene Name.
 * Server-Komponente – sie darf direkt die Sitzung lesen.
 */
export async function KontoKnopf() {
  const nutzer = await aktuellerNutzer();

  if (!nutzer) {
    return (
      <Link
        href="/anmelden"
        className="flex h-11 items-center gap-1.5 rounded-weich border border-linie bg-karte px-3 text-sm font-semibold text-leise transition hover:text-honig"
      >
        <PersonZeichen className="h-4 w-4" />
        <span className="hidden sm:inline">Anmelden</span>
      </Link>
    );
  }

  return (
    <Link
      href={nutzer.rolle === "ADMIN" ? "/admin" : "/konto"}
      className="flex h-11 items-center gap-2 rounded-weich border border-linie bg-karte pl-1.5 pr-3 text-sm font-semibold transition hover:border-honig"
      title={nutzer.email}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-[0.55rem] bg-honigHell font-titel text-base font-bold text-ziegel">
        {nutzer.name.charAt(0).toUpperCase()}
      </span>
      <span className="hidden max-w-24 truncate sm:inline">
        {nutzer.name.split(" ")[0]}
      </span>
    </Link>
  );
}

function PersonZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.8 17c.6-3.4 3.1-5.2 6.2-5.2s5.6 1.8 6.2 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
