/**
 * Ist das Bestellfenster gerade offen?
 *
 * Die Zeiten kommen aus der Datenbank (im Admin änderbar), siehe
 * src/lib/einstellungen.ts. Die Zeitzone steht in src/config.ts.
 */
import { config } from "@/config";
import { alsMinuten, bestellzeiten, type Bestellzeiten } from "@/lib/einstellungen";

/** Liefert die aktuelle Uhrzeit in Minuten seit Mitternacht (Zeitzone!). */
function jetztInMinuten(datum: Date = new Date()): number {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: config.zeitzone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);

  const hole = (typ: string) =>
    Number(teile.find((t) => t.type === typ)?.value ?? "0");

  return (hole("hour") % 24) * 60 + hole("minute");
}

/** Alles, was die Seiten über das Bestellfenster wissen müssen. */
export type FensterStatus = {
  offen: boolean;
  start: string;
  ende: string;
  /** Minuten bis zum Schluss (0, wenn zu) */
  minutenRest: number;
  /** Warum ist zu? Für die richtige Meldung auf der Seite. */
  grund: "offen" | "pausiert" | "zu_frueh" | "zu_spaet";
};

/** Prüft das Fenster gegen die aktuelle Uhrzeit. */
export function fensterPruefen(
  zeiten: Bestellzeiten,
  jetzt: Date = new Date(),
): FensterStatus {
  const start = alsMinuten(zeiten.start) ?? 0;
  const ende = alsMinuten(zeiten.ende) ?? 1200;
  const jetztMin = jetztInMinuten(jetzt);

  const basis = {
    start: zeiten.start,
    ende: zeiten.ende,
    minutenRest: Math.max(0, ende - jetztMin),
  };

  if (!zeiten.aktiv)
    return { ...basis, offen: false, minutenRest: 0, grund: "pausiert" };

  // Fenster über Mitternacht (z. B. 18:00 bis 02:00)
  const offen =
    start <= ende
      ? jetztMin >= start && jetztMin < ende
      : jetztMin >= start || jetztMin < ende;

  if (offen) return { ...basis, offen: true, grund: "offen" };

  return {
    ...basis,
    offen: false,
    minutenRest: 0,
    grund: jetztMin < start ? "zu_frueh" : "zu_spaet",
  };
}

/** Bequem für Seiten: liest die Einstellungen und prüft direkt. */
export async function bestellfenster(): Promise<FensterStatus> {
  return fensterPruefen(await bestellzeiten());
}

/** Kurzform für die Server Action. */
export async function bestellungenOffen(): Promise<boolean> {
  return (await bestellfenster()).offen;
}

/** "20:00" – für die Anzeige. */
export async function bestellschlussText(): Promise<string> {
  return (await bestellzeiten()).ende;
}
