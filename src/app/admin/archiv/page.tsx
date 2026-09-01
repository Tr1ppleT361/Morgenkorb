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
      <p className="karte p-6 text-center text-slate-500">
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
            <h2 className="mb-2 flex items-baseline justify-between text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>{tag}</span>
              <span className="tabular-nums">{euro(summe)}</span>
            </h2>
            <ul className="karte divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
              {liste.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={
                      "text-lg " + (b.bezahlt ? "text-korb-600" : "text-amber-500")
                    }
                    title={b.bezahlt ? "bezahlt" : "offen"}
                  >
                    {b.bezahlt ? "✓" : "€"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {b.name}{" "}
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        · {b.klasse}
                      </span>
                    </p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {b.items.map((i) => `${i.menge}× ${i.product.name}`).join(", ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
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
