/** Admin: Änderungsprotokoll – wer hat wann was geändert. */
import { prisma } from "@/lib/prisma";
import { config } from "@/config";

export const dynamic = "force-dynamic";

export default async function ProtokollSeite({
  searchParams,
}: {
  searchParams: Promise<{ seite?: string }>;
}) {
  const { seite } = await searchParams;
  const proSeite = 50;
  const nummer = Math.max(1, Number(seite ?? "1") || 1);

  const [eintraege, gesamt] = await Promise.all([
    prisma.protokoll.findMany({
      orderBy: { am: "desc" },
      skip: (nummer - 1) * proSeite,
      take: proSeite,
    }),
    prisma.protokoll.count(),
  ]);

  const zeit = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: config.zeitzone,
  });

  const seiten = Math.max(1, Math.ceil(gesamt / proSeite));

  return (
    <div>
      <p className="mb-3 text-sm text-leise">
        Jede Änderung an Preisen, Beständen, Bestellungen und Einstellungen
        wird hier festgehalten. {gesamt} Einträge.
      </p>

      {eintraege.length === 0 ? (
        <p className="karte p-6 text-center text-sm text-leise">
          Noch nichts passiert.
        </p>
      ) : (
        <ul className="karte divide-y divide-linie overflow-hidden">
          {eintraege.map((e) => (
            <li key={e.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{e.aktion}</span>
                <span className="text-sm text-leise">{e.objekt}</span>
                <span className="ml-auto shrink-0 text-xs text-leise ziffern">
                  {zeit.format(e.am)}
                </span>
              </div>
              {e.details && (
                <p className="mt-0.5 text-sm text-leise">{e.details}</p>
              )}
              <p className="mt-0.5 text-xs text-leise">von {e.wer}</p>
            </li>
          ))}
        </ul>
      )}

      {seiten > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {nummer > 1 ? (
            <a href={`/admin/protokoll?seite=${nummer - 1}`} className="btn-zweit !min-h-[2.5rem] !px-3">
              Neuer
            </a>
          ) : (
            <span />
          )}
          <span className="text-leise ziffern">
            Seite {nummer} von {seiten}
          </span>
          {nummer < seiten ? (
            <a href={`/admin/protokoll?seite=${nummer + 1}`} className="btn-zweit !min-h-[2.5rem] !px-3">
              Älter
            </a>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
