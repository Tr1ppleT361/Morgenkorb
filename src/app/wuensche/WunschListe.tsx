"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { stimmeUmschalten, wunschAnlegen, type WunschStatus } from "./actions";

type Wunsch = {
  id: string;
  text: string;
  name: string;
  stimmen: number;
  erledigt: boolean;
  antwort: string | null;
  eigeneStimme: boolean;
};

const start: WunschStatus = {};

export function WunschListe({
  wuensche,
  angemeldet,
}: {
  wuensche: Wunsch[];
  angemeldet: boolean;
}) {
  const [status, formAction, laeuft] = useActionState(wunschAnlegen, start);
  const [hinweis, setHinweis] = useState<string | null>(null);

  const offen = wuensche.filter((w) => !w.erledigt);
  const erledigt = wuensche.filter((w) => w.erledigt);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      <h1 className="font-titel text-2xl font-bold">Wünsche</h1>
      <p className="mt-1 text-sm text-leise">
        Was fehlt im Sortiment? Schlag etwas vor – je mehr Stimmen, desto
        wahrscheinlicher landet es im Korb.
      </p>

      {/* Neuer Wunsch */}
      <div className="karte mt-5 p-4">
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="w-text" className="mb-1 block text-sm font-semibold">
              Dein Vorschlag
            </label>
            <input
              id="w-text"
              name="text"
              className="eingabe"
              placeholder="z. B. Arizona Green Tea"
              required
              maxLength={100}
            />
          </div>

          {!angemeldet && (
            <div>
              <label htmlFor="w-name" className="mb-1 block text-sm font-semibold">
                Dein Name
              </label>
              <input
                id="w-name"
                name="name"
                className="eingabe"
                placeholder="z. B. Lena"
                required
                maxLength={60}
              />
            </div>
          )}

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
            {laeuft ? "Schickt…" : "Vorschlagen"}
          </button>
        </form>
      </div>

      {hinweis && (
        <p className="mt-4 rounded-weich border border-honig/40 bg-honigHell px-4 py-3 text-sm font-semibold text-ziegel">
          {hinweis}{" "}
          <Link href="/registrieren" className="underline">
            Konto anlegen
          </Link>
        </p>
      )}

      {/* Offene Wünsche */}
      <h2 className="mb-2 mt-8 font-titel text-lg font-bold">
        Vorschläge {offen.length > 0 && <span className="text-leise">({offen.length})</span>}
      </h2>

      {offen.length === 0 ? (
        <p className="karte p-6 text-center text-sm text-leise">
          Noch keine Vorschläge. Mach den Anfang!
        </p>
      ) : (
        <ul className="space-y-2">
          {offen.map((w) => (
            <WunschZeile key={w.id} wunsch={w} onHinweis={setHinweis} />
          ))}
        </ul>
      )}

      {/* Erledigte */}
      {erledigt.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-titel text-lg font-bold text-leise">
            Erledigt
          </h2>
          <ul className="space-y-2">
            {erledigt.map((w) => (
              <li key={w.id} className="karte p-3.5 opacity-70">
                <p className="text-sm font-semibold line-through">{w.text}</p>
                {w.antwort && (
                  <p className="mt-1 text-sm text-leise">{w.antwort}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function WunschZeile({
  wunsch: w,
  onHinweis,
}: {
  wunsch: Wunsch;
  onHinweis: (m: string | null) => void;
}) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();

  return (
    <li className="karte flex items-center gap-3 p-3">
      {/* Stimmknopf */}
      <button
        type="button"
        aria-pressed={w.eigeneStimme}
        aria-label={w.eigeneStimme ? "Stimme zurückziehen" : "Dafür stimmen"}
        disabled={laeuft}
        onClick={() =>
          starte(async () => {
            onHinweis(null);
            const r = await stimmeUmschalten(w.id);
            if (!r.ok && r.fehler) onHinweis(r.fehler);
            router.refresh();
          })
        }
        className={
          "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-weich border-2 transition " +
          (w.eigeneStimme
            ? "border-honig bg-honigHell text-ziegel"
            : "border-linie bg-karte text-leise hover:border-honig/50")
        }
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="m3 10 5-5 5 5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="mt-0.5 text-base font-bold ziffern">{w.stimmen}</span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{w.text}</p>
        <p className="text-sm text-leise">von {w.name}</p>
      </div>
    </li>
  );
}
