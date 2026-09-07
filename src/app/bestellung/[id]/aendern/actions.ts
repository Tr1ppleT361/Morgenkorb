"use server";

/**
 * Bestellung ändern und stornieren – durch den Kunden selbst.
 *
 * Die kniffligen Teile:
 *  - Bestände müssen mitgeführt werden: Was rausfliegt, kommt zurück ins
 *    Regal, was dazukommt, wird abgezogen.
 *  - Bei schon bezahlten Bestellungen muss die Differenz stimmen. Wird es
 *    billiger, erstatten wir über Stripe. Wird es teurer, entsteht eine
 *    Nachzahlung, die der Kunde begleichen kann.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { summeCent } from "@/lib/geld";
import { aktuellerNutzer } from "@/lib/auth";
import { aenderbarkeit, aenderGrundText } from "@/lib/aenderfrist";
import { protokollieren } from "@/lib/protokoll";
import { stripe, stripeEingerichtet } from "@/lib/stripe";

export type AenderErgebnis =
  | { ok: true; hinweis: string; nachzahlungCent: number }
  | { ok: false; fehler: string };

/** Darf der aktuelle Besucher diese Bestellung anfassen? */
async function zugriffPruefen(orderId: string) {
  const bestellung = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!bestellung)
    return { fehler: "Bestellung nicht gefunden.", bestellung: null };

  // Bestellungen mit Konto darf nur der Besitzer ändern.
  // Bestellungen ohne Konto schützt die zufällige, nicht erratbare ID.
  if (bestellung.userId) {
    const nutzer = await aktuellerNutzer();
    if (!nutzer || nutzer.id !== bestellung.userId) {
      return { fehler: "Das ist nicht deine Bestellung.", bestellung: null };
    }
  }
  return { fehler: null, bestellung };
}

/** Neue Mengen für eine bestehende Bestellung setzen. */
export async function bestellungAendern(
  orderId: string,
  neueMengen: { itemId: number; menge: number }[],
): Promise<AenderErgebnis> {
  const zugriff = await zugriffPruefen(orderId);
  if (zugriff.fehler) return { ok: false, fehler: zugriff.fehler };
  const alt = zugriff.bestellung!;

  const darf = await aenderbarkeit(alt);
  if (!darf.erlaubt) return { ok: false, fehler: aenderGrundText(darf) };

  // Mengen zusammenführen und prüfen
  const wunsch = new Map(neueMengen.map((m) => [m.itemId, Math.max(0, m.menge)]));
  const alteSumme = summeCent(alt.items);

  const aenderungen: {
    item: (typeof alt.items)[number];
    vorher: number;
    nachher: number;
  }[] = [];

  for (const item of alt.items) {
    const nachher = wunsch.get(item.id) ?? item.menge;
    if (nachher !== item.menge)
      aenderungen.push({ item, vorher: item.menge, nachher });
  }

  if (aenderungen.length === 0)
    return { ok: false, fehler: "Es hat sich nichts geändert." };

  // Wird etwas erhöht? Dann muss genug Bestand da sein.
  for (const a of aenderungen.filter((x) => x.nachher > x.vorher)) {
    const mehr = a.nachher - a.vorher;
    if (a.item.variantId) {
      const v = await prisma.productVariant.findUnique({
        where: { id: a.item.variantId },
      });
      if (v?.bestand !== null && v?.bestand !== undefined && v.bestand < mehr)
        return {
          ok: false,
          fehler: `Von „${a.item.variantName}" sind nur noch ${v.bestand} Stück da.`,
        };
    } else {
      const p = await prisma.product.findUnique({
        where: { id: a.item.productId },
      });
      if (p?.bestand !== null && p?.bestand !== undefined && p.bestand < mehr)
        return {
          ok: false,
          fehler: `Davon sind nur noch ${p.bestand} Stück da.`,
        };
    }
  }

  const neueSumme = alt.items.reduce(
    (s, i) => s + (wunsch.get(i.id) ?? i.menge) * i.preisBeimKauf,
    0,
  );

  if (neueSumme <= 0)
    return {
      ok: false,
      fehler: "So bleibt nichts übrig – storniere die Bestellung stattdessen.",
    };

  // Alles zusammen speichern: Mengen, Bestände, Zeitstempel
  await prisma.$transaction(async (tx) => {
    for (const a of aenderungen) {
      if (a.nachher === 0) {
        await tx.orderItem.delete({ where: { id: a.item.id } });
      } else {
        await tx.orderItem.update({
          where: { id: a.item.id },
          data: { menge: a.nachher },
        });
      }

      // Bestand angleichen: weniger bestellt = zurück ins Regal
      const differenz = a.nachher - a.vorher;
      if (a.item.variantId) {
        await tx.productVariant.updateMany({
          where: { id: a.item.variantId, bestand: { not: null } },
          data: { bestand: { decrement: differenz } },
        });
      } else {
        await tx.product.updateMany({
          where: { id: a.item.productId, bestand: { not: null } },
          data: { bestand: { decrement: differenz } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { geaendertAm: new Date() },
    });
  });

  // --- Geld ---
  const differenz = neueSumme - alteSumme;
  let hinweis = "Änderung gespeichert.";
  let nachzahlung = 0;

  if (alt.zahlstatus === "BEZAHLT" && differenz < 0) {
    // Zu viel bezahlt -> erstatten
    const erstatten = Math.min(
      -differenz,
      alteSumme - alt.erstattetCent, // nie mehr als bezahlt
    );
    const erfolg = await erstatten_(alt.stripePaymentIntentId, erstatten);

    if (erfolg) {
      await prisma.order.update({
        where: { id: orderId },
        data: { erstattetCent: { increment: erstatten } },
      });
      hinweis = `Änderung gespeichert. ${(erstatten / 100).toFixed(2).replace(".", ",")} € werden erstattet.`;
    } else {
      hinweis =
        "Änderung gespeichert. Die Rückerstattung klappt nicht automatisch – melde dich beim Einkauf.";
    }
  } else if (alt.zahlstatus === "BEZAHLT" && differenz > 0) {
    // Zu wenig bezahlt -> Nachzahlung offen
    nachzahlung = differenz;
    await prisma.order.update({
      where: { id: orderId },
      data: { zahlstatus: "OFFEN", bezahlt: false },
    });
    hinweis = `Änderung gespeichert. Es fehlen noch ${(differenz / 100).toFixed(2).replace(".", ",")} €.`;
  }

  const nutzer = await aktuellerNutzer();
  await protokollieren({
    wer: nutzer?.email ?? "Kunde",
    aktion: "Bestellung geändert",
    objekt: `Bestellung ${orderId}`,
    details: `${(alteSumme / 100).toFixed(2)} € → ${(neueSumme / 100).toFixed(2)} € (${aenderungen.length} Positionen)`,
  });

  revalidatePath(`/bestellung/${orderId}`);
  revalidatePath("/konto");
  revalidatePath("/admin/bestellungen");

  return { ok: true, hinweis, nachzahlungCent: nachzahlung };
}

/** Bestellung stornieren. */
export async function bestellungStornieren(
  orderId: string,
): Promise<AenderErgebnis> {
  const zugriff = await zugriffPruefen(orderId);
  if (zugriff.fehler) return { ok: false, fehler: zugriff.fehler };
  const alt = zugriff.bestellung!;

  const darf = await aenderbarkeit(alt);
  if (!darf.erlaubt) return { ok: false, fehler: aenderGrundText(darf) };

  const summe = summeCent(alt.items);
  let hinweis = "Bestellung storniert.";

  // Bezahltes Geld zurück
  if (alt.zahlstatus === "BEZAHLT") {
    const offen = summe - alt.erstattetCent;
    const erfolg = offen > 0 && (await erstatten_(alt.stripePaymentIntentId, offen));
    hinweis = erfolg
      ? `Bestellung storniert. ${(offen / 100).toFixed(2).replace(".", ",")} € werden erstattet – das dauert je nach Bank ein paar Tage.`
      : "Bestellung storniert. Melde dich beim Einkauf wegen der Rückerstattung.";
  }

  await prisma.$transaction(async (tx) => {
    // Bestände zurückgeben
    for (const item of alt.items) {
      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId, bestand: { not: null } },
          data: { bestand: { increment: item.menge } },
        });
      } else {
        await tx.product.updateMany({
          where: { id: item.productId, bestand: { not: null } },
          data: { bestand: { increment: item.menge } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "STORNIERT",
        statusAm: new Date(),
        geaendertAm: new Date(),
        ...(alt.zahlstatus === "BEZAHLT"
          ? { zahlstatus: "ERSTATTET", bezahlt: false, erstattetCent: summe }
          : {}),
      },
    });

    await tx.orderStatus.create({
      data: { orderId, status: "STORNIERT", notiz: "Vom Kunden storniert" },
    });
  });

  const nutzer = await aktuellerNutzer();
  await protokollieren({
    wer: nutzer?.email ?? "Kunde",
    aktion: "Bestellung storniert",
    objekt: `Bestellung ${orderId}`,
    details: `${(summe / 100).toFixed(2)} €`,
  });

  revalidatePath(`/bestellung/${orderId}`);
  revalidatePath("/konto");
  revalidatePath("/admin/bestellungen");

  return { ok: true, hinweis, nachzahlungCent: 0 };
}

/**
 * Geld über Stripe zurückgeben. Gibt false zurück, wenn das nicht klappt –
 * dann muss der Einkauf es von Hand regeln.
 */
async function erstatten_(
  paymentIntentId: string | null,
  betragCent: number,
): Promise<boolean> {
  if (!stripeEingerichtet() || !paymentIntentId || betragCent <= 0) return false;
  try {
    await stripe().refunds.create({
      payment_intent: paymentIntentId,
      amount: betragCent,
    });
    return true;
  } catch (e) {
    console.error("Rückerstattung fehlgeschlagen:", e);
    return false;
  }
}
