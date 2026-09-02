"use server";

/**
 * Server Actions für die Bestellseite.
 * "use server" heißt: dieser Code läuft NUR auf dem Server, nie im Browser.
 */
import { prisma } from "@/lib/prisma";
import { bestellfenster } from "@/lib/bestellschluss";
import { config } from "@/config";
import { aktuellerNutzer } from "@/lib/auth";

export type Bestellposition = {
  productId: number;
  variantId?: number | null;
  menge: number;
};

export type BestellErgebnis =
  | { ok: true; orderId: string }
  | { ok: false; fehler: string };

export async function bestellungAufgeben(daten: {
  name: string;
  klasse: string;
  notiz?: string;
  positionen: Bestellposition[];
  /** "BAR" oder "KARTE" – bei Karte geht es danach zu Stripe weiter */
  zahlart?: string;
}): Promise<BestellErgebnis> {
  // 1) Bestellfenster prüfen – NICHT nur im Browser, sonst wäre es umgehbar.
  const fenster = await bestellfenster();
  if (!fenster.offen) {
    const grund =
      fenster.grund === "pausiert"
        ? "Bestellungen sind gerade pausiert."
        : fenster.grund === "zu_frueh"
          ? `Bestellungen sind erst ab ${fenster.start} Uhr möglich.`
          : `Bestellungen für morgen sind geschlossen (Bestellschluss ${fenster.ende} Uhr).`;
    return { ok: false, fehler: grund };
  }

  // 2) Eingaben säubern und prüfen
  const name = daten.name.trim();
  const klasse = daten.klasse.trim();
  const notiz = daten.notiz?.trim() || null;
  const zahlart = daten.zahlart === "KARTE" ? "KARTE" : "BAR";

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
    where: {
      id: { in: positionen.map((p) => p.productId) },
      aktiv: true,
      category: { aktiv: true },
    },
    include: { varianten: { where: { aktiv: true } } },
  });
  const produktMap = new Map(produkte.map((p) => [p.id, p]));

  const items: {
    productId: number;
    variantId: number | null;
    variantName: string | null;
    menge: number;
    preisBeimKauf: number;
  }[] = [];

  for (const p of positionen) {
    const produkt = produktMap.get(p.productId);
    if (!produkt) continue; // Produkt gibt es nicht mehr

    if (produkt.varianten.length > 0) {
      // Produkt hat Sorten -> es MUSS eine gewählt sein
      const variante = produkt.varianten.find((v) => v.id === p.variantId);
      if (!variante) {
        return {
          ok: false,
          fehler: `Bitte wähle bei „${produkt.name}" eine Sorte aus.`,
        };
      }
      items.push({
        productId: produkt.id,
        variantId: variante.id,
        variantName: variante.name,
        menge: p.menge,
        preisBeimKauf: variante.preis,
      });
    } else {
      items.push({
        productId: produkt.id,
        variantId: null,
        variantName: null,
        menge: p.menge,
        preisBeimKauf: produkt.preis,
      });
    }
  }

  if (items.length === 0)
    return { ok: false, fehler: "Die gewählten Produkte gibt es nicht mehr." };

  // 4) Wer bestellt? Wenn angemeldet, hängen wir die Bestellung ans Konto.
  const nutzer = await aktuellerNutzer();

  // 5) Bestellung, Positionen und ersten Statuseintrag speichern
  const bestellung = await prisma.order.create({
    data: {
      name,
      klasse,
      notiz,
      userId: nutzer?.id ?? null,
      status: "EINGEGANGEN",
      zahlart,
      zahlstatus: "OFFEN",
      items: { create: items },
      verlauf: { create: { status: "EINGEGANGEN" } },
    },
  });

  return { ok: true, orderId: bestellung.id };
}
