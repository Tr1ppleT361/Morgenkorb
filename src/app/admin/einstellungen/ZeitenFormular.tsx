"use client";

import { useActionState } from "react";
import { bestellzeitenSetzen, type ZeitenStatus } from "../actions";

const start: ZeitenStatus = {};

/** Start- und Endzeit fürs Bestellen – jederzeit änderbar. */
export function ZeitenFormular({
  start: startZeit,
  ende,
  aktiv,
}: {
  start: string;
  ende: string;
  aktiv: boolean;
}) {
  const [status, formAction, laeuft] = useActionState(
    bestellzeitenSetzen,
    start,
  );

  return (
    <div className="karte p-4">
      <h2 className="mb-1 font-titel text-lg font-bold">Bestellzeiten</h2>
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
          {laeuft ? "Speichert…" : "Zeiten speichern"}
        </button>
      </form>
    </div>
  );
}
