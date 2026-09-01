"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { euro } from "@/lib/geld";
import { bezahltUmschalten, bestellungLoeschen } from "../actions";

type Artikel = { id: number; name: string; menge: number; preis: number };

/** Eine Bestellung als aufklappbare Karte. */
export function BestellKarte({
  id,
  name,
  klasse,
  notiz,
  bezahlt,
  summe,
  artikel,
}: {
  id: string;
  name: string;
  klasse: string;
  notiz: string | null;
  bezahlt: boolean;
  summe: number;
  artikel: Artikel[];
}) {
  const [offen, setOffen] = useState(false);
  const [istBezahlt, setIstBezahlt] = useState(bezahlt);
  const [laeuft, starte] = useTransition();
  const router = useRouter();

  function bezahltKlick() {
    const neu = !istBezahlt;
    setIstBezahlt(neu); // sofort umschalten, damit es sich flott anfühlt
    starte(async () => {
      await bezahltUmschalten(id, neu);
      router.refresh();
    });
  }

  return (
    <div
      className={
        "karte overflow-hidden " +
        (istBezahlt ? "border-korb-300 dark:border-korb-800" : "")
      }
    >
      <div className="flex items-center gap-3 p-4">
        {/* Bezahlt-Häkchen */}
        <button
          type="button"
          onClick={bezahltKlick}
          disabled={laeuft}
          aria-pressed={istBezahlt}
          aria-label={istBezahlt ? "Als unbezahlt markieren" : "Als bezahlt markieren"}
          className={
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-xl transition " +
            (istBezahlt
              ? "border-korb-600 bg-korb-600 text-white"
              : "border-slate-300 text-transparent dark:border-slate-700")
          }
        >
          ✓
        </button>

        <button
          type="button"
          onClick={() => setOffen((o) => !o)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-semibold">
            {name}{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">
              · {klasse}
            </span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {artikel.reduce((s, a) => s + a.menge, 0)} Artikel ·{" "}
            {offen ? "einklappen" : "anzeigen"}
          </p>
        </button>

        <span className="shrink-0 text-lg font-bold tabular-nums">
          {euro(summe)}
        </span>
      </div>

      {offen && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <ul className="space-y-1 text-sm">
            {artikel.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">{a.menge}×</span> {a.name}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {euro(a.menge * a.preis)}
                </span>
              </li>
            ))}
          </ul>

          {notiz && (
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <span className="font-semibold">Notiz:</span> {notiz}
            </p>
          )}

          <button
            type="button"
            className="mt-3 text-sm text-red-600 underline"
            disabled={laeuft}
            onClick={() => {
              if (!confirm(`Bestellung von ${name} wirklich löschen?`)) return;
              starte(async () => {
                await bestellungLoeschen(id);
                router.refresh();
              });
            }}
          >
            Bestellung löschen
          </button>
        </div>
      )}
    </div>
  );
}
