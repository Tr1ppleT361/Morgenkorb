/**
 * Startseite = Bestellseite.
 *
 * Holt Produkte samt Kategorien, Sorten, Beständen und Bestellzahlen
 * (für die Sortierung "meistbestellt") aus der Datenbank.
 */
import { prisma } from "@/lib/prisma";
import { bestellfenster } from "@/lib/bestellschluss";
import { shopEinstellungen } from "@/lib/einstellungen";
import { Bestellseite } from "@/components/Bestellseite";
import { aktuellerNutzer } from "@/lib/auth";
import { stripeEingerichtet } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export type Variante = {
  id: number;
  name: string;
  preis: number;
  /** null = unbegrenzt, 0 = ausverkauft */
  bestand: number | null;
  merkmale: string[];
};

export type Produkt = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
  bildUrl: string | null;
  bestand: number | null;
  merkmale: string[];
  zutaten: string | null;
  allergene: string | null;
  /** Wie oft schon bestellt? Für die Sortierung. */
  bestellt: number;
  varianten: Variante[];
};

export type Gruppe = { kategorie: string; produkte: Produkt[] };

/** "zuckerfrei, vegan" -> ["zuckerfrei","vegan"] */
function alsListe(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export default async function Startseite() {
  const [rohe, bestellzahlen] = await Promise.all([
    prisma.product.findMany({
      where: { aktiv: true, category: { aktiv: true } },
      orderBy: [{ category: { sortierung: "asc" } }, { name: "asc" }],
      include: {
        category: true,
        varianten: {
          where: { aktiv: true },
          orderBy: [{ sortierung: "asc" }, { name: "asc" }],
        },
      },
    }),
    // Wie oft wurde jedes Produkt insgesamt bestellt?
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { menge: true },
    }),
  ]);

  const zaehler = new Map(
    bestellzahlen.map((z) => [z.productId, z._sum.menge ?? 0]),
  );

  const produkte: Produkt[] = rohe.map((p) => ({
    id: p.id,
    name: p.name,
    // Bei Sorten gilt der günstigste noch verfügbare Preis als "ab"-Preis
    preis: p.varianten.length
      ? Math.min(...p.varianten.map((v) => v.preis))
      : p.preis,
    kategorie: p.category.name,
    bildUrl: p.bildUrl,
    bestand: p.bestand,
    merkmale: alsListe(p.merkmale),
    zutaten: p.zutaten,
    allergene: p.allergene,
    bestellt: zaehler.get(p.id) ?? 0,
    varianten: p.varianten.map((v) => ({
      id: v.id,
      name: v.name,
      preis: v.preis,
      bestand: v.bestand,
      merkmale: alsListe(v.merkmale),
    })),
  }));

  // Nach Kategorie gruppieren – Reihenfolge kommt aus der Datenbank
  const gruppen: Gruppe[] = [];
  for (const p of produkte) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.kategorie === p.kategorie) letzte.produkte.push(p);
    else gruppen.push({ kategorie: p.kategorie, produkte: [p] });
  }

  const [fenster, einstellungen, nutzer] = await Promise.all([
    bestellfenster(),
    shopEinstellungen(),
    aktuellerNutzer(),
  ]);

  return (
    <Bestellseite
      gruppen={gruppen}
      fenster={fenster}
      nutzer={nutzer && { name: nutzer.name, klasse: nutzer.klasse ?? "" }}
      karteMoeglich={stripeEingerichtet()}
      limitCent={einstellungen.limitCent}
      abholOrt={einstellungen.abholOrt}
      abholZeit={einstellungen.abholZeit}
    />
  );
}
