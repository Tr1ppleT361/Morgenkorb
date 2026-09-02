"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  kategorieAktivUmschalten,
  kategorieAnlegen,
  kategorieLoeschen,
  kategorieUmbenennen,
  type ProduktStatus,
} from "../actions";

type Kategorie = {
  id: number;
  name: string;
  sortierung: number;
  aktiv: boolean;
  anzahl: number;
};

const start: ProduktStatus = {};

export function KategorieVerwaltung({ kategorien }: { kategorien: Kategorie[] }) {
  const router = useRouter();
  const [status, formAction, laeuft] = useActionState(kategorieAnlegen, start);
  const [meldung, setMeldung] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-leise">
        Kategorien bestimmen, wie der Shop gegliedert ist. Die Reihenfolge legt
        fest, was oben steht – kleinere Zahl heißt weiter oben. Eine ganze
        Kategorie ausblenden ist praktisch, wenn es z. B. gerade keine
        Bäckerei-Ware gibt.
      </p>

      <ul className="karte divide-y divide-linie overflow-hidden">
        {kategorien.map((k) => (
          <KategorieZeile key={k.id} kategorie={k} onFehler={setMeldung} />
        ))}
        {kategorien.length === 0 && (
          <li className="p-6 text-center text-sm text-leise">
            Noch keine Kategorien.
          </li>
        )}
      </ul>

      {meldung && (
        <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
          {meldung}
        </p>
      )}

      <div className="karte p-4">
        <h2 className="mb-3 font-titel text-lg font-bold">Neue Kategorie</h2>
        <form action={formAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div>
              <label htmlFor="k-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id="k-name"
                name="name"
                className="eingabe"
                placeholder="z. B. Eis"
                required
                maxLength={40}
              />
            </div>
            <div>
              <label htmlFor="k-sort" className="mb-1 block text-sm font-medium">
                Reihenfolge
              </label>
              <input
                id="k-sort"
                name="sortierung"
                className="eingabe"
                inputMode="numeric"
                placeholder="100"
                defaultValue="100"
              />
            </div>
          </div>

          {status.fehler && (
            <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
              {status.fehler}
            </p>
          )}
          {status.erfolg && (
            <p className="text-sm font-semibold text-moos">{status.erfolg}</p>
          )}

          <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
            {laeuft ? "Legt an…" : "Kategorie anlegen"}
          </button>
        </form>
      </div>
    </div>
  );
}

function KategorieZeile({
  kategorie: k,
  onFehler,
}: {
  kategorie: Kategorie;
  onFehler: (m: string | null) => void;
}) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const [bearbeiten, setBearbeiten] = useState(false);
  const [name, setName] = useState(k.name);
  const [sortierung, setSortierung] = useState(String(k.sortierung));

  if (bearbeiten) {
    return (
      <li className="flex flex-wrap items-end gap-2 p-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-leise">Name</label>
          <input
            className="eingabe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-xs font-medium text-leise">Reihenfolge</label>
          <input
            className="eingabe"
            inputMode="numeric"
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primaer !min-h-[2.75rem] !px-4 text-sm"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await kategorieUmbenennen(k.id, name, Number(sortierung) || 100);
              setBearbeiten(false);
              router.refresh();
            })
          }
        >
          Speichern
        </button>
        <button
          type="button"
          className="btn-zweit !min-h-[2.75rem] !px-3 text-sm"
          onClick={() => {
            setName(k.name);
            setSortierung(String(k.sortierung));
            setBearbeiten(false);
          }}
        >
          Zurück
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <span className="w-8 shrink-0 text-center text-sm text-leise ziffern">
        {k.sortierung}
      </span>

      <div className="min-w-0 flex-1">
        <p className={"truncate font-medium " + (k.aktiv ? "" : "text-leise")}>
          {k.name}
          {!k.aktiv && " · ausgeblendet"}
        </p>
        <p className="text-sm text-leise">
          {k.anzahl} {k.anzahl === 1 ? "Produkt" : "Produkte"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setBearbeiten(true)}
        className="rounded-weich border border-linie px-2.5 py-2 text-xs font-semibold transition hover:bg-honigHell"
      >
        Bearbeiten
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={k.aktiv}
        aria-label={`${k.name} ${k.aktiv ? "ausblenden" : "einblenden"}`}
        title={k.aktiv ? "Im Shop sichtbar" : "Ausgeblendet"}
        disabled={laeuft}
        onClick={() =>
          starte(async () => {
            await kategorieAktivUmschalten(k.id, !k.aktiv);
            router.refresh();
          })
        }
        className={
          "relative h-8 w-14 shrink-0 rounded-full transition " +
          (k.aktiv ? "bg-moos" : "bg-linie")
        }
      >
        <span
          className={
            "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
            (k.aktiv ? "left-7" : "left-1")
          }
        />
      </button>

      <button
        type="button"
        aria-label={`${k.name} löschen`}
        title="Löschen"
        disabled={laeuft}
        onClick={() => {
          if (!confirm(`Kategorie „${k.name}" löschen?`)) return;
          starte(async () => {
            onFehler(null);
            const r = await kategorieLoeschen(k.id);
            if (!r.ok && r.fehler) onFehler(r.fehler);
            router.refresh();
          });
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-weich text-leise transition hover:bg-beere/10 hover:text-beere"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M4 6h12M8 6V4.5h4V6m-6 0 .7 10a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4L14 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
