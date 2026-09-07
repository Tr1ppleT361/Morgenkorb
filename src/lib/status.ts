/**
 * Der Bestellstatus – an einer Stelle definiert, damit Kundenansicht und
 * Admin garantiert dieselben Bezeichnungen benutzen.
 */

export const STATUS_REIHE = [
  "EINGEGANGEN",
  "IN_BEARBEITUNG",
  "VERSENDET",
  "ZUGESTELLT",
] as const;

export type Status = (typeof STATUS_REIHE)[number] | "STORNIERT";

type Beschreibung = {
  /** Was der Kunde liest */
  titel: string;
  /** Ein Satz, was das konkret bedeutet */
  erklaerung: string;
  /** Farbe aus unserer Palette (siehe globals.css) */
  farbe: "leise" | "honig" | "ziegel" | "moos" | "beere";
};

export const STATUS_TEXTE: Record<Status, Beschreibung> = {
  EINGEGANGEN: {
    titel: "Bestellt",
    erklaerung: "Deine Bestellung ist angekommen und für morgen vorgemerkt.",
    farbe: "leise",
  },
  IN_BEARBEITUNG: {
    titel: "Eingekauft",
    erklaerung: "Die Sachen sind besorgt.",
    farbe: "honig",
  },
  VERSENDET: {
    titel: "Bereit",
    erklaerung: "Eingepackt und bereit zur Übergabe.",
    farbe: "ziegel",
  },
  ZUGESTELLT: {
    titel: "Übergeben",
    erklaerung: "Übergeben. Guten Appetit!",
    farbe: "moos",
  },
  STORNIERT: {
    titel: "Storniert",
    erklaerung: "Diese Bestellung wurde abgebrochen.",
    farbe: "beere",
  },
};

/** Ist der Text ein gültiger Status? Schützt vor manipulierten Formularen. */
export function istStatus(wert: string): wert is Status {
  return wert === "STORNIERT" || STATUS_REIHE.includes(wert as never);
}

/** Wie weit ist die Bestellung? 0 = ganz am Anfang, 3 = zugestellt. */
export function statusStufe(status: string): number {
  const i = STATUS_REIHE.indexOf(status as (typeof STATUS_REIHE)[number]);
  return i === -1 ? 0 : i;
}

/** Der nächste Schritt – für den "Weiter"-Knopf im Admin. */
export function naechsterStatus(status: string): Status | null {
  const i = STATUS_REIHE.indexOf(status as (typeof STATUS_REIHE)[number]);
  if (i === -1 || i >= STATUS_REIHE.length - 1) return null;
  return STATUS_REIHE[i + 1];
}

export function statusText(status: string): Beschreibung {
  return STATUS_TEXTE[status as Status] ?? STATUS_TEXTE.EINGEGANGEN;
}

/** Tailwind-Klassen je Status – als feste Strings, damit Tailwind sie findet. */
export const STATUS_KLASSEN: Record<Beschreibung["farbe"], string> = {
  leise: "bg-leise/12 text-leise",
  honig: "bg-honig/15 text-ziegel",
  ziegel: "bg-ziegel/12 text-ziegel",
  moos: "bg-moos/15 text-moos",
  beere: "bg-beere/12 text-beere",
};
