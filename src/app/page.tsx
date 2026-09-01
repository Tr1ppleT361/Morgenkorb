/**
 * Startseite = Bestellseite.
 *
 * Das ist eine "Server Component": sie läuft auf dem Server, holt die
 * Produkte aus der Datenbank und schickt fertiges HTML an den Browser.
 * Das Klick-Verhalten (Warenkorb) steckt in <Bestellseite />, einer
 * Client Component.
 */
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import {
  bestellschlussText,
  bestellungenOffen,
  minutenBisSchluss,
} from "@/lib/bestellschluss";
import { Bestellseite } from "@/components/Bestellseite";
import { aktuellerNutzer } from "@/lib/auth";

// Die Seite hängt von der Uhrzeit ab -> nicht statisch vorbauen,
// sondern bei jedem Aufruf neu rendern.
export const dynamic = "force-dynamic";

export default async function Startseite() {
  const produkte = await prisma.product.findMany({
    where: { aktiv: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, preis: true, kategorie: true, bildUrl: true },
  });

  // Nach Kategorie gruppieren, in der Reihenfolge aus config.ts
  const gruppen = gruppiereNachKategorie(produkte);

  const offen = bestellungenOffen();
  // Angemeldet? Dann können wir Name und Klasse schon ausfüllen.
  const nutzer = await aktuellerNutzer();

  return (
    <Bestellseite
      gruppen={gruppen}
      offen={offen}
      schlussText={bestellschlussText()}
      minutenRest={minutenBisSchluss()}
      nutzer={
        nutzer && { name: nutzer.name, klasse: nutzer.klasse ?? "" }
      }
    />
  );
}

export type Produkt = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
  bildUrl: string | null;
};

export type Gruppe = { kategorie: string; produkte: Produkt[] };

function gruppiereNachKategorie(produkte: Produkt[]): Gruppe[] {
  const map = new Map<string, Produkt[]>();
  for (const p of produkte) {
    const liste = map.get(p.kategorie) ?? [];
    liste.push(p);
    map.set(p.kategorie, liste);
  }

  // Bekannte Kategorien zuerst (Reihenfolge aus config.ts), Rest alphabetisch
  const bekannte = config.kategorienReihenfolge.filter((k) => map.has(k));
  const uebrige = [...map.keys()]
    .filter((k) => !config.kategorienReihenfolge.includes(k as never))
    .sort((a, b) => a.localeCompare(b, "de"));

  return [...bekannte, ...uebrige].map((kategorie) => ({
    kategorie,
    produkte: map.get(kategorie)!,
  }));
}
