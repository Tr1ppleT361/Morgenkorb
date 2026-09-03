/**
 * Bestätigungsseite nach dem Absenden – aufgemacht wie ein Kassenzettel.
 * Die Adresse enthält die zufällige Bestell-ID, z. B. /bestellung/clx123...
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";
import { KorbZeichen } from "@/components/Logo";
import { StatusVerlauf } from "@/components/StatusVerlauf";
import { JetztBezahlen } from "@/components/JetztBezahlen";
import { stripeEingerichtet } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function Bestaetigung({
  params,
  searchParams,
}: {
  // In Next.js 15 sind params ein Promise – deshalb das await unten.
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    bezahlt?: string;
    abgebrochen?: string;
    zahlfehler?: string;
  }>;
}) {
  const { id } = await params;
  const hinweise = await searchParams;

  const bestellung = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      verlauf: { orderBy: { am: "asc" } },
    },
  });

  if (!bestellung) notFound();

  const summe = summeCent(bestellung.items);
  const karteMoeglich = stripeEingerichtet();
  const stueck = bestellung.items.reduce((s, i) => s + i.menge, 0);

  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: config.zeitzone,
  }).format(bestellung.erstelltAm);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Kopf */}
      <div className="text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-moos/15 text-moos ring-1 ring-moos/25">
          <HakenZeichen className="h-8 w-8" />
        </span>
        <h1 className="mt-4 font-titel text-3xl font-bold leading-tight">
          Alles klar, {bestellung.name}!
        </h1>
        <p className="mt-2 text-leise">
          Deine Sachen sind morgen früh dabei.
        </p>
      </div>

      {/* Rückmeldung nach der Kartenzahlung */}
      {hinweise.bezahlt === "1" && bestellung.zahlstatus !== "BEZAHLT" && (
        <div className="karte mt-5 border-honig/40 bg-honigHell p-4 text-sm text-ziegel">
          Danke! Die Zahlung wird gerade bestätigt. Das dauert manchmal ein paar
          Sekunden – lade die Seite gleich nochmal.
        </div>
      )}
      {hinweise.abgebrochen === "1" && (
        <div className="karte mt-5 p-4 text-sm">
          Die Zahlung wurde abgebrochen. Deine Bestellung steht trotzdem – du
          kannst unten erneut zahlen oder einfach bar bei der Übergabe bezahlen.
        </div>
      )}
      {hinweise.zahlfehler && (
        <div className="karte mt-5 border-beere/40 bg-beere/8 p-4 text-sm text-beere">
          {hinweise.zahlfehler}
        </div>
      )}

      {/* Zahlungsstatus */}
      <section className="mt-5">
        <div
          className={
            "karte flex items-center gap-3 p-4 " +
            (bestellung.zahlstatus === "BEZAHLT" ? "border-moos/50" : "")
          }
        >
          <span
            className={
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-weich " +
              (bestellung.zahlstatus === "BEZAHLT"
                ? "bg-moos/15 text-moos"
                : "bg-honigHell text-ziegel")
            }
          >
            {bestellung.zahlstatus === "BEZAHLT" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {bestellung.zahlstatus === "BEZAHLT"
                ? "Bezahlt"
                : bestellung.zahlstatus === "ERSTATTET"
                  ? "Erstattet"
                  : bestellung.zahlart === "KARTE"
                    ? "Zahlung offen"
                    : "Bar bei der Übergabe"}
            </p>
            <p className="text-sm text-leise">
              {bestellung.zahlstatus === "BEZAHLT"
                ? `${euro(summe)} sind eingegangen – du musst nichts mitbringen.`
                : `${euro(summe)} ${bestellung.zahlart === "KARTE" ? "noch offen" : "passend mitbringen"}`}
            </p>
          </div>
        </div>

        {/* Nachträglich mit Karte zahlen */}
        {karteMoeglich && bestellung.zahlstatus !== "BEZAHLT" && (
          <JetztBezahlen orderId={bestellung.id} betrag={euro(summe)} />
        )}
      </section>

      {/* Wo steht die Bestellung gerade? */}
      <section className="mt-7">
        <h2 className="mb-2 font-titel text-lg font-bold">Status</h2>
        <StatusVerlauf
          status={bestellung.status}
          verlauf={bestellung.verlauf}
          zeitzone={config.zeitzone}
        />
      </section>

      {/* Der Zettel */}
      <div className="karte relative mt-2 overflow-hidden">
        {/* gezackte Oberkante, wie abgerissen */}
        <div
          className="h-3 w-full bg-honig/25"
          style={{
            maskImage:
              "radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)",
            maskSize: "12px 12px",
            maskRepeat: "repeat-x",
            WebkitMaskImage:
              "radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)",
            WebkitMaskSize: "12px 12px",
            WebkitMaskRepeat: "repeat-x",
          }}
        />

        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-titel text-lg font-bold">
              <KorbZeichen className="h-5 w-5 text-ziegel" />
              {config.appName}
            </span>
            <span className="etikett">{stueck} Teile</span>
          </div>

          <div className="my-4 border-t border-dashed border-linie" />

          <ul className="space-y-2.5">
            {bestellung.items.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3 text-sm">
                <span className="w-8 shrink-0 font-bold text-ziegel ziffern">
                  {item.menge}×
                </span>
                <span className="min-w-0 flex-1">{item.product.name}</span>
                {/* Punktreihe wie auf einem echten Bon */}
                <span className="h-px min-w-4 flex-1 self-center border-b border-dotted border-linie" />
                <span className="shrink-0 ziffern">
                  {euro(item.menge * item.preisBeimKauf)}
                </span>
              </li>
            ))}
          </ul>

          {bestellung.notiz && (
            <p className="mt-4 rounded-weich bg-honigHell px-3.5 py-2.5 text-sm">
              <span className="font-semibold">Notiz: </span>
              {bestellung.notiz}
            </p>
          )}

          <div className="my-4 border-t border-dashed border-linie" />

          <div className="flex items-center justify-between gap-3">
            <p className="etikett">Bitte mitbringen</p>
            <p className="font-titel text-[2.5rem] font-bold leading-none ziffern">
              {euro(summe)}
            </p>
          </div>
          <p className="mt-1.5 text-xs text-leise">{config.uebergabeHinweis}</p>
        </div>

        {/* Fußzeile des Zettels */}
        <dl className="grid grid-cols-3 gap-2 border-t border-linie bg-grund px-5 py-3 text-xs text-leise">
          <div>
            <dt className="etikett">Klasse</dt>
            <dd className="mt-0.5 text-tinte">{bestellung.klasse}</dd>
          </div>
          <div>
            <dt className="etikett">Bestellt</dt>
            <dd className="mt-0.5 text-tinte ziffern">{datum}</dd>
          </div>
          <div className="min-w-0">
            <dt className="etikett">Nummer</dt>
            <dd className="mt-0.5 truncate font-mono text-[0.65rem] text-tinte">
              {bestellung.id}
            </dd>
          </div>
        </dl>
      </div>

      <Link href="/" className="btn-zweit mt-5 w-full">
        Noch etwas bestellen
      </Link>

      <p className="mt-4 text-center text-xs text-leise">
        Tipp: Speichere diese Seite als Lesezeichen, dann findest du deinen
        Zettel wieder.
      </p>
    </main>
  );
}

function HakenZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
