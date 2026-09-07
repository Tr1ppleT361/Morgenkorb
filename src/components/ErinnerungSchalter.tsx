"use client";

import { useState, useTransition } from "react";
import { erinnerungUmschalten } from "@/app/konto/korb";

/**
 * "Erinnere mich vor Bestellschluss, wenn noch was im Korb liegt."
 * Die Mail verschickt ein Cron-Job eine Stunde vor Schluss.
 */
export function ErinnerungSchalter({ an }: { an: boolean }) {
  const [aktiv, setAktiv] = useState(an);
  const [laeuft, starte] = useTransition();

  return (
    <label className="karte flex cursor-pointer items-center gap-3 p-3.5">
      <button
        type="button"
        role="switch"
        aria-checked={aktiv}
        disabled={laeuft}
        onClick={() => {
          const neu = !aktiv;
          setAktiv(neu);
          starte(async () => {
            await erinnerungUmschalten(neu);
          });
        }}
        className={
          "relative h-8 w-14 shrink-0 rounded-full transition " +
          (aktiv ? "bg-moos" : "bg-linie")
        }
      >
        <span
          className={
            "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
            (aktiv ? "left-7" : "left-1")
          }
        />
      </button>
      <span className="min-w-0 text-sm">
        <span className="block font-semibold">Erinnerung vor Bestellschluss</span>
        <span className="block text-leise">
          Eine Mail, wenn eine Stunde vor Schluss noch etwas im Korb liegt.
        </span>
      </span>
    </label>
  );
}
