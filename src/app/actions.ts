"use server";

/**
 * Server Actions für die Bestellseite.
 * "use server" heißt: dieser Code läuft NUR auf dem Server, nie im Browser.
 * Deshalb dürfen wir hier auf die Datenbank zugreifen.
 */
import { prisma } from "@/lib/prisma";
import { bestellungenOffen, bestellschlussText } from "@/lib/bestellschluss";
import { config } from "@/config";
import { aktuellerNutzer } from "@/lib/auth";

export type Bestellposition = { productId: number; menge: number };

export type BestellErgebnis =
  | { ok: true; orderId: string }
  | { ok: false; fehler: string };

export async function bestellungAufgeben(daten: {
  name: string;
  klasse: string;
  notiz?: string;
  positionen: Bestellposition[];
}): Promise<BestellErgebnis> {
  // 1) Bestellschluss prüfen – NICHT nur im Browser, sonst könnte man ihn umgehen.
  if (!bestellungenOffen()) {
    return {
      ok: false,
      fehler: `Bestellungen für morgen sind geschlossen (Bestellschluss ${bestellschlussText()} Uhr).`,
    };
  }

  // 2) Eingaben säubern und prüfen
  const name = daten.name.trim();
  const klasse = daten.klasse.trim();
  const notiz = daten.notiz?.trim() || null;

  if (name.length < 2) return { ok: false, fehler: "Bitte gib deinen Namen an." };
  if (name.length > 60) return { ok: false, fehler: "Der Name ist zu lang." };
  if (klasse.length < 1) return { ok: false, fehler: "Bitte gib deine Klasse an." };
  if (klasse.length > 20) return { ok: false, fehler: "Die Klasse ist zu lang." };
  if (notiz && notiz.length > 300)
    return { ok: false, fehler: "Die Notiz ist zu lang (max. 300 Zeichen)." };

  const positionen = daten.positionen.filter((p) => p.menge > 0);
  if (positionen.length === 0)
    return { ok: false, fehler: "Dein Warenkorb ist leer." };

  for (const p of positionen) {
    if (!Number.isInteger(p.menge) || p.menge > config.maxMengeProProdukt) {
      return {
        ok: false,
        fehler: `Maximal ${config.maxMengeProProdukt} Stück pro Produkt.`,
      };
    }
  }

  // 3) Preise IMMER frisch aus der Datenbank holen.
  //    Was der Browser schickt, könnte manipuliert sein.
  const produkte = await prisma.product.findMany({
    where: { id: { in: positionen.map((p) => p.productId) }, aktiv: true },
  });

  const preisMap = new Map(produkte.map((p) => [p.id, p.preis]));
  const items = positionen
    .filter((p) => preisMap.has(p.productId))
    .map((p) => ({
      productId: p.productId,
      menge: p.menge,
      preisBeimKauf: preisMap.get(p.productId)!,
    }));

  if (items.length === 0)
    return { ok: false, fehler: "Die gewählten Produkte gibt es nicht mehr." };

  // 4) Wer bestellt? Wenn angemeldet, hängen wir die Bestellung ans Konto –
  //    dann taucht sie später unter "Deine Bestellungen" auf.
  const nutzer = await aktuellerNutzer();

  // 5) Bestellung, Positionen und den ersten Statuseintrag speichern
  const bestellung = await prisma.order.create({
    data: {
      name,
      klasse,
      notiz,
      userId: nutzer?.id ?? null,
      status: "EINGEGANGEN",
      items: { create: items },
      verlauf: { create: { status: "EINGEGANGEN" } },
    },
  });

  return { ok: true, orderId: bestellung.id };
}
