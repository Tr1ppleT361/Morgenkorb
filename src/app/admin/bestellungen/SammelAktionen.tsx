"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STATUS_REIHE, statusText } from "@/lib/status";
import { statusFuerAlleSetzen } from "../actions";

/**
 * Setzt den Status für alle offenen Bestellungen auf einmal.
 * Praktisch, wenn man gerade aus dem Laden kommt: ein Klick auf
 * "Versendet" für alle.
 */
export function SammelAktionen({ anzahl }: { anzahl: number }) {
  const [laeuft, starte] = useTransition();
  const [erledigt, setErledigt] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="karte flex flex-wrap items-center gap-2 p-3">
      <span className="etikett mr-1">Alle {anzahl} auf</span>
      {STATUS_REIHE.map((s) => (
        <button
          key={s}
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              const n = await statusFuerAlleSetzen(s);
              setErledigt(`${n} geändert`);
              router.refresh();
            })
          }
          className="rounded-full border border-linie bg-karte px-3 py-1.5 text-xs font-semibold transition hover:border-honig hover:bg-honigHell disabled:opacity-50"
        >
          {statusText(s).titel}
        </button>
      ))}
      {erledigt && (
        <span className="ml-auto text-xs font-semibold text-moos">
          {erledigt}
        </span>
      )}
    </div>
  );
}
