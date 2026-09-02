/**
 * Admin-Startseite: die Einkaufsliste.
 *
 * Alle offenen Bestellungen werden pro Produkt zusammengezählt, damit du
 * bei Rewe nur eine Liste abarbeiten musst ("6x Hanuta, 3x Cola 0,5l").
 */
import { prisma } from "@/lib/prisma";
import { euro } from "@/lib/geld";
import { config } from "@/config";
import { Einkaufsliste } from "./Einkaufsliste";
import { TagAbschliessenButton } from "./TagAbschliessenButton";

export const dynamic = "force-dynamic";

export default async function EinkaufslistenSeite() {
  // Alle Positionen aus noch nicht abgeschlossenen Bestellungen
  const positionen = await prisma.orderItem.findMany({
    where: { order: { abgeschlossen: false } },
    include: { product: { include: { category: true } } },
  });

  const bestellungenAnzahl = await prisma.order.count({
    where: { abgeschlossen: false },
  });

  // Pro Produkt zusammenzählen
  const map = new Map<
    number,
    { name: string; kategorie: string; menge: number; summe: number }
  >();

  for (const p of positionen) {
    // Sorten getrennt zählen: "3x Fanta Orange" statt nur "3x Fanta"
    const schluessel = p.variantId ?? p.productId;
    const anzeigeName = p.variantName
      ? `${p.product.name} – ${p.variantName}`
      : p.product.name;
    const vorher = map.get(schluessel);
    const menge = (vorher?.menge ?? 0) + p.menge;
    map.set(schluessel, {
      name: anzeigeName,
      kategorie: p.product.category.name,
      menge,
      summe: (vorher?.summe ?? 0) + p.menge * p.preisBeimKauf,
    });
  }

  // Nach Kategorie gruppieren – so läuft man im Laden nicht dreimal im Kreis
  type Zeile = { id: number; name: string; menge: number; summe: number };
  const nachKategorie = new Map<string, Zeile[]>();

  for (const [id, w] of map) {
    const liste = nachKategorie.get(w.kategorie) ?? [];
    liste.push({ id, name: w.name, menge: w.menge, summe: w.summe });
    nachKategorie.set(w.kategorie, liste);
  }

  const reihenfolge = [
    ...config.kategorienReihenfolge.filter((k) => nachKategorie.has(k)),
    ...[...nachKategorie.keys()]
      .filter((k) => !config.kategorienReihenfolge.includes(k as never))
      .sort((a, b) => a.localeCompare(b, "de")),
  ];

  const gruppen = reihenfolge.map((kategorie) => ({
    kategorie,
    zeilen: nachKategorie
      .get(kategorie)!
      .sort((a, b) => a.name.localeCompare(b.name, "de")),
  }));

  const gesamt = [...map.values()].reduce((s, w) => s + w.summe, 0);
  const artikelAnzahl = [...map.values()].reduce((s, w) => s + w.menge, 0);

  return (
    <div>
      {/* Übersichtskacheln */}
      <div className="grid grid-cols-3 gap-2">
        <Kachel titel="Bestellungen" wert={String(bestellungenAnzahl)} />
        <Kachel titel="Artikel" wert={String(artikelAnzahl)} />
        <Kachel titel="Gesamt" wert={euro(gesamt)} />
      </div>

      {positionen.length === 0 ? (
        <p className="karte mt-4 p-6 text-center text-leise">
          Noch ist nichts bestellt. Schau heute Abend nochmal rein.
        </p>
      ) : (
        <>
          <Einkaufsliste gruppen={gruppen} />
          <div className="mt-6">
            <TagAbschliessenButton anzahl={bestellungenAnzahl} />
          </div>
        </>
      )}
    </div>
  );
}

function Kachel({ titel, wert }: { titel: string; wert: string }) {
  return (
    <div className="karte p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-leise">
        {titel}
      </p>
      <p className="mt-1 text-lg font-bold ziffern">{wert}</p>
    </div>
  );
}
