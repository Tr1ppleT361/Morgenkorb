/**
 * Anmeldung und Sitzungen ("eingeloggt bleiben").
 *
 * So läuft es ab:
 *  1. Beim Anmelden erzeugen wir einen langen Zufallsschlüssel (Token).
 *  2. Den Token bekommt der Browser als Cookie.
 *  3. In der Datenbank speichern wir NUR den Hash des Tokens.
 *
 * Warum nur den Hash? Falls jemand die Datenbank in die Finger bekommt,
 * kann er sich damit trotzdem nicht anmelden – aus dem Hash lässt sich der
 * Token nicht zurückrechnen.
 */
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SITZUNGS_COOKIE = "morgenkorb_sitzung";

/** Wie lange bleibt man angemeldet? */
const GUELTIG_TAGE = 30;

/** Aus dem Token wird der Wert, der in der Datenbank landet. */
function tokenHashen(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Was wir über den angemeldeten Nutzer wissen müssen. */
export type AngemeldeterNutzer = {
  id: string;
  email: string;
  name: string;
  klasse: string | null;
  rolle: string;
};

/**
 * Die Admin-Zugangsdaten stehen in den Umgebungsvariablen:
 *
 *   ADMIN_EMAIL     = deine-adresse@example.com
 *   ADMIN_PASSWORT  = dein-passwort
 *
 * Daraus wird beim ersten Anmeldeversuch automatisch ein Admin-Konto in der
 * Datenbank angelegt. Änderst du das Passwort in den Variablen, gilt beim
 * nächsten Anmelden das neue – so kannst du dich nie aussperren.
 *
 * Zusätzlich können in ADMIN_EMAILS weitere Adressen stehen (kommagetrennt),
 * die beim Registrieren automatisch Admin werden.
 */
export function adminEmail(): string | null {
  const e = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  return e || null;
}

export function adminPasswort(): string | null {
  const p = process.env.ADMIN_PASSWORT ?? process.env.ADMIN_PASSWORD ?? "";
  return p || null;
}

/** Alle Adressen, die Admin-Rechte bekommen. */
export function adminEmails(): string[] {
  const weitere = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const haupt = adminEmail();
  return haupt ? [haupt, ...weitere] : weitere;
}

export function istAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

/** Ist überhaupt ein Admin hinterlegt? */
export function adminIstEingerichtet(): boolean {
  return Boolean(adminEmail() && adminPasswort());
}

/**
 * Sorgt dafür, dass das Admin-Konto aus den Umgebungsvariablen existiert
 * und das dort hinterlegte Passwort gilt. Wird vor jedem Anmeldeversuch
 * aufgerufen – dadurch funktioniert das Anmelden sofort nach dem
 * Deployment, ganz ohne Registrierung.
 */
export async function adminKontoSicherstellen(): Promise<void> {
  const email = adminEmail();
  const passwort = adminPasswort();
  if (!email || !passwort) return;

  // Import hier drin, damit lib/auth.ts nicht im Kreis importiert
  const { passwortHashen, passwortPruefen } = await import("@/lib/passwort");

  const vorhanden = await prisma.user.findUnique({ where: { email } });

  if (!vorhanden) {
    await prisma.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME?.trim() || "Admin",
        passwortHash: await passwortHashen(passwort),
        rolle: "ADMIN",
      },
    });
    return;
  }

  // Konto gibt es schon: Rolle sicherstellen und – falls das Passwort in den
  // Variablen geändert wurde – den Hash aktualisieren.
  const passtNoch = await passwortPruefen(passwort, vorhanden.passwortHash);
  if (!passtNoch || vorhanden.rolle !== "ADMIN") {
    await prisma.user.update({
      where: { id: vorhanden.id },
      data: {
        rolle: "ADMIN",
        ...(passtNoch ? {} : { passwortHash: await passwortHashen(passwort) }),
      },
    });
  }
}

/**
 * Legt eine neue Sitzung an und setzt das Cookie.
 * Darf nur in Server Actions oder Route Handlern aufgerufen werden –
 * nur dort dürfen Cookies gesetzt werden.
 */
export async function sitzungStarten(userId: string): Promise<void> {
  // 32 Zufallsbytes = praktisch nicht zu erraten
  const token = randomBytes(32).toString("base64url");
  const laeuftAbAm = new Date(Date.now() + GUELTIG_TAGE * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: tokenHashen(token), userId, laeuftAbAm },
  });

  const kekse = await cookies();
  kekse.set(SITZUNGS_COOKIE, token, {
    httpOnly: true, // per JavaScript nicht lesbar -> schützt vor XSS-Diebstahl
    sameSite: "lax", // wird bei Anfragen von fremden Seiten nicht mitgeschickt
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: laeuftAbAm,
  });
}

/** Meldet den aktuellen Browser ab und löscht die Sitzung. */
export async function sitzungBeenden(): Promise<void> {
  const kekse = await cookies();
  const token = kekse.get(SITZUNGS_COOKIE)?.value;

  if (token) {
    // deleteMany statt delete: wirft keinen Fehler, wenn es sie nicht mehr gibt
    await prisma.session.deleteMany({ where: { tokenHash: tokenHashen(token) } });
  }
  kekse.delete(SITZUNGS_COOKIE);
}

/**
 * Wer ist gerade angemeldet? Gibt null zurück, wenn niemand angemeldet ist.
 *
 * `cache` sorgt dafür, dass die Datenbank pro Seitenaufruf nur einmal
 * gefragt wird, auch wenn mehrere Stellen den Nutzer brauchen.
 */
export const aktuellerNutzer = cache(
  async (): Promise<AngemeldeterNutzer | null> => {
    const kekse = await cookies();
    const token = kekse.get(SITZUNGS_COOKIE)?.value;
    if (!token) return null;

    const sitzung = await prisma.session.findUnique({
      where: { tokenHash: tokenHashen(token) },
      include: { user: true },
    });

    if (!sitzung) return null;

    // Abgelaufen? Dann gilt sie nicht mehr.
    if (sitzung.laeuftAbAm.getTime() < Date.now()) return null;

    const { user } = sitzung;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      klasse: user.klasse,
      rolle: user.rolle,
    };
  },
);

/** Ist der aktuelle Nutzer Admin? */
export async function istAdmin(): Promise<boolean> {
  const nutzer = await aktuellerNutzer();
  return nutzer?.rolle === "ADMIN";
}

/**
 * Für Server Actions im Admin-Bereich: bricht ab, wenn kein Admin.
 * Gibt den Nutzer zurück, damit man ihn direkt weiterverwenden kann.
 */
export async function nurAdmin(): Promise<AngemeldeterNutzer> {
  const nutzer = await aktuellerNutzer();
  if (nutzer?.rolle !== "ADMIN") {
    throw new Error("Kein Zugriff: nur für Admins.");
  }
  return nutzer;
}

/** Räumt abgelaufene Sitzungen weg (wird beim Anmelden nebenbei erledigt). */
export async function abgelaufeneSitzungenLoeschen(): Promise<void> {
  await prisma.session.deleteMany({
    where: { laeuftAbAm: { lt: new Date() } },
  });
}
