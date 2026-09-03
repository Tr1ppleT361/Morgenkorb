/**
 * Stripe – die Kartenzahlung.
 *
 * Wichtig zur Sicherheit:
 *  - Der geheime Schlüssel (STRIPE_SECRET_KEY) wird NUR hier auf dem Server
 *    benutzt. Er darf niemals in den Browser gelangen.
 *  - Ob eine Bestellung bezahlt ist, entscheidet ausschließlich der Webhook
 *    von Stripe. Die Rückkehr-Seite im Browser ist kein Beweis – die kann
 *    jeder aufrufen.
 *
 * Nötige Umgebungsvariablen:
 *   STRIPE_SECRET_KEY      sk_live_… oder sk_test_…
 *   STRIPE_WEBHOOK_SECRET  whsec_… (aus den Webhook-Einstellungen)
 */
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeEingerichtet(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function webhookEingerichtet(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

/** Der Stripe-Client. Wird erst beim ersten Gebrauch angelegt. */
export function stripe(): Stripe {
  const schluessel = process.env.STRIPE_SECRET_KEY;
  if (!schluessel) {
    throw new Error(
      "STRIPE_SECRET_KEY fehlt. Kartenzahlung ist nicht eingerichtet.",
    );
  }
  if (!client) client = new Stripe(schluessel);
  return client;
}

/**
 * Die eigene Adresse der Website – für die Rücksprung-Links nach der
 * Zahlung. Auf Vercel steht sie in VERCEL_URL, sonst in BASE_URL.
 */
export function basisAdresse(): string {
  const eigene = process.env.BASE_URL?.trim();
  if (eigene) return eigene.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
