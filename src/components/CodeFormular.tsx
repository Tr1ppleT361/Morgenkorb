"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  codeBestaetigen,
  codeErneutSenden,
  type KontoStatus,
} from "@/app/konto/actions";

const start: KontoStatus = {};

/** Eingabe des sechsstelligen Bestätigungscodes aus der E-Mail. */
export function CodeFormular({
  email,
  ziel,
  frischVerschickt,
}: {
  email: string;
  ziel: string;
  frischVerschickt: boolean;
}) {
  const [status, formAction, laeuft] = useActionState(codeBestaetigen, start);
  const [nochmal, nochmalAction, laeuftNochmal] = useActionState(
    codeErneutSenden,
    start,
  );

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-korb bg-honigHell text-ziegel">
          <BriefZeichen className="h-7 w-7" />
        </span>
        <h1 className="mt-3 font-titel text-2xl font-bold">Code eingeben</h1>
        <p className="mt-1 text-sm text-leise">
          Wir haben dir einen sechsstelligen Code an
          <br />
          <span className="font-semibold text-tinte">{email}</span> geschickt.
        </p>
      </div>

      <div className="karte p-5">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="ziel" value={ziel} />

          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-semibold">
              Bestätigungscode
            </label>
            <input
              id="code"
              name="code"
              className="eingabe text-center font-titel text-3xl font-bold tracking-[0.35em] ziffern"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              autoFocus
              required
            />
          </div>

          {status.fehler && (
            <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
              {status.fehler}
            </p>
          )}

          <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
            {laeuft ? "Prüft…" : "Konto freischalten"}
          </button>
        </form>
      </div>

      {/* Neuen Code anfordern */}
      <form action={nochmalAction} className="mt-5 text-center">
        <input type="hidden" name="email" value={email} />
        {nochmal.erfolg && (
          <p className="mb-2 text-sm font-semibold text-moos">{nochmal.erfolg}</p>
        )}
        {nochmal.fehler && (
          <p className="mb-2 text-sm font-semibold text-beere">{nochmal.fehler}</p>
        )}
        <button
          type="submit"
          className="text-sm text-leise underline"
          disabled={laeuftNochmal}
        >
          {laeuftNochmal ? "Sendet…" : "Keine Mail bekommen? Neuen Code senden"}
        </button>
      </form>

      <div className="mt-6 space-y-1 text-center text-xs text-leise">
        {frischVerschickt && (
          <p>Dein Konto war noch nicht bestätigt – wir haben dir einen neuen Code geschickt.</p>
        )}
        <p>
          Schau auch im Spam-Ordner nach. Der Code gilt 30 Minuten.
        </p>
        <p>
          Falsche Adresse eingegeben?{" "}
          <Link href="/registrieren" className="underline">
            Nochmal von vorne
          </Link>
        </p>
      </div>
    </main>
  );
}

function BriefZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
