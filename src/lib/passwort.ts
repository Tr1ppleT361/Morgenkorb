/**
 * Passwörter sicher speichern.
 *
 * Wichtigste Regel: Das Passwort selbst wird NIE gespeichert. Gespeichert
 * wird nur ein "Hash" – eine Einbahnstraße. Aus dem Passwort kann man den
 * Hash ausrechnen, aus dem Hash aber nicht das Passwort zurückholen.
 *
 * Wir benutzen scrypt. Das ist absichtlich langsam und speicherhungrig,
 * damit jemand mit einer gestohlenen Datenbank nicht einfach Millionen
 * Passwörter pro Sekunde durchprobieren kann. scrypt steckt schon in Node
 * drin – wir brauchen also kein zusätzliches Paket.
 */
import { randomBytes, scrypt as scryptRoh, timingSafeEqual } from "crypto";
import { promisify } from "util";

// scrypt arbeitet mit Rückruf-Funktionen; das macht ein Promise daraus
const scrypt = promisify(scryptRoh) as (
  passwort: string | Buffer,
  salz: Buffer,
  laenge: number,
) => Promise<Buffer>;

const LAENGE = 64;

/** Mindestlänge für neue Passwörter. */
export const MIN_PASSWORT_LAENGE = 8;

/**
 * Macht aus einem Passwort den gespeicherten Wert.
 * Ergebnis sieht so aus:  scrypt$<salz>$<hash>
 *
 * Das "Salz" ist eine Zufallszahl pro Konto. Dadurch haben zwei Leute mit
 * demselben Passwort trotzdem verschiedene Hashes.
 */
export async function passwortHashen(passwort: string): Promise<string> {
  const salz = randomBytes(16);
  const hash = await scrypt(passwort.normalize("NFKC"), salz, LAENGE);
  return `scrypt$${salz.toString("hex")}$${hash.toString("hex")}`;
}

/** Passt das eingegebene Passwort zum gespeicherten Hash? */
export async function passwortPruefen(
  passwort: string,
  gespeichert: string,
): Promise<boolean> {
  const [verfahren, salzHex, hashHex] = gespeichert.split("$");
  if (verfahren !== "scrypt" || !salzHex || !hashHex) return false;

  const erwartet = Buffer.from(hashHex, "hex");
  const berechnet = await scrypt(
    passwort.normalize("NFKC"),
    Buffer.from(salzHex, "hex"),
    erwartet.length,
  );

  // Vergleich, der immer gleich lang dauert. Ein normales === würde beim
  // ersten falschen Zeichen abbrechen – daran könnte ein Angreifer messen,
  // wie viele Zeichen schon stimmen.
  return (
    berechnet.length === erwartet.length && timingSafeEqual(berechnet, erwartet)
  );
}
