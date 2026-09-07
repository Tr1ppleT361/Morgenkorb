/**
 * Änderungsprotokoll.
 *
 * Hält fest, wer wann was geändert hat – Preise, Bestände, Bestellungen,
 * Zahlungen. Im Admin unter "Protokoll" nachlesbar.
 *
 * Das Schreiben darf nie die eigentliche Aktion kaputt machen: Wenn das
 * Protokoll klemmt, wird der Fehler nur geloggt.
 */
import { prisma } from "@/lib/prisma";

export type Eintrag = {
  /** E-Mail des Admins, "Kunde", "Gast" oder "Stripe" */
  wer: string;
  /** Was ist passiert? z. B. "Preis geändert" */
  aktion: string;
  /** Worum ging es? z. B. "Produkt 12 (Fanta 0,5l)" */
  objekt: string;
  /** Vorher/nachher als lesbarer Text */
  details?: string;
};

export async function protokollieren(eintrag: Eintrag): Promise<void> {
  try {
    await prisma.protokoll.create({
      data: {
        wer: eintrag.wer.slice(0, 120),
        aktion: eintrag.aktion.slice(0, 120),
        objekt: eintrag.objekt.slice(0, 200),
        details: eintrag.details?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("Protokoll konnte nicht geschrieben werden:", e);
  }
}

/** Hübsche Zeile für "vorher -> nachher". */
export function vergleich(feld: string, alt: unknown, neu: unknown): string {
  return `${feld}: ${String(alt)} → ${String(neu)}`;
}
