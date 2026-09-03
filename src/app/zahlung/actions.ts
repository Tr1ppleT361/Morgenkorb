"use server";

/**
 * Startet eine Kartenzahlung über Stripe.
 *
 * Ablauf:
 *  1. Wir holen die Bestellung frisch aus der Datenbank und rechnen den
 *     Betrag dort aus – niemals aus dem Browser übernehmen.
 *  2. Stripe legt eine "Checkout Session" an und gibt uns eine Adresse.
 *  3. Der Browser wird dorthin geschickt und bezahlt bei Stripe.
 *  4. Ob es geklappt hat, erfahren wir über den Webhook, nicht vom Browser.
 */
import { prisma } from "@/lib/prisma";
import { summeCent } from "@/lib/geld";
import { basisAdresse, stripe, stripeEingerichtet } from "@/lib/stripe";

export type ZahlungErgebnis =
  | { ok: true; url: string }
  | { ok: false; fehler: string };

export async function zahlungStarten(
  orderId: string,
): Promise<ZahlungErgebnis> {
  if (!stripeEingerichtet()) {
    return {
      ok: false,
      fehler: "Kartenzahlung ist noch nicht eingerichtet. Bitte bar bezahlen.",
    };
  }

  const bestellung = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!bestellung) return { ok: false, fehler: "Bestellung nicht gefunden." };
  if (bestellung.zahlstatus === "BEZAHLT")
    return { ok: false, fehler: "Diese Bestellung ist schon bezahlt." };

  const summe = summeCent(bestellung.items);
  if (summe <= 0) return { ok: false, fehler: "Der Betrag ist leer." };

  // Stripe verlangt mindestens 50 Cent
  if (summe < 50)
    return {
      ok: false,
      fehler: "Für Kartenzahlung muss der Betrag mindestens 0,50 € sein.",
    };

  const basis = basisAdresse();

  try {
    const sitzung = await stripe().checkout.sessions.create({
      mode: "payment",
      // Jede Position einzeln – so sieht der Kunde, wofür er zahlt
      line_items: bestellung.items.map((i) => ({
        quantity: i.menge,
        price_data: {
          currency: "eur",
          unit_amount: i.preisBeimKauf,
          product_data: {
            name: i.variantName
              ? `${i.product.name} – ${i.variantName}`
              : i.product.name,
          },
        },
      })),
      // Damit der Webhook weiß, welche Bestellung gemeint ist
      metadata: { orderId: bestellung.id },
      client_reference_id: bestellung.id,
      success_url: `${basis}/bestellung/${bestellung.id}?bezahlt=1`,
      cancel_url: `${basis}/bestellung/${bestellung.id}?abgebrochen=1`,
      // Nach 30 Minuten verfällt die Sitzung wieder
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!sitzung.url)
      return { ok: false, fehler: "Stripe hat keine Zahlungsseite geliefert." };

    await prisma.order.update({
      where: { id: bestellung.id },
      data: { stripeSessionId: sitzung.id, zahlart: "KARTE" },
    });

    return { ok: true, url: sitzung.url };
  } catch (e) {
    console.error("Stripe-Sitzung fehlgeschlagen:", e);
    return {
      ok: false,
      fehler: "Die Zahlung konnte nicht gestartet werden. Versuch es nochmal.",
    };
  }
}
