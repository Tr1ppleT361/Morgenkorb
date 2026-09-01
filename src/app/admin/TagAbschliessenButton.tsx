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
        className="btn-ghost w-full"
        onClick={() => setNachfrage(true)}
      >
        ✔ Tag abschließen
      </button>
    );
  }

  return (
    <div className="karte border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        {anzahl} {anzahl === 1 ? "Bestellung wird" : "Bestellungen werden"} ins
        Archiv verschoben. Die Tagesliste ist danach leer.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-ghost flex-1"
          onClick={() => setNachfrage(false)}
          disabled={laeuft}
        >
          Abbrechen
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
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
