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
        <p className="text-sm text-leise">
          {abgehakt.length} von {gesamtZeilen} erledigt
        </p>
        {abgehakt.length > 0 && (
          <button
            type="button"
            onClick={zuruecksetzen}
            className="text-sm text-leise underline"
          >
            Häkchen zurücksetzen
          </button>
        )}
      </div>

      {gruppen.map((g) => (
        <section key={g.kategorie} className="mb-4">
          <h2 className="mb-2 font-text etikett">
            {g.kategorie}
          </h2>
          <ul className="karte divide-y divide-linie overflow-hidden">
            {g.zeilen.map((z) => {
              const erledigt = abgehakt.includes(z.id);
              return (
                <li key={z.id}>
                  {/* Ganze Zeile ist anklickbar – gut für dicke Finger im Laden */}
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-4">
                    {/*
                      Eigene Checkbox: die vom System sieht auf jedem Gerät
                      anders aus und leuchtet im Dunkelmodus grell weiß.
                    */}
                    <input
                      type="checkbox"
                      checked={erledigt}
                      onChange={() => umschalten(z.id)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.5rem] border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-honig/25 " +
                        (erledigt
                          ? "border-moos bg-moos text-white"
                          : "border-linie bg-karte text-transparent")
                      }
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path
                          d="m5 12.5 4.5 4.5L19 7.5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="w-12 shrink-0 text-lg font-bold ziffern text-ziegel">
                      {z.menge}×
                    </span>
                    <span
                      className={
                        "min-w-0 flex-1 text-base " +
                        (erledigt ? "text-leise line-through" : "")
                      }
                    >
                      {z.name}
                    </span>
                    <span className="shrink-0 text-sm ziffern text-leise">
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
