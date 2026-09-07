"use client";

import { useActionState } from "react";
import { bestellzeitenSetzen, type ZeitenStatus } from "../actions";

const start: ZeitenStatus = {};

/** Start- und Endzeit fürs Bestellen – jederzeit änderbar. */
export function ZeitenFormular({
  start: startZeit,
  ende,
  aktiv,
  abholOrt,
  abholZeit,
  limitCent,
  aenderFrist,
}: {
  start: string;
  ende: string;
  aktiv: boolean;
  abholOrt: string;
  abholZeit: string;
  limitCent: number;
  aenderFrist: string;
}) {
  const [status, formAction, laeuft] = useActionState(
    bestellzeitenSetzen,
    start,
  );

  return (
    <div className="karte p-4">
      <h2 className="mb-1 font-titel text-lg font-bold">Shop-Einstellungen</h2>
      <p className="mb-4 text-sm text-leise">
        In diesem Zeitfenster können deine Mitschüler bestellen.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="z-start" className="mb-1 block text-sm font-medium">
              Ab
            </label>
            <input
              id="z-start"
              name="start"
              type="time"
              className="eingabe"
              defaultValue={startZeit}
              required
            />
          </div>
          <div>
            <label htmlFor="z-ende" className="mb-1 block text-sm font-medium">
              Bis
            </label>
            <input
              id="z-ende"
              name="ende"
              type="time"
              className="eingabe"
              defaultValue={ende}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-weich border border-linie bg-grund p-3">
          <input
            type="checkbox"
            name="aktiv"
            defaultChecked={aktiv}
            className="h-6 w-6 accent-honig"
          />
          <span className="text-sm">
            <span className="font-semibold">Bestellungen angenommen</span>
            <br />
            <span className="text-leise">
              Häkchen weg = sofort geschlossen, unabhängig von der Uhrzeit.
            </span>
          </span>
        </label>

        {/* Änderungsfrist */}
        <div>
          <label htmlFor="z-frist" className="mb-1 block text-sm font-medium">
            Kunden dürfen selbst ändern bis
          </label>
          <input
            id="z-frist"
            name="aenderFrist"
            type="time"
            className="eingabe"
            defaultValue={aenderFrist}
          />
          <p className="mt-1 text-xs text-leise">
            Leer lassen = bis zum Bestellschluss. Danach können Bestellungen
            nur noch von dir geändert werden.
          </p>
        </div>

        {/* Bestelllimit */}
        <div>
          <label htmlFor="z-limit" className="mb-1 block text-sm font-medium">
            Bestelllimit pro Person in €
          </label>
          <input
            id="z-limit"
            name="limit"
            className="eingabe"
            inputMode="decimal"
            placeholder="20"
            defaultValue={limitCent > 0 ? (limitCent / 100).toFixed(2).replace(".", ",") : ""}
          />
          <p className="mt-1 text-xs text-leise">
            0 oder leer = kein Limit. Im Warenkorb steht dann „Noch X € bis zum
            Bestelllimit".
          </p>
        </div>

        {/* Abholinfos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="z-ort" className="mb-1 block text-sm font-medium">
              Abholort
            </label>
            <input
              id="z-ort"
              name="abholOrt"
              className="eingabe"
              placeholder="z. B. Klassenraum 204"
              defaultValue={abholOrt}
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="z-abholzeit" className="mb-1 block text-sm font-medium">
              Abholzeit
            </label>
            <input
              id="z-abholzeit"
              name="abholZeit"
              className="eingabe"
              placeholder="z. B. erste große Pause"
              defaultValue={abholZeit}
              maxLength={120}
            />
          </div>
        </div>

        {status.fehler && (
          <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
            {status.fehler}
          </p>
        )}
        {status.erfolg && (
          <p className="rounded-weich bg-moos/12 px-4 py-3 text-sm font-semibold text-moos">
            {status.erfolg}
          </p>
        )}

        <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
          {laeuft ? "Speichert…" : "Einstellungen speichern"}
        </button>
      </form>
    </div>
  );
}
