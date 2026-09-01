"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { euro } from "@/lib/geld";
import {
  STATUS_REIHE,
  STATUS_KLASSEN,
  naechsterStatus,
  statusText,
} from "@/lib/status";
import { bezahltUmschalten, bestellungLoeschen, statusSetzen } from "../actions";

type Artikel = { id: number; name: string; menge: number; preis: number };

/** Eine Bestellung als aufklappbare Karte mit Statusverwaltung. */
export function BestellKarte({
  id,
  name,
  klasse,
  notiz,
  bezahlt,
  status,
  email,
  hatKonto,
  erstelltAm,
  summe,
  artikel,
}: {
  id: string;
  name: string;
  klasse: string;
  notiz: string | null;
  bezahlt: boolean;
  status: string;
  email: string | null;
  hatKonto: boolean;
  erstelltAm: string;
  summe: number;
  artikel: Artikel[];
}) {
  const [offen, setOffen] = useState(false);
  const [istBezahlt, setIstBezahlt] = useState(bezahlt);
  const [laeuft, starte] = useTransition();
  const router = useRouter();

  const t = statusText(status);
  const weiter = naechsterStatus(status);
  const zeit = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(erstelltAm));

  function bezahltKlick() {
    const neu = !istBezahlt;
    setIstBezahlt(neu); // sofort umschalten, damit es sich flott anfühlt
    starte(async () => {
      await bezahltUmschalten(id, neu);
      router.refresh();
    });
  }

  function statusKlick(neu: string) {
    starte(async () => {
      await statusSetzen(id, neu);
      router.refresh();
    });
  }

  return (
    <div
      className={
        "karte overflow-hidden " + (istBezahlt ? "border-moos/50" : "")
      }
    >
      <div className="flex items-center gap-3 p-4">
        {/* Bezahlt-Häkchen */}
        <button
          type="button"
          onClick={bezahltKlick}
          disabled={laeuft}
          aria-pressed={istBezahlt}
          aria-label={istBezahlt ? "Als unbezahlt markieren" : "Als bezahlt markieren"}
          title={istBezahlt ? "bezahlt" : "noch offen"}
          className={
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-weich border-2 transition " +
            (istBezahlt
              ? "border-moos bg-moos text-white"
              : "border-linie bg-karte text-transparent")
          }
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setOffen((o) => !o)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-semibold">
            {name}{" "}
            <span className="font-normal text-leise">· {klasse}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-leise">
            <span
              className={
                "rounded-full px-2 py-0.5 text-[0.7rem] font-bold " +
                STATUS_KLASSEN[t.farbe]
              }
            >
              {t.titel}
            </span>
            <span>{zeit} Uhr</span>
            <span>· {artikel.reduce((s, a) => s + a.menge, 0)} Artikel</span>
          </p>
        </button>

        <span className="shrink-0 font-titel text-lg font-bold ziffern">
          {euro(summe)}
        </span>
      </div>

      {/* Statusleiste – immer sichtbar, ein Klick weiter */}
      <div className="flex flex-wrap items-center gap-2 border-t border-linie bg-grund px-4 py-3">
        {weiter ? (
          <button
            type="button"
            className="btn-primaer !min-h-[2.5rem] !px-4 text-sm"
            disabled={laeuft}
            onClick={() => statusKlick(weiter)}
          >
            Weiter zu „{statusText(weiter).titel}"
          </button>
        ) : (
          <span className="text-sm font-semibold text-moos">
            Abgeschlossen
          </span>
        )}

        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-leise">Status</span>
          <select
            value={status}
            disabled={laeuft}
            onChange={(e) => statusKlick(e.target.value)}
            className="rounded-weich border border-linie bg-karte px-2 py-1.5 text-sm font-semibold"
          >
            {STATUS_REIHE.map((s) => (
              <option key={s} value={s}>
                {statusText(s).titel}
              </option>
            ))}
            <option value="STORNIERT">Storniert</option>
          </select>
        </label>
      </div>

      {/* Details */}
      {offen && (
        <div className="border-t border-linie px-4 py-3">
          <p className="etikett mb-2">Kunde</p>
          <p className="text-sm">
            {name} · {klasse}
            {email && (
              <>
                <br />
                <a href={`mailto:${email}`} className="underline">
                  {email}
                </a>
              </>
            )}
            {!hatKonto && (
              <span className="ml-1 text-leise">(ohne Konto bestellt)</span>
            )}
          </p>

          <p className="etikett mb-2 mt-4">Artikel</p>
          <ul className="space-y-1 text-sm">
            {artikel.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">{a.menge}×</span> {a.name}
                </span>
                <span className="ziffern text-leise">
                  {euro(a.menge * a.preis)}
                </span>
              </li>
            ))}
          </ul>

          {notiz && (
            <p className="mt-3 rounded-weich bg-honigHell px-3 py-2 text-sm">
              <span className="font-semibold">Notiz:</span> {notiz}
            </p>
          )}

          <button
            type="button"
            className="mt-3 text-sm text-beere underline"
            disabled={laeuft}
            onClick={() => {
              if (!confirm(`Bestellung von ${name} wirklich löschen?`)) return;
              starte(async () => {
                await bestellungLoeschen(id);
                router.refresh();
              });
            }}
          >
            Bestellung löschen
          </button>
        </div>
      )}
    </div>
  );
}
