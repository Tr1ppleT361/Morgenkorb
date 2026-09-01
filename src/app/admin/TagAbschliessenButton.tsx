"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tagAbschliessen } from "./actions";

/**
 * Schließt den Tag ab: alle offenen Bestellungen wandern ins Archiv.
 * Vorher fragen wir sicherheitshalber nach.
 */
export function TagAbschliessenButton({ anzahl }: { anzahl: number }) {
  const [nachfrage, setNachfrage] = useState(false);
  const [laeuft, starte] = useTransition();
  const router = useRouter();

  if (!nachfrage) {
    return (
      <button
        type="button"
        className="btn-zweit w-full"
        onClick={() => setNachfrage(true)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Tag abschließen
      </button>
    );
  }

  return (
    <div className="karte border-honig/40 bg-honigHell p-4">
      <p className="text-sm font-medium text-ziegel">
        {anzahl} {anzahl === 1 ? "Bestellung wird" : "Bestellungen werden"} ins
        Archiv verschoben. Die Tagesliste ist danach leer.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-zweit flex-1"
          onClick={() => setNachfrage(false)}
          disabled={laeuft}
        >
          Abbrechen
        </button>
        <button
          type="button"
          className="btn-primaer flex-1"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await tagAbschliessen();
              setNachfrage(false);
              router.refresh();
            })
          }
        >
          {laeuft ? "Moment…" : "Ja, abschließen"}
        </button>
      </div>
    </div>
  );
}
