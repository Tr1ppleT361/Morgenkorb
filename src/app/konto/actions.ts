"use server";

/**
 * Server Actions rund ums Konto: registrieren, anmelden, abmelden.
 * "use server" heißt: läuft nur auf dem Server, nie im Browser.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  MIN_PASSWORT_LAENGE,
  passwortHashen,
  passwortPruefen,
} from "@/lib/passwort";
import {
  abgelaufeneSitzungenLoeschen,
  adminKontoSicherstellen,
  aktuellerNutzer,
  istAdminEmail,
  sitzungBeenden,
  sitzungStarten,
} from "@/lib/auth";
import { bestaetigungsmailSenden, mailEingerichtet, testmodus } from "@/lib/email";
import { codeAnlegen, codePruefen, emailPlausibel } from "@/lib/verifizierung";

export type KontoStatus = { fehler?: string; erfolg?: string };

/** E-Mail vereinheitlichen: keine Leerzeichen, alles klein. */
function emailNormalisieren(roh: string): string {
  return roh.trim().toLowerCase();
}

/** Grobe Prüfung: etwas@etwas.etwas */
function emailSiehtEchtAus(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Kleine Bremse gegen wildes Durchprobieren von Passwörtern. */
function bremse() {
  return new Promise((r) => setTimeout(r, 600));
}

/** Wohin nach dem Anmelden? Nur eigene Pfade zulassen (kein Weiterleiten
 *  auf fremde Seiten). */
function sicheresZiel(ziel: string | null): string {
  if (!ziel || !ziel.startsWith("/") || ziel.startsWith("//")) return "/";
  return ziel;
}

// ------------------------------------------------------------ Registrieren

export async function registrieren(
  _vorher: KontoStatus,
  formData: FormData,
): Promise<KontoStatus> {
  const name = String(formData.get("name") ?? "").trim();
  const email = emailNormalisieren(String(formData.get("email") ?? ""));
  const klasse = String(formData.get("klasse") ?? "").trim() || null;
  const passwort = String(formData.get("passwort") ?? "");
  const ziel = sicheresZiel(String(formData.get("ziel") ?? "") || null);

  if (name.length < 2) return { fehler: "Bitte gib deinen Namen an." };
  if (name.length > 60) return { fehler: "Der Name ist zu lang." };

  // Adresse vorprüfen, bevor wir überhaupt eine Mail losschicken
  const emailFehler = emailPlausibel(email);
  if (emailFehler) return { fehler: emailFehler };

  if (klasse && klasse.length > 20) return { fehler: "Die Klasse ist zu lang." };
  if (passwort.length < MIN_PASSWORT_LAENGE)
    return {
      fehler: `Das Passwort braucht mindestens ${MIN_PASSWORT_LAENGE} Zeichen.`,
    };
  if (passwort.length > 200) return { fehler: "Das Passwort ist zu lang." };

  const vorhanden = await prisma.user.findUnique({ where: { email } });

  if (vorhanden) {
    // Konto existiert, ist aber noch nicht bestätigt? Dann darf man es
    // erneut versuchen – sonst blockiert ein Tippfehler die Adresse für immer.
    if (vorhanden.emailVerifiziertAm) {
      return {
        fehler:
          "Für diese E-Mail gibt es schon ein Konto. Melde dich einfach an.",
      };
    }

    await prisma.user.update({
      where: { id: vorhanden.id },
      data: { name, klasse, passwortHash: await passwortHashen(passwort) },
    });

    return codeVerschicken(vorhanden.id, name, email, ziel);
  }

  const nutzer = await prisma.user.create({
    data: {
      name,
      email,
      klasse,
      passwortHash: await passwortHashen(passwort),
      rolle: istAdminEmail(email) ? "ADMIN" : "BESTELLER",
    },
  });

  return codeVerschicken(nutzer.id, name, email, ziel);
}

/**
 * Legt einen Code an, verschickt ihn und leitet zur Eingabeseite weiter.
 * Klappt der Versand nicht, wird das Konto wieder entfernt – sonst wäre
 * die Adresse blockiert, ohne dass jemand den Code bekommen hätte.
 */
async function codeVerschicken(
  userId: string,
  name: string,
  email: string,
  ziel: string,
): Promise<KontoStatus> {
  const code = await codeAnlegen(userId);
  if (!code.ok) return { fehler: code.fehler };

  const mail = await bestaetigungsmailSenden(email, name, code.code);

  if (!mail.ok) {
    // Konto nur aufräumen, wenn es noch nie bestätigt war
    await prisma.user.deleteMany({
      where: { id: userId, emailVerifiziertAm: null },
    });
    return { fehler: mail.fehler };
  }

  if (!mail.verschickt) {
    // Testmodus ohne echten Versand – Code steht im Server-Log
    console.log(`[TESTMODUS] Bestätigungscode für ${email}: ${code.code}`);
  }

  redirect(
    `/bestaetigen?email=${encodeURIComponent(email)}&ziel=${encodeURIComponent(ziel)}`,
  );
}

/** Neuen Code anfordern. */
export async function codeErneutSenden(
  _vorher: KontoStatus,
  formData: FormData,
): Promise<KontoStatus> {
  const email = emailNormalisieren(String(formData.get("email") ?? ""));
  const nutzer = await prisma.user.findUnique({ where: { email } });

  // Immer dieselbe Antwort, egal ob es das Konto gibt
  if (!nutzer || nutzer.emailVerifiziertAm) {
    await bremse();
    return { erfolg: "Falls das Konto existiert, ist ein neuer Code unterwegs." };
  }

  const code = await codeAnlegen(nutzer.id);
  if (!code.ok) return { fehler: code.fehler };

  const mail = await bestaetigungsmailSenden(email, nutzer.name, code.code);
  if (!mail.ok) return { fehler: mail.fehler };

  if (!mail.verschickt)
    console.log(`[TESTMODUS] Bestätigungscode für ${email}: ${code.code}`);

  return { erfolg: "Neuer Code verschickt. Schau in dein Postfach." };
}

/** Den eingegebenen Code prüfen und das Konto freischalten. */
export async function codeBestaetigen(
  _vorher: KontoStatus,
  formData: FormData,
): Promise<KontoStatus> {
  const email = emailNormalisieren(String(formData.get("email") ?? ""));
  const eingabe = String(formData.get("code") ?? "");
  const ziel = sicheresZiel(String(formData.get("ziel") ?? "") || null);

  const nutzer = await prisma.user.findUnique({ where: { email } });
  if (!nutzer) {
    await bremse();
    return { fehler: "Zu dieser Adresse gibt es kein Konto." };
  }
  if (nutzer.emailVerifiziertAm) {
    return { fehler: "Dieses Konto ist schon bestätigt. Melde dich einfach an." };
  }

  const ergebnis = await codePruefen(nutzer.id, eingabe);
  if (!ergebnis.ok) {
    await bremse();
    return { fehler: ergebnis.fehler };
  }

  // Bestätigt -> direkt anmelden
  await sitzungStarten(nutzer.id);
  revalidatePath("/", "layout");
  redirect(ziel);
}

// ---------------------------------------------------------------- Anmelden

export async function anmelden(
  _vorher: KontoStatus,
  formData: FormData,
): Promise<KontoStatus> {
  const email = emailNormalisieren(String(formData.get("email") ?? ""));
  const passwort = String(formData.get("passwort") ?? "");
  const ziel = sicheresZiel(String(formData.get("ziel") ?? "") || null);

  // Admin-Konto aus den Umgebungsvariablen anlegen/aktualisieren,
  // damit die Anmeldung direkt nach dem Deployment funktioniert.
  await adminKontoSicherstellen();

  const nutzer = await prisma.user.findUnique({ where: { email } });

  // Wichtig: bei falscher E-Mail und bei falschem Passwort dieselbe Meldung.
  // Sonst könnte jemand herausfinden, welche E-Mails ein Konto haben.
  const stimmt =
    nutzer !== null && (await passwortPruefen(passwort, nutzer.passwortHash));

  if (!nutzer || !stimmt) {
    await bremse();
    return { fehler: "E-Mail oder Passwort stimmt nicht." };
  }

  // Nachträglich in ADMIN_EMAILS eingetragen? Dann jetzt übernehmen.
  if (istAdminEmail(email) && nutzer.rolle !== "ADMIN") {
    await prisma.user.update({
      where: { id: nutzer.id },
      data: { rolle: "ADMIN" },
    });
  }

  // Noch nicht bestätigt? Dann zurück zur Code-Eingabe statt anmelden.
  if (!nutzer.emailVerifiziertAm && nutzer.rolle !== "ADMIN") {
    const code = await codeAnlegen(nutzer.id);
    if (code.ok) {
      const mail = await bestaetigungsmailSenden(email, nutzer.name, code.code);
      if (mail.ok && !mail.verschickt)
        console.log(`[TESTMODUS] Bestätigungscode für ${email}: ${code.code}`);
    }
    redirect(
      `/bestaetigen?email=${encodeURIComponent(email)}&ziel=${encodeURIComponent(ziel)}&neu=1`,
    );
  }

  await abgelaufeneSitzungenLoeschen();
  await sitzungStarten(nutzer.id);
  revalidatePath("/", "layout");
  redirect(ziel);
}

// ---------------------------------------------------------------- Abmelden

export async function abmelden() {
  await sitzungBeenden();
  revalidatePath("/", "layout");
  redirect("/");
}
