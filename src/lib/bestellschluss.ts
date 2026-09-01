/**
 * Alles rund um den Bestellschluss (Standard: 20:00 Uhr).
 * Die Uhrzeit selbst steht in src/config.ts.
 */
import { config } from "@/config";

/** Liefert Stunde und Minute "jetzt" in der konfigurierten Zeitzone. */
function uhrzeitInZeitzone(datum: Date): { stunde: number; minute: number } {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: config.zeitzone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);

  const hole = (typ: string) =>
    Number(teile.find((t) => t.type === typ)?.value ?? "0");

  return { stunde: hole("hour") % 24, minute: hole("minute") };
}

/** "20:00" – für die Anzeige. */
export function bestellschlussText(): string {
  const { stunde, minute } = config.bestellschluss;
  return `${String(stunde).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Ist das Bestellfenster gerade offen?
 * Offen ist es von 00:00 Uhr bis zum Bestellschluss.
 */
export function bestellungenOffen(jetzt: Date = new Date()): boolean {
  const { stunde, minute } = uhrzeitInZeitzone(jetzt);
  const jetztMinuten = stunde * 60 + minute;
  const schlussMinuten =
    config.bestellschluss.stunde * 60 + config.bestellschluss.minute;
  return jetztMinuten < schlussMinuten;
}

/** Wie viele Minuten bleiben noch? (0, wenn schon geschlossen) */
export function minutenBisSchluss(jetzt: Date = new Date()): number {
  const { stunde, minute } = uhrzeitInZeitzone(jetzt);
  const rest =
    (config.bestellschluss.stunde * 60 + config.bestellschluss.minute) -
    (stunde * 60 + minute);
  return Math.max(0, rest);
}
