"use server";

/**
 * Server Actions für den Admin-Bereich.
 * Jede Aktion prüft zuerst über nurAdmin(), ob wirklich ein Admin am Werk ist.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nurAdmin } from "@/lib/auth";
import { istStatus } from "@/lib/status";
import { alsMinuten, bestellzeitenSpeichern } from "@/lib/einstellungen";

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

/** Shop und Produktverwaltung neu laden lassen. */
function produkteNeuLaden() {
  revalidatePath("/");
  revalidatePath("/admin/produkte");
  revalidatePath("/admin/kategorien");
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

/** "1,49" oder "1.49" -> 149 Cent. null, wenn ungültig. */
function alsCent(text: string): number | null {
  const zahl = Number(text.replace(",", ".").trim());
  if (!Number.isFinite(zahl) || zahl <= 0) return null;
  // Math.round verhindert Rundungsfehler: 1.49 * 100 = 148.99999...
  return Math.round(zahl * 100);
}

/** Produkt anlegen oder bearbeiten (ein Formular für beides). */
export async function produktSpeichern(
  _vorher: ProduktStatus,
  formData: FormData,
): Promise<ProduktStatus> {
  await nurAdmin();

  const idRoh = String(formData.get("id") ?? "");
  const id = idRoh ? Number(idRoh) : null;
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = Number(formData.get("categoryId") ?? 0);
  const bildUrl = String(formData.get("bildUrl") ?? "").trim() || null;
  const aktiv = formData.get("aktiv") === "on";
  const preis = alsCent(String(formData.get("preis") ?? ""));
  const einkaufRoh = String(formData.get("einkauf") ?? "").trim();
  const einkauf = einkaufRoh ? alsCent(einkaufRoh) : null;

  if (!name) return { fehler: "Bitte einen Namen eingeben." };
  if (!categoryId) return { fehler: "Bitte eine Kategorie wählen." };
  if (preis === null)
    return { fehler: "Bitte einen gültigen Preis eingeben, z. B. 1,50." };
  if (einkaufRoh && einkauf === null)
    return { fehler: "Der Einkaufspreis sieht nicht richtig aus." };
  if (bildUrl && !/^https?:\/\//i.test(bildUrl))
    return { fehler: "Die Bild-Adresse muss mit http:// oder https:// beginnen." };

  const daten = { name, preis, einkauf, categoryId, bildUrl, aktiv };

  try {
    if (id) await prisma.product.update({ where: { id }, data: daten });
    else await prisma.product.create({ data: daten });
  } catch {
    return { fehler: `Es gibt schon ein Produkt mit dem Namen „${name}".` };
  }

  produkteNeuLaden();
  return { erfolg: id ? "Gespeichert." : `„${name}" angelegt.` };
}

/**
 * Produkt endgültig löschen.
 *
 * Achtung: Ein Produkt, das in einer Bestellung steckt, kann nicht gelöscht
 * werden – sonst wären alte Bestellungen kaputt. In dem Fall sagen wir das
 * und schlagen "verstecken" vor.
 */
export async function produktLoeschen(
  id: number,
): Promise<{ ok: boolean; fehler?: string }> {
  await nurAdmin();

  const inBestellungen = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (inBestellungen > 0) {
    return {
      ok: false,
      fehler:
        `Dieses Produkt steckt in ${inBestellungen} ` +
        `${inBestellungen === 1 ? "Bestellung" : "Bestellungen"}. ` +
        `Lösche es nicht, sondern verstecke es – sonst fehlen in alten ` +
        `Bestellungen die Angaben.`,
    };
  }

  await prisma.product.delete({ where: { id } });
  produkteNeuLaden();
  return { ok: true };
}

/** Produkt veröffentlichen bzw. verstecken. */
export async function produktAktivUmschalten(id: number, aktiv: boolean) {
  await nurAdmin();
  await prisma.product.update({ where: { id }, data: { aktiv } });
  produkteNeuLaden();
}

// -------------------------------------------------------------- Varianten

/** Eine Sorte anlegen oder ändern, z. B. "Fanta Exotic". */
export async function varianteSpeichern(
  _vorher: ProduktStatus,
  formData: FormData,
): Promise<ProduktStatus> {
  await nurAdmin();

  const idRoh = String(formData.get("id") ?? "");
  const id = idRoh ? Number(idRoh) : null;
  const productId = Number(formData.get("productId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const preis = alsCent(String(formData.get("preis") ?? ""));
  const einkaufRoh = String(formData.get("einkauf") ?? "").trim();
  const einkauf = einkaufRoh ? alsCent(einkaufRoh) : null;

  if (!productId) return { fehler: "Kein Produkt angegeben." };
  if (!name) return { fehler: "Bitte einen Namen für die Sorte eingeben." };
  if (preis === null) return { fehler: "Bitte einen gültigen Preis eingeben." };

  try {
    if (id)
      await prisma.productVariant.update({
        where: { id },
        data: { name, preis, einkauf },
      });
    else
      await prisma.productVariant.create({
        data: { productId, name, preis, einkauf },
      });
  } catch {
    return { fehler: `Die Sorte „${name}" gibt es bei diesem Produkt schon.` };
  }

  produkteNeuLaden();
  return { erfolg: "Sorte gespeichert." };
}

/** Eine Sorte löschen. */
export async function varianteLoeschen(
  id: number,
): Promise<{ ok: boolean; fehler?: string }> {
  await nurAdmin();

  const inBestellungen = await prisma.orderItem.count({ where: { variantId: id } });
  if (inBestellungen > 0) {
    // Der Name steht als Kopie in der Bestellung, deshalb ist Löschen hier
    // unkritisch – die Verknüpfung wird einfach gelöst.
    await prisma.orderItem.updateMany({
      where: { variantId: id },
      data: { variantId: null },
    });
  }

  await prisma.productVariant.delete({ where: { id } });
  produkteNeuLaden();
  return { ok: true };
}

/** Sorte veröffentlichen bzw. verstecken. */
export async function varianteAktivUmschalten(id: number, aktiv: boolean) {
  await nurAdmin();
  await prisma.productVariant.update({ where: { id }, data: { aktiv } });
  produkteNeuLaden();
}

// ------------------------------------------------------------- Kategorien

export async function kategorieAnlegen(
  _vorher: ProduktStatus,
  formData: FormData,
): Promise<ProduktStatus> {
  await nurAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const sortierungRoh = String(formData.get("sortierung") ?? "").trim();
  const sortierung = sortierungRoh ? Number(sortierungRoh) : 100;

  if (!name) return { fehler: "Bitte einen Namen eingeben." };
  if (name.length > 40) return { fehler: "Der Name ist zu lang." };
  if (!Number.isFinite(sortierung))
    return { fehler: "Die Reihenfolge muss eine Zahl sein." };

  try {
    await prisma.category.create({ data: { name, sortierung } });
  } catch {
    return { fehler: `Die Kategorie „${name}" gibt es schon.` };
  }

  produkteNeuLaden();
  return { erfolg: `„${name}" angelegt.` };
}

export async function kategorieUmbenennen(
  id: number,
  name: string,
  sortierung: number,
) {
  await nurAdmin();
  await prisma.category.update({
    where: { id },
    data: { name: name.trim(), sortierung },
  });
  produkteNeuLaden();
}

/**
 * Kategorie löschen. Geht nur, wenn keine Produkte mehr drin sind –
 * sonst wüssten die Produkte nicht, wohin sie gehören.
 */
export async function kategorieLoeschen(
  id: number,
): Promise<{ ok: boolean; fehler?: string }> {
  await nurAdmin();

  const anzahl = await prisma.product.count({ where: { categoryId: id } });
  if (anzahl > 0) {
    return {
      ok: false,
      fehler:
        `In dieser Kategorie sind noch ${anzahl} Produkte. ` +
        `Verschiebe sie zuerst in eine andere Kategorie.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  produkteNeuLaden();
  return { ok: true };
}

/** Ganze Kategorie ein- oder ausblenden – praktisch für Bäckerei-Tage. */
export async function kategorieAktivUmschalten(id: number, aktiv: boolean) {
  await nurAdmin();
  await prisma.category.update({ where: { id }, data: { aktiv } });
  produkteNeuLaden();
}

/** Alle Produkte einer Kategorie auf einmal veröffentlichen/verstecken. */
export async function kategorieVeroeffentlichen(
  categoryId: number,
  aktiv: boolean,
) {
  await nurAdmin();
  const ergebnis = await prisma.product.updateMany({
    where: { categoryId },
    data: { aktiv },
  });
  produkteNeuLaden();
  return ergebnis.count;
}

// ----------------------------------------------------------- Bestellzeiten

export type ZeitenStatus = { fehler?: string; erfolg?: string };

/** Speichert das Bestellzeitfenster. */
export async function bestellzeitenSetzen(
  _vorher: ZeitenStatus,
  formData: FormData,
): Promise<ZeitenStatus> {
  await nurAdmin();

  const start = String(formData.get("start") ?? "").trim();
  const ende = String(formData.get("ende") ?? "").trim();
  const aktiv = formData.get("aktiv") === "on";

  if (alsMinuten(start) === null)
    return { fehler: "Die Startzeit muss so aussehen: 07:00" };
  if (alsMinuten(ende) === null)
    return { fehler: "Die Endzeit muss so aussehen: 20:00" };
  if (start === ende)
    return { fehler: "Start- und Endzeit dürfen nicht gleich sein." };

  await bestellzeitenSpeichern({ start, ende, aktiv });

  revalidatePath("/", "layout");
  revalidatePath("/admin/einstellungen");
  return { erfolg: "Bestellzeiten gespeichert." };
}
