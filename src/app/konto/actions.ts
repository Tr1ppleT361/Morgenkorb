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
  istAdminEmail,
  sitzungBeenden,
  sitzungStarten,
} from "@/lib/auth";

export type KontoStatus = { fehler?: string };

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
  if (!emailSiehtEchtAus(email))
    return { fehler: "Diese E-Mail-Adresse sieht nicht richtig aus." };
  if (email.length > 120) return { fehler: "Die E-Mail-Adresse ist zu lang." };
  if (klasse && klasse.length > 20) return { fehler: "Die Klasse ist zu lang." };
  if (passwort.length < MIN_PASSWORT_LAENGE)
    return {
      fehler: `Das Passwort braucht mindestens ${MIN_PASSWORT_LAENGE} Zeichen.`,
    };
  if (passwort.length > 200) return { fehler: "Das Passwort ist zu lang." };

  if (await prisma.user.findUnique({ where: { email } })) {
    return {
      fehler: "Für diese E-Mail gibt es schon ein Konto. Melde dich einfach an.",
    };
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
