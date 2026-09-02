/**
 * Preisberechnung: aus Einkaufspreis wird Verkaufspreis.
 *
 * Regel:
 *   1. Ziel ist Einkauf + 30 % Aufschlag.
 *   2. Danach wird auf einen barzahlungsfreundlichen Betrag gerundet:
 *      unter 1 € auf volle 10 Cent, ab 1 € auf volle 50 Cent.
 *      So gibt es keine Preise wie 1,89 €, sondern 1,50 € oder 2,00 €.
 *   3. Sicherheitsnetz: Nach dem Runden müssen mindestens 20 % Marge
 *      übrig bleiben – sonst wird eine Stufe hochgegangen.
 *
 * Alles in CENT, damit nichts durch Kommazahlen verrutscht.
 */

export const AUFSCHLAG = 1.3; // 30 %
export const MINDEST_MARGE = 1.1; // mindestens 10 % Marge

export function verkaufspreis(einkaufCent: number): number {
  const ziel = einkaufCent * AUFSCHLAG;
  const stufe = ziel < 100 ? 10 : 50;

  let preis = Math.round(ziel / stufe) * stufe;

  // Nie unter der Mindestmarge landen
  const untergrenze = einkaufCent * MINDEST_MARGE;
  while (preis < untergrenze) preis += stufe;

  // Nie unter dem Einkaufspreis (bei sehr billigen Sachen)
  if (preis <= einkaufCent) preis = einkaufCent + stufe;

  return preis;
}

/** Wie viel Prozent Marge bleiben? Für die Anzeige im Admin. */
export function marge(einkaufCent: number, verkaufCent: number): number {
  if (einkaufCent <= 0) return 0;
  return Math.round(((verkaufCent - einkaufCent) / einkaufCent) * 100);
}
