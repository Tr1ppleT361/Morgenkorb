/**
 * Admin: alle Konten mit ihren Bestellungen.
 * Zeigt auch, wer noch Geld schuldet.
 */
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";

export const dynamic = "force-dynamic";

export default async function KundenSeite() {
  const kunden = await prisma.user.findMany({
    include: {
      orders: { include: { items: true } },
    },
    orderBy: { erstelltAm: "desc" },
  });

  // Auch Leute, die ohne Konto bestellt haben, sollen auftauchen
  const gastBestellungen = await prisma.order.findMany({
    where: { userId: null },
    include: { items: true },
  });

  const gaeste = new Map<string, { anzahl: number; summe: number; offen: number }>();
  for (const b of gastBestellungen) {
    const schluessel = `${b.name} · ${b.klasse}`;
    const bisher = gaeste.get(schluessel) ?? { anzahl: 0, summe: 0, offen: 0 };
    const wert = summeCent(b.items);
    gaeste.set(schluessel, {
      anzahl: bisher.anzahl + 1,
      summe: bisher.summe + wert,
      offen: bisher.offen + (b.bezahlt ? 0 : wert),
    });
  }

  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: config.zeitzone,
  });

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-titel text-lg font-bold">Konten</h2>
          <span className="etikett">{kunden.length}</span>
        </div>

        {kunden.length === 0 ? (
          <p className="karte p-6 text-center text-sm text-leise">
            Noch hat niemand ein Konto angelegt. Bestellen geht auch ohne –
            solche Bestellungen stehen unten unter „Ohne Konto“.
          </p>
        ) : (
          <ul className="karte divide-y divide-linie overflow-hidden">
            {kunden.map((k) => {
              const gesamt = k.orders.reduce(
                (s, b) => s + summeCent(b.items),
                0,
              );
              const offen = k.orders
                .filter((b) => !b.bezahlt)
                .reduce((s, b) => s + summeCent(b.items), 0);

              return (
                <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Anfangsbuchstabe als kleines Zeichen */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-honigHell font-titel text-lg font-bold text-ziegel">
                    {k.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {k.name}
                      {k.klasse && (
                        <span className="font-normal text-leise"> · {k.klasse}</span>
                      )}
                      {k.rolle === "ADMIN" && (
                        <span className="ml-2 rounded-full bg-ziegel/12 px-2 py-0.5 text-[0.65rem] font-bold text-ziegel">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-leise">
                      {k.email} · seit {datum.format(k.erstelltAm)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold ziffern">{euro(gesamt)}</p>
                    <p className="text-xs text-leise ziffern">
                      {k.orders.length}{" "}
                      {k.orders.length === 1 ? "Bestellung" : "Bestellungen"}
                      {offen > 0 && (
                        <span className="ml-1 font-semibold text-ziegel">
                          · {euro(offen)} offen
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {gaeste.size > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-titel text-lg font-bold">Ohne Konto bestellt</h2>
            <span className="etikett">{gaeste.size}</span>
          </div>
          <ul className="karte divide-y divide-linie overflow-hidden">
            {[...gaeste.entries()]
              .sort((a, b) => a[0].localeCompare(b[0], "de"))
              .map(([wer, w]) => (
                <li key={wer} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-linie font-titel text-lg font-bold text-leise">
                    {wer.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{wer}</p>
                    <p className="text-sm text-leise">
                      {w.anzahl} {w.anzahl === 1 ? "Bestellung" : "Bestellungen"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold ziffern">{euro(w.summe)}</p>
                    {w.offen > 0 && (
                      <p className="text-xs font-semibold text-ziegel ziffern">
                        {euro(w.offen)} offen
                      </p>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
