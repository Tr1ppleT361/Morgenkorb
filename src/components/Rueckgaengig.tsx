"use client";

import { useEffect } from "react";

/**
 * Kleine Leiste, die nach dem Hinzufügen kurz erscheint:
 * "Snickers hinzugefügt – Rückgängig".
 *
 * Sie verschwindet nach ein paar Sekunden von selbst.
 */
export function Rueckgaengig({
  text,
  onRueckgaengig,
  onSchliessen,
  /** Millisekunden, bis sie von selbst verschwindet */
  dauer = 5000,
}: {
  text: string;
  onRueckgaengig: () => void;
  onSchliessen: () => void;
  dauer?: number;
}) {
  // Timer neu starten, wenn sich der Text ändert (neues Produkt)
  useEffect(() => {
    const uhr = setTimeout(onSchliessen, dauer);
    return () => clearTimeout(uhr);
  }, [text, dauer, onSchliessen]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-40 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-linie bg-tinte px-4 py-2.5 text-sm text-grund shadow-gehoben">
        <span className="min-w-0 truncate">{text}</span>
        <button
          type="button"
          onClick={onRueckgaengig}
          className="shrink-0 rounded-full bg-grund/15 px-3 py-1 text-xs font-bold uppercase tracking-wide transition hover:bg-grund/25"
        >
          Rückgängig
        </button>
      </div>
    </div>
  );
}
