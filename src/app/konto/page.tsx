/**
 * Kontoseite: eigene Daten und alle eigenen Bestellungen mit Status.
 * Damit verschwindet eine Bestellung nach dem Absenden nicht mehr.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktuellerNutzer } from "@/lib/auth";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";
import { statusText, STATUS_KLASSEN, statusStufe } from "@/lib/status";
import { STATUS_REIHE } from "@/lib/status";
import { abmelden } from "./actions";
import { ErneutBestellen } from "@/components/ErneutBestellen";
import { ErinnerungSchalter } from "@/components/ErinnerungSchalter";
import { prisma as db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function KontoSeite() {
  const nutzer = await aktuellerNutzer();
  if (!nutzer) redirect("/anmelden?ziel=%2Fkonto");

  const bestellungen = await prisma.order.findMany({
    where: { userId: nutzer.id },
    include: { items: { include: { product: true } } },
    orderBy: { erstelltAm: "desc" },
    take: 50,
  });

  const konto = await db.user.findUnique({
    where: { id: nutzer.id },
    select: { erinnerung: true },
  });

  const gesamt = bestellungen.reduce((s, b) => s + summeCent(b.items), 0);
  const offen = bestellungen
    .filter((b) => !b.bezahlt)
    .reduce((s, b) => s + summeCent(b.items), 0);

  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: config.zeitzone,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      {/* Kopf */}
      <div className="karte flex items-center gap-4 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-honigHell font-titel text-2xl font-bold text-ziegel">
          {nutzer.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-titel text-xl font-bold">
            {nutzer.name}
          </h1>
          <p className="truncate text-sm text-leise">
            {nutzer.email}
            {nutzer.klasse && ` · ${nutzer.klasse}`}
          </p>
        </div>
        <form action={abmelden}>
          <button type="submit" className="btn-zweit !px-3 text-sm">
            Abmelden
          </button>
        </form>
      </div>

      {nutzer.rolle === "ADMIN" && (
        <Link href="/admin" className="btn-primaer mt-3 w-full">
          Zur Verwaltung
        </Link>
      )}

      {/* Erinnerung */}
      <div className="mt-3">
        <ErinnerungSchalter an={konto?.erinnerung ?? false} />
      </div>

      {/* Zahlen */}
      {bestellungen.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Zahl titel="Bestellungen" wert={String(bestellungen.length)} />
          <Zahl titel="Zusammen" wert={euro(gesamt)} />
          <Zahl titel="Noch offen" wert={euro(offen)} warnung={offen > 0} />
        </div>
      )}

      {/* Bestellungen */}
      <h2 className="mb-2 mt-7 font-titel text-lg font-bold">
        Deine Bestellungen
      </h2>

      {bestellungen.length === 0 ? (
        <div className="karte p-6 text-center">
          <p className="text-leise">Du hast noch nichts bestellt.</p>
          <Link href="/" className="btn-primaer mt-4">
            Jetzt stöbern
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {bestellungen.map((b) => {
            const t = statusText(b.status);
            const stufe = statusStufe(b.status);
            const summe = summeCent(b.items);

            return (
              <li key={b.id} className="karte overflow-hidden">
                <Link href={`/bestellung/${b.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={
                          "inline-block rounded-full px-2.5 py-1 text-xs font-bold " +
                          STATUS_KLASSEN[t.farbe]
                        }
                      >
                        {t.titel}
                      </span>
                      <p className="mt-1.5 text-sm text-leise ziffern">
                        {datum.format(b.erstelltAm)} Uhr
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-titel text-lg font-bold ziffern">
                        {euro(summe)}
                      </p>
                      <p
                        className={
                          "text-xs font-semibold " +
                          (b.bezahlt ? "text-moos" : "text-ziegel")
                        }
                      >
                        {b.bezahlt ? "bezahlt" : "noch offen"}
                      </p>
                    </div>
                  </div>

                  {/* Kleiner Fortschrittsbalken */}
                  {b.status !== "STORNIERT" && (
                    <div className="mt-3 flex gap-1">
                      {STATUS_REIHE.map((_, i) => (
                        <span
                          key={i}
                          className={
                            "h-1.5 flex-1 rounded-full " +
                            (i <= stufe ? "bg-moos" : "bg-linie")
                          }
                        />
                      ))}
                    </div>
                  )}

                  <p className="mt-2.5 truncate text-sm text-leise">
                    {b.items
                      .map(
                        (i) =>
                          `${i.menge}× ${i.product.name}${i.variantName ? ` (${i.variantName})` : ""}`,
                      )
                      .join(", ")}
                  </p>
                </Link>

                <div className="border-t border-linie px-4 py-2.5">
                  <ErneutBestellen
                    klein
                    artikel={b.items.map((i) => ({
                      productId: i.productId,
                      variantId: i.variantId,
                      menge: i.menge,
                    }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
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
