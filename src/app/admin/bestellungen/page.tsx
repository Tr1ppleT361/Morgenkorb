/**
 * Admin: alle Bestellungen des aktuellen Tages mit Kundeninfos,
 * Artikeln, Betrag und Statusverwaltung.
 */
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { STATUS_REIHE, statusText, STATUS_KLASSEN } from "@/lib/status";
import { BestellKarte } from "./BestellKarte";
import { SammelAktionen } from "./SammelAktionen";

export const dynamic = "force-dynamic";

export default async function BestellungenSeite() {
  const bestellungen = await prisma.order.findMany({
    where: { abgeschlossen: false },
    include: {
      items: { include: { product: true } },
      user: { select: { email: true, klasse: true } },
    },
    orderBy: { erstelltAm: "asc" },
  });

  if (bestellungen.length === 0) {
    return (
      <p className="karte p-6 text-center text-leise">
        Noch ist nichts bestellt. Schau heute Abend nochmal rein.
      </p>
    );
  }

  const gesamt = bestellungen.reduce((s, b) => s + summeCent(b.items), 0);
  const offen = bestellungen
    .filter((b) => !b.bezahlt)
    .reduce((s, b) => s + summeCent(b.items), 0);

  return (
    <div className="space-y-4">
      {/* Kopfzahlen */}
      <div className="grid grid-cols-3 gap-2">
        <Zahl titel="Bestellungen" wert={String(bestellungen.length)} />
        <Zahl titel="Gesamt" wert={euro(gesamt)} />
        <Zahl titel="Noch offen" wert={euro(offen)} warnung={offen > 0} />
      </div>

      {/* Status-Verteilung als kleine Leiste */}
      <div className="karte flex flex-wrap gap-2 p-3">
        {STATUS_REIHE.map((s) => {
          const t = statusText(s);
          const anzahl = bestellungen.filter((b) => b.status === s).length;
          return (
            <span
              key={s}
              className={
                "rounded-full px-3 py-1.5 text-xs font-bold " +
                STATUS_KLASSEN[t.farbe] +
                (anzahl === 0 ? " opacity-40" : "")
              }
            >
              {t.titel} · {anzahl}
            </span>
          );
        })}
      </div>

      <SammelAktionen anzahl={bestellungen.length} />

      <div className="space-y-3">
        {bestellungen.map((b) => (
          <BestellKarte
            key={b.id}
            id={b.id}
            name={b.name}
            klasse={b.klasse}
            notiz={b.notiz}
            bezahlt={b.bezahlt}
            status={b.status}
            email={b.user?.email ?? null}
            hatKonto={Boolean(b.userId)}
            erstelltAm={b.erstelltAm.toISOString()}
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

function Zahl({
  titel,
  wert,
  warnung = false,
}: {
  titel: string;
  wert: string;
  warnung?: boolean;
}) {
  return (
    <div className="karte p-3 text-center">
      <p className="etikett">{titel}</p>
      <p
        className={
          "mt-1 font-titel text-lg font-bold ziffern " +
          (warnung ? "text-ziegel" : "")
        }
      >
        {wert}
      </p>
    </div>
  );
}
