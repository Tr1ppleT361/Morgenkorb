/**
 * Bis wann darf ein Kunde seine Bestellung selbst ändern oder stornieren?
 *
 * Standard ist der Bestellschluss. Der Admin kann unter Einstellungen eine
 * frühere Uhrzeit setzen (z. B. 19:00, damit vor dem Einkauf Ruhe ist).
 */
import { config } from "@/config";
import { alsMinuten, bestellzeiten, shopEinstellungen } from "@/lib/einstellungen";

/** Aktuelle Uhrzeit in Minuten seit Mitternacht, in unserer Zeitzone. */
function jetztInMinuten(datum = new Date()): number {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: config.zeitzone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);
  const hole = (t: string) =>
    Number(teile.find((x) => x.type === t)?.value ?? "0");
  return (hole("hour") % 24) * 60 + hole("minute");
}

export type Aenderbarkeit = {
  erlaubt: boolean;
  /** "20:00" – bis wann geht es */
  frist: string;
  grund: "offen" | "frist_vorbei" | "abgeschlossen" | "storniert" | "unterwegs";
};

/**
 * Darf diese Bestellung noch geändert werden?
 *
 * Nein, wenn: die Frist vorbei ist, sie schon im Archiv liegt, storniert
 * wurde oder der Einkauf schon läuft (Status weiter als "Bestellt").
 */
export async function aenderbarkeit(bestellung: {
  status: string;
  abgeschlossen: boolean;
}): Promise<Aenderbarkeit> {
  const [zeiten, einst] = await Promise.all([
    bestellzeiten(),
    shopEinstellungen(),
  ]);

  // Leere Frist bedeutet: dieselbe Zeit wie der Bestellschluss
  const frist = einst.aenderFrist || zeiten.ende;

  if (bestellung.status === "STORNIERT")
    return { erlaubt: false, frist, grund: "storniert" };
  if (bestellung.abgeschlossen)
    return { erlaubt: false, frist, grund: "abgeschlossen" };
  if (bestellung.status !== "EINGEGANGEN")
    return { erlaubt: false, frist, grund: "unterwegs" };

  const grenze = alsMinuten(frist);
  if (grenze === null) return { erlaubt: true, frist, grund: "offen" };

  if (jetztInMinuten() >= grenze)
    return { erlaubt: false, frist, grund: "frist_vorbei" };

  return { erlaubt: true, frist, grund: "offen" };
}

/** Ein Satz, warum es nicht mehr geht. */
export function aenderGrundText(a: Aenderbarkeit): string {
  switch (a.grund) {
    case "frist_vorbei":
      return `Ändern ist nur bis ${a.frist} Uhr möglich.`;
    case "unterwegs":
      return "Der Einkauf läuft schon – melde dich direkt beim Einkauf.";
    case "abgeschlossen":
      return "Diese Bestellung ist abgeschlossen.";
    case "storniert":
      return "Diese Bestellung wurde storniert.";
    default:
      return "";
  }
}
