/**
 * Webhook von Stripe.
 *
 * Stripe ruft diese Adresse auf, wenn sich bei einer Zahlung etwas tut.
 * NUR hier wird eine Bestellung als bezahlt markiert – die Erfolgsseite im
 * Browser ist kein Beweis, die kann jeder aufrufen.
 *
 * Sicherheit: Jede Anfrage ist von Stripe signiert. Wir prüfen die Signatur
 * mit STRIPE_WEBHOOK_SECRET. Ohne gültige Signatur passiert nichts.
 *
 * Einrichten: Im Stripe-Dashboard unter Developers -> Webhooks eine
 * Adresse anlegen: https://deine-domain/api/stripe/webhook
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEingerichtet } from "@/lib/stripe";

// Diese Route muss auf dem Server laufen und darf nicht zwischengespeichert
// werden – sonst käme die Signaturprüfung durcheinander.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(anfrage: Request) {
  if (!stripeEingerichtet() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { fehler: "Stripe ist nicht eingerichtet." },
      { status: 503 },
    );
  }

  // WICHTIG: den unveränderten Text lesen. Würde man hier .json() nehmen,
  // stimmte die Signatur nicht mehr.
  const roh = await anfrage.text();
  const signatur = anfrage.headers.get("stripe-signature");

  if (!signatur) {
    return NextResponse.json({ fehler: "Signatur fehlt." }, { status: 400 });
  }

  let ereignis: Stripe.Event;
  try {
    ereignis = await stripe().webhooks.constructEventAsync(
      roh,
      signatur,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.error("Webhook-Signatur ungültig:", e);
    return NextResponse.json({ fehler: "Signatur ungültig." }, { status: 400 });
  }

  try {
    switch (ereignis.type) {
      // Zahlung erfolgreich abgeschlossen
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const sitzung = ereignis.data.object;
        // Nur wirklich bezahlte Sitzungen zählen
        if (sitzung.payment_status !== "paid") break;
        await alsBezahltMarkieren(sitzung);
        break;
      }

      // Zahlung fehlgeschlagen oder Sitzung verfallen
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const sitzung = ereignis.data.object;
        const orderId = bestellId(sitzung);
        if (orderId) {
          await prisma.order.updateMany({
            // Eine schon bezahlte Bestellung nie zurücksetzen
            where: { id: orderId, zahlstatus: { not: "BEZAHLT" } },
            data: { zahlstatus: "FEHLGESCHLAGEN" },
          });
        }
        break;
      }

      // Geld zurückerstattet
      case "charge.refunded": {
        const abbuchung = ereignis.data.object;
        const zahlungId =
          typeof abbuchung.payment_intent === "string"
            ? abbuchung.payment_intent
            : abbuchung.payment_intent?.id;
        if (zahlungId) {
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: zahlungId },
            data: { zahlstatus: "ERSTATTET", bezahlt: false },
          });
        }
        break;
      }

      default:
        // Andere Ereignisse interessieren uns nicht
        break;
    }
  } catch (e) {
    console.error("Webhook-Verarbeitung fehlgeschlagen:", e);
    // 500 sorgt dafür, dass Stripe es später erneut versucht
    return NextResponse.json({ fehler: "Fehler." }, { status: 500 });
  }

  return NextResponse.json({ empfangen: true });
}

/** Die Bestell-ID aus der Sitzung holen. */
function bestellId(sitzung: Stripe.Checkout.Session): string | null {
  return sitzung.metadata?.orderId ?? sitzung.client_reference_id ?? null;
}

/**
 * Bestellung als bezahlt eintragen.
 *
 * `updateMany` mit der Bedingung "noch nicht bezahlt" sorgt dafür, dass ein
 * doppelt zugestellter Webhook nichts doppelt verbucht.
 */
async function alsBezahltMarkieren(sitzung: Stripe.Checkout.Session) {
  const orderId = bestellId(sitzung);
  if (!orderId) {
    console.warn("Webhook ohne orderId:", sitzung.id);
    return;
  }

  const zahlungId =
    typeof sitzung.payment_intent === "string"
      ? sitzung.payment_intent
      : (sitzung.payment_intent?.id ?? null);

  const ergebnis = await prisma.order.updateMany({
    where: { id: orderId, zahlstatus: { not: "BEZAHLT" } },
    data: {
      zahlstatus: "BEZAHLT",
      zahlart: "KARTE",
      bezahlt: true, // damit die Kasse im Admin stimmt
      bezahltAm: new Date(),
      stripeSessionId: sitzung.id,
      stripePaymentIntentId: zahlungId,
    },
  });

  if (ergebnis.count > 0) {
    console.log(`Bestellung ${orderId} als bezahlt eingetragen.`);
  }
}
