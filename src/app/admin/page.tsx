/**
 * Admin-Übersicht: alles Wichtige auf einen Blick.
 * Von hier springt man in die einzelnen Bereiche.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { bestellfenster } from "@/lib/bestellschluss";
import { STATUS_REIHE, statusText, STATUS_KLASSEN } from "@/lib/status";
import { adminIstEingerichtet } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUebersicht() {
  // Alles, was noch nicht im Archiv liegt = "der aktuelle Tag"
  const offene = await prisma.order.findMany({
    where: { abgeschlossen: false },
    include: { items: true },
    orderBy: { erstelltAm: "desc" },
  });

  const [produkteAktiv, produkteGesamt, kunden, archivAnzahl] =
    await Promise.all([
      prisma.product.count({ where: { aktiv: true } }),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count({ where: { abgeschlossen: true } }),
    ]);

  const gesamt = offene.reduce((s, b) => s + summeCent(b.items), 0);
  const bezahlt = offene
    .filter((b) => b.bezahlt)
    .reduce((s, b) => s + summeCent(b.items), 0);
  const artikel = offene.reduce(
    (s, b) => s + b.items.reduce((t, i) => t + i.menge, 0),
    0,
  );

  // Wie viele Bestellungen stehen auf welchem Status?
  const proStatus = STATUS_REIHE.map((status) => ({
    status,
    anzahl: offene.filter((b) => b.status === status).length,
  }));

  const fenster = await bestellfenster();

  return (
    <div className="space-y-5">
      {!adminIstEingerichtet() && (
        <div className="karte border-honig/40 bg-honigHell p-4 text-sm text-ziegel">
          <p className="font-semibold">Admin-Zugangsdaten fehlen noch</p>
          <p className="mt-1">
            Trage <code className="font-mono">ADMIN_EMAIL</code> und{" "}
            <code className="font-mono">ADMIN_PASSWORT</code> in die
            Umgebungsvariablen ein. Solange sie fehlen, kommt nach einem
            Datenbank-Neustart niemand mehr in diesen Bereich.
          </p>
        </div>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kachel titel="Bestellungen" wert={String(offene.length)} betont />
        <Kachel titel="Artikel" wert={String(artikel)} />
        <Kachel titel="Umsatz heute" wert={euro(gesamt)} />
        <Kachel
          titel="Noch offen"
          wert={euro(gesamt - bezahlt)}
          warnung={gesamt - bezahlt > 0}
        />
      </div>

      {/* Bestellfenster */}
      <Link
        href="/admin/einstellungen"
        className="karte flex items-center gap-3 p-4 transition hover:border-honig"
      >
        <span
          className={
            "h-3 w-3 shrink-0 rounded-full " +
            (fenster.offen ? "bg-moos" : "bg-leise")
          }
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {fenster.offen
              ? "Bestellungen sind offen"
              : fenster.grund === "pausiert"
                ? "Bestellungen sind pausiert"
                : fenster.grund === "zu_frueh"
                  ? `Öffnet um ${fenster.start} Uhr`
                  : "Bestellschluss ist durch"}
          </p>
          <p className="text-sm text-leise">
            Täglich {fenster.start} bis {fenster.ende} Uhr · zum Ändern tippen
          </p>
        </div>
      </Link>

      {/* Bestellstatus */}
      <section>
        <h2 className="mb-2 font-titel text-lg font-bold">Bestellstatus</h2>
        <div className="karte divide-y divide-linie overflow-hidden">
          {proStatus.map(({ status, anzahl }) => {
            const t = statusText(status);
            return (
              <div key={status} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-bold " +
                    STATUS_KLASSEN[t.farbe]
                  }
                >
                  {t.titel}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-leise">
                  {t.erklaerung}
                </span>
                <span className="ziffern text-lg font-bold">{anzahl}</span>
              </div>
            );
          })}
        </div>
        <Link
          href="/admin/bestellungen"
          className="btn-zweit mt-3 w-full text-sm"
        >
          Bestellungen verwalten
        </Link>
      </section>

      {/* Schnellzugriff */}
      <section>
        <h2 className="mb-2 font-titel text-lg font-bold">Bereiche</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld
            href="/admin/einkauf"
            titel="Einkaufsliste"
            text={`${artikel} Artikel zusammengezählt, zum Abhaken im Laden`}
          />
          <Feld
            href="/admin/produkte"
            titel="Produkte & Bilder"
            text={`${produkteAktiv} von ${produkteGesamt} veröffentlicht`}
          />
          <Feld
            href="/admin/kunden"
            titel="Kunden"
            text={`${kunden} ${kunden === 1 ? "Konto" : "Konten"} angelegt`}
          />
          <Feld
            href="/admin/kasse"
            titel="Kasse"
            text={`${euro(bezahlt)} eingenommen, ${euro(gesamt - bezahlt)} offen`}
          />
          <Feld
            href="/admin/kategorien"
            titel="Kategorien"
            text="Anlegen, umbenennen, löschen"
          />
          <Feld
            href="/admin/einstellungen"
            titel="Bestellzeiten"
            text={`${fenster.start} bis ${fenster.ende} Uhr`}
          />
          <Feld
            href="/admin/archiv"
            titel="Archiv"
            text={`${archivAnzahl} abgeschlossene ${archivAnzahl === 1 ? "Bestellung" : "Bestellungen"}`}
          />
        </div>
      </section>
    </div>
  );
}

function Kachel({
  titel,
  wert,
  betont = false,
  warnung = false,
}: {
  titel: string;
  wert: string;
  betont?: boolean;
  warnung?: boolean;
}) {
  return (
    <div className={"karte p-3 text-center " + (betont ? "border-honig/50" : "")}>
      <p className="etikett">{titel}</p>
      <p
        className={
          "mt-1 font-titel text-xl font-bold ziffern " +
          (warnung ? "text-ziegel" : "")
        }
      >
        {wert}
      </p>
    </div>
  );
}

function Feld({
  href,
  titel,
  text,
}: {
  href: string;
  titel: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="karte flex items-center gap-3 p-4 transition hover:border-honig hover:shadow-gehoben"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{titel}</p>
        <p className="truncate text-sm text-leise">{text}</p>
      </div>
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-leise" aria-hidden>
        <path
          d="m6 3 5 5-5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </Link>
  );
}
