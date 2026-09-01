/**
 * Sehr einfacher Passwortschutz für /admin.
 *
 * Idee:
 *  - Das Passwort steht in der Umgebungsvariable ADMIN_PASSWORD.
 *  - Nach erfolgreichem Login setzen wir ein Cookie. Darin steht NICHT das
 *    Passwort, sondern ein daraus berechneter "Fingerabdruck" (HMAC).
 *  - Bei jedem Aufruf rechnen wir den Fingerabdruck neu aus und vergleichen.
 *
 * Das reicht für eine Klassen-Bestellliste. Für echte Nutzerkonten würde man
 * eine richtige Auth-Bibliothek nehmen.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "morgenkorb_admin";

/**
 * Ist überhaupt ein Admin-Passwort hinterlegt?
 * Falls nicht (z. B. beim ersten Deployment vergessen), zeigen wir einen
 * Hinweis statt einer kaputten Seite.
 */
export function adminIstEingerichtet(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function adminPasswort(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "ADMIN_PASSWORD ist nicht gesetzt. Bitte in .env bzw. in den Vercel-Einstellungen eintragen.",
    );
  }
  return pw;
}

/** Der Wert, der im Cookie landet. */
export function adminToken(): string {
  const secret = process.env.ADMIN_SECRET ?? "morgenkorb-fallback-secret";
  return createHmac("sha256", secret).update(adminPasswort()).digest("hex");
}

/** Vergleich, der immer gleich lang dauert (schützt vor Timing-Tricks). */
function sicherGleich(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Stimmt das eingegebene Passwort? */
export function passwortStimmt(eingabe: string): boolean {
  if (!adminIstEingerichtet()) return false;
  return sicherGleich(eingabe, adminPasswort());
}

/** Ist der Besucher im Admin-Bereich eingeloggt? */
export async function istAdmin(): Promise<boolean> {
  if (!adminIstEingerichtet()) return false;
  const cookieStore = await cookies();
  const wert = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!wert) return false;
  try {
    return sicherGleich(wert, adminToken());
  } catch {
    return false;
  }
}
