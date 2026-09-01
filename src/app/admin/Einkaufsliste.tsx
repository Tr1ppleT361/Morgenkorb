"use client";

import { useEffect, useState } from "react";
import { euro } from "@/lib/geld";

type Zeile = { id: number; name: string; menge: number; summe: number };
type Gruppe = { kategorie: string; zeilen: Zeile[] };

const SPEICHER_KEY = "morgenkorb_abgehakt";

/**
 * Einkaufsliste zum Abhaken.
 * Die Häkchen werden nur im Browser gespeichert (localStorage) – sie
 * gehören zu deinem Einkauf, nicht in die Datenbank.
 */
export function Einkaufsliste({ gruppen }: { gruppen: Gruppe[] }) {
  const [abgehakt, setAbgehakt] = useState<number[]>([]);

  useEffect(() => {
    try {
      const roh = localStorage.getItem(SPEICHER_KEY);
      if (roh) setAbgehakt(JSON.parse(roh));
    } catch {
      /* egal */
    }
  }, []);

  function umschalten(id: number) {
    setAbgehakt((alt) => {
      const neu = alt.includes(id) ? alt.filter((x) => x !== id) : [...alt, id];
      try {
        localStorage.setItem(SPEICHER_KEY, JSON.stringify(neu));
      } catch {
        /* egal */
      }
      return neu;
    });
  }

  function zuruecksetzen() {
    setAbgehakt([]);
    try {
      localStorage.removeItem(SPEICHER_KEY);
    } catch {
      /* egal */
    }
  }

  const gesamtZeilen = gruppen.reduce((s, g) => s + g.zeilen.length, 0);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {abgehakt.length} von {gesamtZeilen} erledigt
        </p>
        {abgehakt.length > 0 && (
          <button
            type="button"
            onClick={zuruecksetzen}
            className="text-sm text-slate-500 underline"
          >
            Häkchen zurücksetzen
          </button>
        )}
      </div>

      {gruppen.map((g) => (
        <section key={g.kategorie} className="mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {g.kategorie}
          </h2>
          <ul className="karte divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            {g.zeilen.map((z) => {
              const erledigt = abgehakt.includes(z.id);
              return (
                <li key={z.id}>
                  {/* Ganze Zeile ist anklickbar – gut für dicke Finger im Laden */}
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={erledigt}
                      onChange={() => umschalten(z.id)}
                      className="h-6 w-6 shrink-0 accent-korb-600"
                    />
                    <span className="w-12 shrink-0 text-lg font-bold tabular-nums text-korb-700 dark:text-korb-400">
                      {z.menge}×
                    </span>
                    <span
                      className={
                        "min-w-0 flex-1 text-base " +
                        (erledigt ? "text-slate-400 line-through" : "")
                      }
                    >
                      {z.name}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                      {euro(z.summe)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
