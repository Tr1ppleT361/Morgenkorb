"use server";

/**
 * Server Actions für den Admin-Bereich.
 * Jede Aktion prüft zuerst, ob man überhaupt eingeloggt ist.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminToken, istAdmin, passwortStimmt } from "@/lib/auth";

/** Wirft einen Fehler, wenn jemand nicht eingeloggt ist. */
async function nurAdmin() {
  if (!(await istAdmin())) {
    throw new Error("Nicht eingeloggt.");
  }
}

// ---------------------------------------------------------------- Login

export type LoginStatus = { fehler?: string };

export async function einloggen(
  _vorher: LoginStatus,
  formData: FormData,
): Promise<LoginStatus> {
  const passwort = String(formData.get("passwort") ?? "");

  if (!passwortStimmt(passwort)) {
    // Kleine Bremse gegen wildes Durchprobieren
    await new Promise((r) => setTimeout(r, 700));
    return { fehler: "Falsches Passwort." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true, // per JavaScript nicht lesbar
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage eingeloggt bleiben
  });

  redirect("/admin");
}

export async function ausloggen() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}

// ------------------------------------------------------------ Bestellungen

/** Häkchen "bezahlt" bei einer Bestellung setzen oder entfernen. */
export async function bezahltUmschalten(orderId: string, bezahlt: boolean) {
  await nurAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { bezahlt } });
  revalidatePath("/admin/personen");
}

/** Eine einzelne (falsche) Bestellung löschen. */
export async function bestellungLoeschen(orderId: string) {
  await nurAdmin();
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/admin");
  revalidatePath("/admin/personen");
}

/**
 * "Tag abschließen": alle offenen Bestellungen ins Archiv verschieben.
 * Gelöscht wird nichts – sie tauchen nur nicht mehr in der Tagesliste auf.
 */
export async function tagAbschliessen() {
  await nurAdmin();
  const ergebnis = await prisma.order.updateMany({
    where: { abgeschlossen: false },
    data: { abgeschlossen: true },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/personen");
  revalidatePath("/admin/archiv");
  return ergebnis.count;
}

// --------------------------------------------------------------- Produkte

export type ProduktStatus = { fehler?: string; erfolg?: string };

/** Produkt anlegen oder bearbeiten (ein Formular für beides). */
export async function produktSpeichern(
  _vorher: ProduktStatus,
  formData: FormData,
): Promise<ProduktStatus> {
  await nurAdmin();

  const idRoh = String(formData.get("id") ?? "");
  const id = idRoh ? Number(idRoh) : null;
  const name = String(formData.get("name") ?? "").trim();
  const kategorie = String(formData.get("kategorie") ?? "").trim();
  const bildUrl = String(formData.get("bildUrl") ?? "").trim() || null;
  const aktiv = formData.get("aktiv") === "on";

  // Der Preis wird als "1,49" eingegeben und in Cent umgerechnet.
  const preisText = String(formData.get("preis") ?? "").replace(",", ".");
  const preisEuro = Number(preisText);

  if (!name) return { fehler: "Bitte einen Namen eingeben." };
  if (!kategorie) return { fehler: "Bitte eine Kategorie eingeben." };
  if (!Number.isFinite(preisEuro) || preisEuro <= 0)
    return { fehler: "Bitte einen gültigen Preis eingeben, z. B. 1,49." };

  // Math.round verhindert Rundungsfehler: 1.49 * 100 = 148.99999...
  const preis = Math.round(preisEuro * 100);

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: { name, preis, kategorie, bildUrl, aktiv },
      });
    } else {
      await prisma.product.create({
        data: { name, preis, kategorie, bildUrl, aktiv },
      });
    }
  } catch {
    return { fehler: `Es gibt schon ein Produkt mit dem Namen „${name}“.` };
  }

  revalidatePath("/admin/produkte");
  revalidatePath("/");
  return { erfolg: id ? "Gespeichert." : `„${name}“ angelegt.` };
}

/** Produkt aktiv/inaktiv schalten (inaktive erscheinen nicht im Shop). */
export async function produktAktivUmschalten(id: number, aktiv: boolean) {
  await nurAdmin();
  await prisma.product.update({ where: { id }, data: { aktiv } });
  revalidatePath("/admin/produkte");
  revalidatePath("/");
}
