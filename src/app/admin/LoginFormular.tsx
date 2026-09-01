"use client";

import { useActionState } from "react";
import { einloggen, type LoginStatus } from "./actions";

const start: LoginStatus = {};

/** Passwort-Abfrage vor dem Admin-Bereich. */
export function LoginFormular() {
  // useActionState verbindet ein Formular mit einer Server Action und
  // gibt uns das Ergebnis (hier: eine Fehlermeldung) zurück.
  const [status, formAction, laeuft] = useActionState(einloggen, start);

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <div className="karte p-6">
        <h1 className="text-xl font-bold">Admin-Bereich</h1>
        <p className="mt-1 text-sm text-leise">
          Bitte Passwort eingeben.
        </p>

        <form action={formAction} className="mt-5 space-y-3">
          <input
            type="password"
            name="passwort"
            className="eingabe"
            placeholder="Passwort"
            autoFocus
            required
            autoComplete="current-password"
          />
          {status.fehler && (
            <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
              {status.fehler}
            </p>
          )}
          <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
            {laeuft ? "Moment…" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
