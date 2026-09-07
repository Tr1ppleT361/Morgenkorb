"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { euro } from "@/lib/geld";
import { bestellungAendern, bestellungStornieren } from "./actions";

type Artikel = { id: number; name: string; menge: number; preis: number };

export function AenderFormular({
  orderId,
  frist,
  bezahlt,
  summe,
  artikel,
}: {
  orderId: string;
  frist: string;
  bezahlt: boolean;
  summe: number;
  artikel: Artikel[];
}) {
  const router = useRouter();
  const [mengen, setMengen] = useState<Record<number, number>>(
    Object.fromEntries(artikel.map((a) => [a.id, a.menge])),
  );
  const [fehler, setFehler] = useState<string | null>(null);
  const [nachfrage, setNachfrage] = useState(false);
  const [laeuft, starte] = useTransition();

  const neueSumme = artikel.reduce(
    (s, a) => s + (mengen[a.id] ?? 0) * a.preis,
    0,
  );
  const differenz = neueSumme - summe;
  const geaendert = artikel.some((a) => (mengen[a.id] ?? 0) !== a.menge);

  function setzen(id: number, delta: number) {
    setFehler(null);
    setMengen((alt) => ({
      ...alt,
      [id]: Math.max(0, Math.min(20, (alt[id] ?? 0) + delta)),
    }));
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-titel text-2xl font-bold">Bestellung ändern</h1>
      <p className="mt-1 text-sm text-leise">
        Noch bis {frist} Uhr kannst du selbst anpassen oder stornieren.
      </p>

      {bezahlt && (
        <div className="karte mt-4 border-honig/40 bg-honigHell p-4 text-sm text-ziegel">
          <p className="font-semibold">Diese Bestellung ist schon bezahlt.</p>
          <p className="mt-1">
            Wird es günstiger, bekommst du die Differenz automatisch zurück.
            Wird es teurer, kannst du den Rest danach nachzahlen.
          </p>
        </div>
      )}

      <ul className="karte mt-4 divide-y divide-linie overflow-hidden">
        {artikel.map((a) => {
          const menge = mengen[a.id] ?? 0;
          return (
            <li
              key={a.id}
              className={"flex items-center gap-3 p-3 " + (menge === 0 ? "opacity-50" : "")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.name}</p>
                <p className="text-sm text-leise ziffern">
                  {menge > 0 ? euro(menge * a.preis) : "wird entfernt"}
                  <span className="ml-1.5 text-xs">({euro(a.preis)} je Stück)</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-linie bg-grund p-0.5">
                <button
                  type="button"
                  aria-label={`${a.name}: eins weniger`}
                  onClick={() => setzen(a.id, -1)}
                  disabled={laeuft}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-karte shadow-sanft transition hover:bg-honigHell"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="w-6 text-center text-sm font-bold ziffern">{menge}</span>
                <button
                  type="button"
                  aria-label={`${a.name}: eins mehr`}
                  onClick={() => setzen(a.id, 1)}
                  disabled={laeuft}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-honig text-white transition hover:brightness-110"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Differenz */}
      <div className="karte mt-3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-leise">Bisher</span>
          <span className="ziffern">{euro(summe)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold">Neu</span>
          <span className="font-titel text-xl font-bold ziffern">
            {euro(neueSumme)}
          </span>
        </div>
        {geaendert && differenz !== 0 && (
          <p
            className={
              "mt-2 rounded-weich px-3 py-2 text-sm font-semibold " +
              (differenz < 0 ? "bg-moos/12 text-moos" : "bg-honigHell text-ziegel")
            }
          >
            {differenz < 0
              ? `${euro(-differenz)} weniger${bezahlt ? " – wird erstattet" : ""}`
              : `${euro(differenz)} mehr${bezahlt ? " – nachzuzahlen" : ""}`}
          </p>
        )}
      </div>

      {fehler && (
        <p className="mt-3 rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
          {fehler}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <Link href={`/bestellung/${orderId}`} className="btn-zweit flex-1">
          Zurück
        </Link>
        <button
          type="button"
          className="btn-primaer flex-[2]"
          disabled={laeuft || !geaendert || neueSumme <= 0}
          onClick={() =>
            starte(async () => {
              setFehler(null);
              const r = await bestellungAendern(
                orderId,
                artikel.map((a) => ({ itemId: a.id, menge: mengen[a.id] ?? 0 })),
              );
              if (!r.ok) setFehler(r.fehler);
              else router.push(`/bestellung/${orderId}?geaendert=${encodeURIComponent(r.hinweis)}`);
            })
          }
        >
          {laeuft ? "Speichert…" : "Änderung speichern"}
        </button>
      </div>

      {/* Stornieren */}
      <div className="mt-8 border-t border-linie pt-5">
        {!nachfrage ? (
          <button
            type="button"
            className="w-full text-center text-sm text-beere underline"
            onClick={() => setNachfrage(true)}
          >
            Bestellung ganz stornieren
          </button>
        ) : (
          <div className="karte border-beere/40 bg-beere/8 p-4">
            <p className="text-sm font-semibold text-beere">
              Wirklich die ganze Bestellung stornieren?
            </p>
            <p className="mt-1 text-sm text-leise">
              {bezahlt
                ? `${euro(summe)} werden auf demselben Weg zurückerstattet. Je nach Bank dauert das ein paar Tage.`
                : "Du musst dann nichts mitbringen."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-zweit flex-1 !min-h-[2.75rem] text-sm"
                onClick={() => setNachfrage(false)}
                disabled={laeuft}
              >
                Doch nicht
              </button>
              <button
                type="button"
                className="btn flex-1 !min-h-[2.75rem] bg-beere text-sm text-white"
                disabled={laeuft}
                onClick={() =>
                  starte(async () => {
                    const r = await bestellungStornieren(orderId);
                    if (!r.ok) setFehler(r.fehler);
                    else
                      router.push(
                        `/bestellung/${orderId}?geaendert=${encodeURIComponent(r.hinweis)}`,
                      );
                  })
                }
              >
                {laeuft ? "Storniert…" : "Ja, stornieren"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
