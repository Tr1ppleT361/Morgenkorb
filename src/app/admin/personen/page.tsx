/**
 * Admin-Ansicht "Pro Person": jede Bestellung einzeln mit Betrag
 * und Häkchen "bezahlt".
 */
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { BestellKarte } from "./BestellKarte";

export const dynamic = "force-dynamic";

export default async function ProPersonSeite() {
  const bestellungen = await prisma.order.findMany({
    where: { abgeschlossen: false },
    include: { items: { include: { product: true } } },
    orderBy: { erstelltAm: "asc" },
  });

  const gesamt = bestellungen.reduce((s, b) => s + summeCent(b.items), 0);
  const offenerBetrag = bestellungen
    .filter((b) => !b.bezahlt)
    .reduce((s, b) => s + summeCent(b.items), 0);

  if (bestellungen.length === 0) {
    return (
      <p className="karte p-6 text-center text-leise">
        Noch ist nichts bestellt. Schau heute Abend nochmal rein.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div className="karte p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-leise">
            Gesamt
          </p>
          <p className="mt-1 text-lg font-bold ziffern">{euro(gesamt)}</p>
        </div>
        <div className="karte p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-leise">
            Noch offen
          </p>
          <p className="mt-1 text-lg font-bold ziffern text-ziegel">
            {euro(offenerBetrag)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {bestellungen.map((b) => (
          <BestellKarte
            key={b.id}
            id={b.id}
            name={b.name}
            klasse={b.klasse}
            notiz={b.notiz}
            bezahlt={b.bezahlt}
            summe={summeCent(b.items)}
            artikel={b.items.map((i) => ({
              id: i.id,
              name: i.product.name,
              menge: i.menge,
              preis: i.preisBeimKauf,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
