/**
 * Startseite = Bestellseite.
 *
 * Server Component: läuft auf dem Server, holt Produkte samt Kategorien
 * und Sorten aus der Datenbank und schickt fertiges HTML an den Browser.
 */
import { prisma } from "@/lib/prisma";
import { bestellfenster } from "@/lib/bestellschluss";
import { Bestellseite } from "@/components/Bestellseite";
import { aktuellerNutzer } from "@/lib/auth";
import { stripeEingerichtet } from "@/lib/stripe";

// Die Seite hängt von Uhrzeit und Anmeldung ab -> immer frisch rendern.
export const dynamic = "force-dynamic";

export type Variante = {
  id: number;
  name: string;
  preis: number;
};

export type Produkt = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
  bildUrl: string | null;
  /** Leer, wenn es das Produkt nur in einer Ausführung gibt */
  varianten: Variante[];
};

export type Gruppe = { kategorie: string; produkte: Produkt[] };

export default async function Startseite() {
  const rohe = await prisma.product.findMany({
    where: { aktiv: true, category: { aktiv: true } },
    orderBy: [{ category: { sortierung: "asc" } }, { name: "asc" }],
    include: {
      category: true,
      varianten: {
        where: { aktiv: true },
        orderBy: [{ sortierung: "asc" }, { name: "asc" }],
      },
    },
  });

  // In die Form bringen, die die Oberfläche erwartet
  const produkte: Produkt[] = rohe.map((p) => ({
    id: p.id,
    name: p.name,
    // Bei Sorten gilt der günstigste Preis als "ab"-Preis
    preis: p.varianten.length
      ? Math.min(...p.varianten.map((v) => v.preis))
      : p.preis,
    kategorie: p.category.name,
    bildUrl: p.bildUrl,
    varianten: p.varianten.map((v) => ({
      id: v.id,
      name: v.name,
      preis: v.preis,
    })),
  }));

  // Nach Kategorie gruppieren – die Reihenfolge kommt aus der Datenbank
  const gruppen: Gruppe[] = [];
  for (const p of produkte) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.kategorie === p.kategorie) letzte.produkte.push(p);
    else gruppen.push({ kategorie: p.kategorie, produkte: [p] });
  }

  const fenster = await bestellfenster();
  const nutzer = await aktuellerNutzer();

  return (
    <Bestellseite
      gruppen={gruppen}
      fenster={fenster}
      nutzer={nutzer && { name: nutzer.name, klasse: nutzer.klasse ?? "" }}
      karteMoeglich={stripeEingerichtet()}
    />
  );
}
