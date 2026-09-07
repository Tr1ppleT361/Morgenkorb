/**
 * Favoriten und "zuletzt angesehen".
 *
 * Beides liegt im Browser (localStorage), nicht auf dem Server. Vorteile:
 * es funktioniert auch ohne Konto, ist sofort da und niemand sonst sieht,
 * was du dir anschaust. Nachteil: es gilt pro Gerät.
 */

const FAVORITEN = "morgenkorb_favoriten";
const ANGESEHEN = "morgenkorb_angesehen";
const MAX_ANGESEHEN = 12;

/** Liest eine Zahlenliste aus dem Speicher. Bei Problemen: leere Liste. */
function lesen(schluessel: string): number[] {
  try {
    const roh = localStorage.getItem(schluessel);
    if (!roh) return [];
    const wert = JSON.parse(roh);
    return Array.isArray(wert) ? wert.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function schreiben(schluessel: string, werte: number[]) {
  try {
    localStorage.setItem(schluessel, JSON.stringify(werte));
  } catch {
    /* z. B. Privatmodus – nicht schlimm */
  }
}

export function favoritenLesen(): number[] {
  return lesen(FAVORITEN);
}

/** Herz an oder aus. Gibt die neue Liste zurück. */
export function favoritUmschalten(produktId: number): number[] {
  const alt = lesen(FAVORITEN);
  const neu = alt.includes(produktId)
    ? alt.filter((id) => id !== produktId)
    : [produktId, ...alt];
  schreiben(FAVORITEN, neu);
  return neu;
}

export function angesehenLesen(): number[] {
  return lesen(ANGESEHEN);
}

/** Merkt sich ein angesehenes Produkt (neueste zuerst, ohne Dopplungen). */
export function angesehenMerken(produktId: number): number[] {
  const alt = lesen(ANGESEHEN).filter((id) => id !== produktId);
  const neu = [produktId, ...alt].slice(0, MAX_ANGESEHEN);
  schreiben(ANGESEHEN, neu);
  return neu;
}
