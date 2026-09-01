"use server";

/**
 * Server Actions für den Admin-Bereich.
 * Jede Aktion prüft zuerst über nurAdmin(), ob wirklich ein Admin am Werk ist.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nurAdmin } from "@/lib/auth";
import { istStatus } from "@/lib/status";

/** Alle Admin-Seiten neu laden lassen. */
function adminNeuLaden() {
  revalidatePath("/admin");
  revalidatePath("/admin/einkauf");
  revalidatePath("/admin/bestellungen");
  revalidatePath("/admin/kunden");
  revalidatePath("/admin/kasse");
  revalidatePath("/admin/archiv");
  revalidatePath("/meine-bestellungen");
}

// ------------------------------------------------------------ Bestellungen

/** Häkchen "bezahlt" setzen oder entfernen. */
export async function bezahltUmschalten(orderId: string, bezahlt: boolean) {
  await nurAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { bezahlt } });
  adminNeuLaden();
}

/**
 * Status ändern. Die Änderung wird zusätzlich im Verlauf mitgeschrieben,
 * damit der Kunde sehen kann, wann was passiert ist.
 */
export async function statusSetzen(
  orderId: string,
  status: string,
  notiz?: string,
) {
  await nurAdmin();

  if (!istStatus(status)) {
    throw new Error(`Unbekannter Status: ${status}`);
  }

  const jetzt = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status, statusAm: jetzt },
    }),
    prisma.orderStatus.create({
      data: { orderId, status, am: jetzt, notiz: notiz?.trim() || null },
    }),
  ]);

  adminNeuLaden();
  revalidatePath(`/bestellung/${orderId}`);
}

/** Status für mehrere Bestellungen auf einmal setzen. */
export async function statusFuerAlleSetzen(status: string) {
  await nurAdmin();
  if (!istStatus(status)) throw new Error(`Unbekannter Status: ${status}`);

  const offene = await prisma.order.findMany({
    where: { abgeschlossen: false, status: { not: status } },
    select: { id: true },
  });

  const jetzt = new Date();
  await prisma.$transaction([
    prisma.order.updateMany({
      where: { id: { in: offene.map((o) => o.id) } },
      data: { status, statusAm: jetzt },
    }),
    prisma.orderStatus.createMany({
      data: offene.map((o) => ({ orderId: o.id, status, am: jetzt })),
    }),
  ]);

  adminNeuLaden();
  return offene.length;
}

/** Eine einzelne (falsche) Bestellung löschen. */
export async function bestellungLoeschen(orderId: string) {
  await nurAdmin();
  await prisma.order.delete({ where: { id: orderId } });
  adminNeuLaden();
}

/**
 * "Tag abschließen": alle offenen Bestellungen ins Archiv verschieben.
 * Gelöscht wird nichts – der Kunde sieht seine Bestellung weiterhin.
 * Wer noch nicht auf "zugestellt" steht, bekommt den Status gleich mit.
 */
export async function tagAbschliessen() {
  await nurAdmin();

  const offene = await prisma.order.findMany({
    where: { abgeschlossen: false },
    select: { id: true, status: true },
  });

  const jetzt = new Date();
  const nochNichtZugestellt = offene.filter((o) => o.status !== "ZUGESTELLT");

  await prisma.$transaction([
    prisma.order.updateMany({
      where: { abgeschlossen: false },
      data: { abgeschlossen: true },
    }),
    prisma.order.updateMany({
      where: { id: { in: nochNichtZugestellt.map((o) => o.id) } },
      data: { status: "ZUGESTELLT", statusAm: jetzt },
    }),
    prisma.orderStatus.createMany({
      data: nochNichtZugestellt.map((o) => ({
        orderId: o.id,
        status: "ZUGESTELLT",
        am: jetzt,
      })),
    }),
  ]);

  adminNeuLaden();
  return offene.length;
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
  if (bildUrl && !/^https?:\/\//i.test(bildUrl))
    return { fehler: "Die Bild-Adresse muss mit http:// oder https:// beginnen." };

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
    return { fehler: `Es gibt schon ein Produkt mit dem Namen „${name}".` };
  }

  revalidatePath("/admin/produkte");
  revalidatePath("/");
  return { erfolg: id ? "Gespeichert." : `„${name}" angelegt.` };
}

/** Produkt veröffentlichen bzw. verstecken. */
export async function produktAktivUmschalten(id: number, aktiv: boolean) {
  await nurAdmin();
  await prisma.product.update({ where: { id }, data: { aktiv } });
  revalidatePath("/admin/produkte");
  revalidatePath("/");
}

/** Mehrere Produkte auf einmal veröffentlichen/verstecken. */
export async function kategorieVeroeffentlichen(
  kategorie: string,
  aktiv: boolean,
) {
  await nurAdmin();
  const ergebnis = await prisma.product.updateMany({
    where: { kategorie },
    data: { aktiv },
  });
  revalidatePath("/admin/produkte");
  revalidatePath("/");
  return ergebnis.count;
}
