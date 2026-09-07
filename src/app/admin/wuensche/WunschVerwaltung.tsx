"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { wunschErledigen } from "@/app/wuensche/actions";

type Wunsch = {
  id: string;
  text: string;
  name: string;
  stimmen: number;
  erledigt: boolean;
  antwort: string | null;
};

export function WunschVerwaltung({ wuensche }: { wuensche: Wunsch[] }) {
  const offen = wuensche.filter((w) => !w.erledigt);
  const erledigt = wuensche.filter((w) => w.erledigt);

  return (
    <div className="space-y-6">
      <p className="text-sm text-leise">
        Was sich deine Mitschüler wünschen – die mit den meisten Stimmen oben.
        Nimmst du etwas ins Sortiment auf, hak den Wunsch ab.
      </p>

      <section>
        <h2 className="mb-2 font-titel text-lg font-bold">
          Offen ({offen.length})
        </h2>
        {offen.length === 0 ? (
          <p className="karte p-6 text-center text-sm text-leise">
            Keine offenen Wünsche.
          </p>
        ) : (
          <ul className="karte divide-y divide-linie overflow-hidden">
            {offen.map((w) => (
              <Zeile key={w.id} wunsch={w} />
            ))}
          </ul>
        )}
      </section>

      {erledigt.length > 0 && (
        <section>
          <h2 className="mb-2 font-titel text-lg font-bold text-leise">
            Erledigt ({erledigt.length})
          </h2>
          <ul className="karte divide-y divide-linie overflow-hidden">
            {erledigt.map((w) => (
              <Zeile key={w.id} wunsch={w} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Zeile({ wunsch: w }: { wunsch: Wunsch }) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const [antwort, setAntwort] = useState(w.antwort ?? "");
  const [offen, setOffen] = useState(false);

  return (
    <li className="px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-weich bg-honigHell text-ziegel">
          <span className="text-base font-bold ziffern">{w.stimmen}</span>
          <span className="text-[0.55rem] font-bold uppercase">
            {w.stimmen === 1 ? "Stimme" : "Stimmen"}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className={"font-semibold " + (w.erledigt ? "text-leise line-through" : "")}>
            {w.text}
          </p>
          <p className="text-sm text-leise">von {w.name}</p>
          {w.antwort && !offen && (
            <p className="mt-0.5 text-sm text-leise">Antwort: {w.antwort}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOffen((o) => !o)}
          className="shrink-0 rounded-weich border border-linie px-2.5 py-2 text-xs font-semibold transition hover:bg-honigHell"
        >
          {offen ? "Zu" : "Antworten"}
        </button>

        <button
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await wunschErledigen(w.id, !w.erledigt, antwort);
              router.refresh();
            })
          }
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-weich border-2 transition " +
            (w.erledigt
              ? "border-moos bg-moos text-white"
              : "border-linie bg-karte text-transparent hover:border-moos/50")
          }
          aria-label={w.erledigt ? "Wieder öffnen" : "Als erledigt markieren"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {offen && (
        <div className="mt-2 flex gap-2">
          <input
            className="eingabe text-sm"
            placeholder="z. B. Kommt ab nächster Woche"
            value={antwort}
            onChange={(e) => setAntwort(e.target.value)}
            maxLength={200}
          />
          <button
            type="button"
            className="btn-primaer !min-h-[2.75rem] !px-4 text-sm"
            disabled={laeuft}
            onClick={() =>
              starte(async () => {
                await wunschErledigen(w.id, w.erledigt, antwort);
                setOffen(false);
                router.refresh();
              })
            }
          >
            Speichern
          </button>
        </div>
      )}
    </li>
  );
}
