/**
 * Admin: Kasse.
 * Was habe ich ausgelegt, was ist schon eingesammelt, was fehlt noch?
 */
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";
import { BezahltSchalter } from "./BezahltSchalter";

export const dynamic = "force-dynamic";

export default async function KassenSeite() {
  // Offene Bestellungen (heutiger Tag)
  const heute = await prisma.order.findMany({
    where: { abgeschlossen: false },
    include: { items: true },
    orderBy: { name: "asc" },
  });

  // Alte Bestellungen, bei denen noch Geld fehlt
  const altschulden = await prisma.order.findMany({
    where: { abgeschlossen: true, bezahlt: false },
    include: { items: true },
    orderBy: { erstelltAm: "desc" },
    take: 100,
  });

  const summeHeute = heute.reduce((s, b) => s + summeCent(b.items), 0);
  const bezahltHeute = heute
    .filter((b) => b.bezahlt)
    .reduce((s, b) => s + summeCent(b.items), 0);
  const summeAlt = altschulden.reduce((s, b) => s + summeCent(b.items), 0);

  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeZone: config.zeitzone,
  });

  return (
    <div className="space-y-6">
      {/* Große Zahlen */}
      <div className="grid gap-3 sm:grid-cols-3">
        <GrosseZahl
          titel="Einkauf heute"
          wert={euro(summeHeute)}
          hinweis="So viel legst du bei Rewe aus"
        />
        <GrosseZahl
          titel="Schon kassiert"
          wert={euro(bezahltHeute)}
          farbe="text-moos"
        />
        <GrosseZahl
          titel="Fehlt noch"
          wert={euro(summeHeute - bezahltHeute + summeAlt)}
          farbe="text-ziegel"
          hinweis={summeAlt > 0 ? `davon ${euro(summeAlt)} aus alten Tagen` : undefined}
        />
      </div>

      {/* Heute abkassieren */}
      <section>
        <h2 className="mb-2 font-titel text-lg font-bold">Heute abkassieren</h2>
        {heute.length === 0 ? (
          <p className="karte p-6 text-center text-sm text-leise">
            Heute gibt es nichts einzusammeln.
          </p>
        ) : (
          <ul className="karte divide-y divide-linie overflow-hidden">
            {heute.map((b) => (
              <li key={b.id}>
                <BezahltSchalter
                  id={b.id}
                  name={b.name}
                  klasse={b.klasse}
                  bezahlt={b.bezahlt}
                  betrag={summeCent(b.items)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Altschulden */}
      {altschulden.length > 0 && (
        <section>
          <h2 className="mb-2 font-titel text-lg font-bold">
            Noch offen aus früheren Tagen
          </h2>
          <ul className="karte divide-y divide-linie overflow-hidden">
            {altschulden.map((b) => (
              <li key={b.id}>
                <BezahltSchalter
                  id={b.id}
                  name={b.name}
                  klasse={b.klasse}
                  bezahlt={b.bezahlt}
                  betrag={summeCent(b.items)}
                  zusatz={datum.format(b.erstelltAm)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function GrosseZahl({
  titel,
  wert,
  hinweis,
  farbe = "",
}: {
  titel: string;
  wert: string;
  hinweis?: string;
  farbe?: string;
}) {
  return (
    <div className="karte p-4">
      <p className="etikett">{titel}</p>
      <p className={"mt-1 font-titel text-2xl font-bold ziffern " + farbe}>
        {wert}
      </p>
      {hinweis && <p className="mt-1 text-xs text-leise">{hinweis}</p>}
    </div>
  );
}
