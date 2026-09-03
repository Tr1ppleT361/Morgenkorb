/**
 * Bestätigungscodes für die E-Mail-Verifizierung.
 *
 * Wie bei Passwörtern speichern wir nur den Hash des Codes. Wer die
 * Datenbank liest, kann damit kein fremdes Konto freischalten.
 */
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

/** Wie lange gilt ein Code? */
const GUELTIG_MINUTEN = 30;
/** Nach so vielen Fehlversuchen ist der Code verbrannt. */
const MAX_VERSUCHE = 5;
/** So oft darf man sich pro Konto und Stunde einen neuen schicken lassen. */
const MAX_CODES_PRO_STUNDE = 5;

function hashen(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Sechsstelliger Code, gleichmäßig zufällig. */
export function codeErzeugen(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Legt einen neuen Code an und gibt ihn im Klartext zurück –
 * ausschließlich, um ihn per Mail zu verschicken.
 */
export async function codeAnlegen(
  userId: string,
): Promise<{ ok: true; code: string } | { ok: false; fehler: string }> {
  const vorStunde = new Date(Date.now() - 60 * 60 * 1000);
  const zuletzt = await prisma.verificationCode.count({
    where: { userId, erstelltAm: { gt: vorStunde } },
  });

  if (zuletzt >= MAX_CODES_PRO_STUNDE) {
    return {
      ok: false,
      fehler:
        "Du hast dir schon mehrere Codes schicken lassen. Bitte warte eine Stunde.",
    };
  }

  // Alte Codes desselben Kontos verfallen sofort
  await prisma.verificationCode.deleteMany({ where: { userId } });

  const code = codeErzeugen();
  await prisma.verificationCode.create({
    data: {
      userId,
      codeHash: hashen(code),
      laeuftAbAm: new Date(Date.now() + GUELTIG_MINUTEN * 60 * 1000),
    },
  });

  return { ok: true, code };
}

/** Prüft den eingegebenen Code. Bei Erfolg wird das Konto freigeschaltet. */
export async function codePruefen(
  userId: string,
  eingabe: string,
): Promise<{ ok: true } | { ok: false; fehler: string }> {
  const code = eingabe.replace(/\s/g, "");

  const eintrag = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { erstelltAm: "desc" },
  });

  if (!eintrag) {
    return { ok: false, fehler: "Kein Code vorhanden. Fordere einen neuen an." };
  }
  if (eintrag.laeuftAbAm.getTime() < Date.now()) {
    return { ok: false, fehler: "Der Code ist abgelaufen. Fordere einen neuen an." };
  }
  if (eintrag.versuche >= MAX_VERSUCHE) {
    return {
      ok: false,
      fehler: "Zu viele Fehlversuche. Fordere einen neuen Code an.",
    };
  }

  if (eintrag.codeHash !== hashen(code)) {
    await prisma.verificationCode.update({
      where: { id: eintrag.id },
      data: { versuche: { increment: 1 } },
    });
    const uebrig = MAX_VERSUCHE - eintrag.versuche - 1;
    return {
      ok: false,
      fehler:
        uebrig > 0
          ? `Der Code stimmt nicht. Noch ${uebrig} ${uebrig === 1 ? "Versuch" : "Versuche"}.`
          : "Der Code stimmt nicht. Fordere einen neuen an.",
    };
  }

  // Passt: Konto freischalten und Codes aufräumen
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiziertAm: new Date() },
    }),
    prisma.verificationCode.deleteMany({ where: { userId } }),
  ]);

  return { ok: true };
}

/**
 * Grobe Vorprüfung der Adresse, bevor wir überhaupt eine Mail losschicken.
 * Fängt Tippfehler und offensichtlichen Unsinn ab.
 */
export function emailPlausibel(email: string): string | null {
  const wert = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(wert))
    return "Diese E-Mail-Adresse sieht nicht richtig aus.";
  if (wert.length > 120) return "Die E-Mail-Adresse ist zu lang.";
  if (wert.includes("..")) return "Diese E-Mail-Adresse sieht nicht richtig aus.";

  const domain = wert.split("@")[1] ?? "";

  // Wegwerf-Adressen abweisen
  const wegwerf = [
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
    "temp-mail.org", "trashmail.com", "yopmail.com", "sharklasers.com",
    "getnada.com", "dispostable.com", "maildrop.cc", "wegwerfmail.de",
  ];
  if (wegwerf.includes(domain))
    return "Bitte nimm eine dauerhafte E-Mail-Adresse.";

  // Häufige Vertipper bei bekannten Anbietern
  const vertipper: Record<string, string> = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.de": "gmail.com",
    "gmx.ed": "gmx.de", "web.de.com": "web.de", "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com", "yahou.com": "yahoo.com",
  };
  if (vertipper[domain])
    return `Meintest du @${vertipper[domain]}?`;

  return null;
}
