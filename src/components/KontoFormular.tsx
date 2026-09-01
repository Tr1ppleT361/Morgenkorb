"use client";

import Link from "next/link";
import { useActionState } from "react";
import { anmelden, registrieren, type KontoStatus } from "@/app/konto/actions";
import { KorbZeichen } from "./Logo";

const start: KontoStatus = {};

/**
 * Ein Formular für beides – Anmelden und Registrieren.
 * Der Unterschied sind nur ein paar Felder und die Texte.
 */
export function KontoFormular({
  art,
  ziel,
}: {
  art: "anmelden" | "registrieren";
  ziel: string;
}) {
  const istRegistrierung = art === "registrieren";
  const [status, formAction, laeuft] = useActionState(
    istRegistrierung ? registrieren : anmelden,
    start,
  );

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-korb bg-honigHell text-ziegel">
          <KorbZeichen className="h-8 w-8" />
        </span>
        <h1 className="mt-3 font-titel text-2xl font-bold">
          {istRegistrierung ? "Konto anlegen" : "Willkommen zurück"}
        </h1>
        <p className="mt-1 text-sm text-leise">
          {istRegistrierung
            ? "Damit siehst du deine Bestellungen und ihren Status."
            : "Melde dich an, um deine Bestellungen zu sehen."}
        </p>
      </div>

      <div className="karte p-5">
        <form action={formAction} className="space-y-3">
          {/* Wohin es nach dem Anmelden gehen soll */}
          <input type="hidden" name="ziel" value={ziel} />

          {istRegistrierung && (
            <>
              <Feld
                id="name"
                name="name"
                label="Dein Name"
                placeholder="z. B. Lena Meier"
                autoComplete="name"
                required
                maxLength={60}
              />
              <Feld
                id="klasse"
                name="klasse"
                label="Klasse"
                zusatz="(optional)"
                placeholder="z. B. 10b"
                maxLength={20}
              />
            </>
          )}

          <Feld
            id="email"
            name="email"
            type="email"
            label="E-Mail"
            placeholder="name@schule.de"
            autoComplete="email"
            required
            maxLength={120}
          />

          <Feld
            id="passwort"
            name="passwort"
            type="password"
            label="Passwort"
            zusatz={istRegistrierung ? "(mind. 8 Zeichen)" : undefined}
            autoComplete={istRegistrierung ? "new-password" : "current-password"}
            required
            minLength={istRegistrierung ? 8 : undefined}
          />

          {status.fehler && (
            <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
              {status.fehler}
            </p>
          )}

          <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
            {laeuft
              ? "Moment…"
              : istRegistrierung
                ? "Konto anlegen"
                : "Anmelden"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-leise">
        {istRegistrierung ? (
          <>
            Schon ein Konto?{" "}
            <Link href="/anmelden" className="font-semibold text-ziegel underline">
              Anmelden
            </Link>
          </>
        ) : (
          <>
            Noch kein Konto?{" "}
            <Link
              href="/registrieren"
              className="font-semibold text-ziegel underline"
            >
              Jetzt anlegen
            </Link>
          </>
        )}
      </p>

      <p className="mt-6 text-center text-xs text-leise">
        Du kannst auch{" "}
        <Link href="/" className="underline">
          ohne Konto bestellen
        </Link>{" "}
        – dann siehst du deine Bestellung nur über den Link der
        Bestätigungsseite.
      </p>
    </main>
  );
}

/** Ein beschriftetes Eingabefeld. */
function Feld({
  id,
  label,
  zusatz,
  ...rest
}: {
  id: string;
  label: string;
  zusatz?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {zusatz && <span className="ml-1 font-normal text-leise">{zusatz}</span>}
      </label>
      <input id={id} className="eingabe" {...rest} />
    </div>
  );
}
