/**
 * Archiv: abgeschlossene Bestellungen der letzten Tage.
 * Praktisch, um später nachzuschauen, wer noch nicht bezahlt hat.
 */
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";

export const dynamic = "force-dynamic";

export default async function ArchivSeite() {
  const bestellungen = await prisma.order.findMany({
    where: { abgeschlossen: true },
    include: { items: { include: { product: true } } },
    orderBy: { erstelltAm: "desc" },
    take: 200, // nicht die ganze Historie auf einmal laden
  });

  if (bestellungen.length === 0) {
    return (
      <p className="karte p-6 text-center text-leise">
        Das Archiv ist noch leer.
      </p>
    );
  }

  // Nach Tag gruppieren
  const formatTag = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeZone: config.zeitzone,
  });

  const tage = new Map<string, typeof bestellungen>();
  for (const b of bestellungen) {
    const tag = formatTag.format(b.erstelltAm);
    tage.set(tag, [...(tage.get(tag) ?? []), b]);
  }

  return (
    <div className="space-y-6">
      {[...tage.entries()].map(([tag, liste]) => {
        const summe = liste.reduce((s, b) => s + summeCent(b.items), 0);
        return (
          <section key={tag}>
            <h2 className="mb-2 flex items-baseline justify-between text-sm font-bold uppercase tracking-wide text-leise">
              <span>{tag}</span>
              <span className="ziffern">{euro(summe)}</span>
            </h2>
            <ul className="karte divide-y divide-linie overflow-hidden">
              {liste.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={
                      "h-2.5 w-2.5 shrink-0 rounded-full " +
                      (b.bezahlt ? "bg-moos" : "bg-honig")
                    }
                    title={b.bezahlt ? "bezahlt" : "offen"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {b.name}{" "}
                      <span className="font-normal text-leise">
                        · {b.klasse}
                      </span>
                    </p>
                    <p className="truncate text-sm text-leise">
                      {b.items.map((i) => `${i.menge}× ${i.product.name}`).join(", ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold ziffern">
                    {euro(summeCent(b.items))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
