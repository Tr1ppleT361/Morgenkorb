/**
 * Hilfsfunktionen für Geld.
 *
 * Wir speichern Preise IMMER als ganze Zahl in Cent (79 = 0,79 €).
 * Kommazahlen (Floats) wären ungenau: 0.1 + 0.2 ergibt in JavaScript
 * 0.30000000000000004 – bei Geld will man das nicht.
 */

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** 149 -> "1,49 €" */
export function euro(cent: number): string {
  return formatter.format(cent / 100);
}

/** Summiert Positionen (Menge × Einzelpreis) und gibt Cent zurück. */
export function summeCent(
  positionen: { menge: number; preisBeimKauf: number }[],
): number {
  return positionen.reduce((s, p) => s + p.menge * p.preisBeimKauf, 0);
}
