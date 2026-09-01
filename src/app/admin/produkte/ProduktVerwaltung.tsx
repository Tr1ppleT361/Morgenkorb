"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { euro } from "@/lib/geld";
import {
  kategorieVeroeffentlichen,
  produktAktivUmschalten,
  produktSpeichern,
  type ProduktStatus,
} from "../actions";

type Produkt = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
  bildUrl: string | null;
  aktiv: boolean;
};

const start: ProduktStatus = {};

export function ProduktVerwaltung({
  produkte,
  kategorien,
}: {
  produkte: Produkt[];
  kategorien: string[];
}) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  // null = Formular zu, undefined-Objekt = neues Produkt
  const [bearbeite, setBearbeite] = useState<Produkt | "neu" | null>(null);

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return produkte;
    return produkte.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.kategorie.toLowerCase().includes(q),
    );
  }, [produkte, suche]);

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="search"
          className="eingabe"
          placeholder="Produkt suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        <button
          type="button"
          className="btn-primaer shrink-0"
          onClick={() => setBearbeite("neu")}
        >
          + Neu
        </button>
      </div>

      {/* Ganze Kategorie auf einmal ein-/ausblenden */}
      {!suche && (
        <div className="karte mt-3 flex flex-wrap items-center gap-2 p-3">
          <span className="etikett mr-1">Kategorie</span>
          {kategorien.map((k) => (
            <span key={k} className="flex items-center gap-1">
              <button
                type="button"
                onClick={async () => {
                  await kategorieVeroeffentlichen(k, true);
                  router.refresh();
                }}
                className="rounded-l-full border border-linie bg-karte px-2.5 py-1 text-xs font-semibold transition hover:bg-honigHell"
                title={`${k} veröffentlichen`}
              >
                {k}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await kategorieVeroeffentlichen(k, false);
                  router.refresh();
                }}
                className="-ml-1 rounded-r-full border border-linie bg-karte px-2 py-1 text-xs font-semibold text-leise transition hover:bg-honigHell"
                title={`${k} verstecken`}
              >
                aus
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 px-1 text-sm text-leise">
        {produkte.filter((p) => p.aktiv).length} veröffentlicht ·{" "}
        {produkte.filter((p) => !p.aktiv).length} versteckt
      </p>

      <ul className="karte mt-2 divide-y divide-linie overflow-hidden">
        {gefiltert.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            {/* Bildvorschau – ohne Bild ein Platzhalter */}
            {p.bildUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.bildUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded-weich border border-linie object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-weich border border-dashed border-linie text-[0.6rem] font-bold uppercase text-leise">
                Bild
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p
                className={
                  "truncate font-medium " + (p.aktiv ? "" : "text-leise")
                }
              >
                {p.name}
              </p>
              <p className="text-sm text-leise">
                {euro(p.preis)} · {p.kategorie}
                {!p.aktiv && " · versteckt"}
              </p>
            </div>

            <button
              type="button"
              className="btn-zweit !px-3 !py-2 text-sm"
              onClick={() => setBearbeite(p)}
            >
              Bearbeiten
            </button>

            {/* Schalter aktiv/inaktiv */}
            <button
              type="button"
              role="switch"
              aria-checked={p.aktiv}
              aria-label={`${p.name} ${p.aktiv ? "verstecken" : "veröffentlichen"}`}
              title={p.aktiv ? "Im Shop sichtbar" : "Versteckt"}
              onClick={async () => {
                await produktAktivUmschalten(p.id, !p.aktiv);
                router.refresh();
              }}
              className={
                "relative h-8 w-14 shrink-0 rounded-full transition " +
                (p.aktiv ? "bg-honig" : "bg-linie")
              }
            >
              <span
                className={
                  "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
                  (p.aktiv ? "left-7" : "left-1")
                }
              />
            </button>
          </li>
        ))}
      </ul>

      {bearbeite && (
        <ProduktFormular
          produkt={bearbeite === "neu" ? null : bearbeite}
          kategorien={kategorien}
          onFertig={() => {
            setBearbeite(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Formular zum Anlegen/Bearbeiten, erscheint als Overlay. */
function ProduktFormular({
  produkt,
  kategorien,
  onFertig,
}: {
  produkt: Produkt | null;
  kategorien: string[];
  onFertig: () => void;
}) {
  const [status, formAction, laeuft] = useActionState(produktSpeichern, start);
  const [bildVorschau, setBildVorschau] = useState(produkt?.bildUrl ?? "");

  // Nach erfolgreichem Speichern das Formular schließen
  useEffect(() => {
    if (status.erfolg) onFertig();
  }, [status.erfolg, onFertig]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/50"
      role="dialog"
      aria-modal="true"
      onClick={onFertig}
    >
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-linie bg-grund p-4 pb-8 shadow-gehoben"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-xl font-bold">
            {produkt ? "Produkt bearbeiten" : "Neues Produkt"}
          </h2>

          <form action={formAction} className="space-y-3">
            {/* Versteckte ID: wenn gesetzt, wird bearbeitet statt neu angelegt */}
            <input type="hidden" name="id" value={produkt?.id ?? ""} />

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="p-name">
                Name *
              </label>
              <input
                id="p-name"
                name="name"
                className="eingabe"
                defaultValue={produkt?.name ?? ""}
                required
                maxLength={80}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="p-preis">
                  Preis in € *
                </label>
                <input
                  id="p-preis"
                  name="preis"
                  className="eingabe"
                  inputMode="decimal"
                  placeholder="1,49"
                  defaultValue={
                    produkt ? (produkt.preis / 100).toFixed(2).replace(".", ",") : ""
                  }
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="p-kategorie"
                >
                  Kategorie *
                </label>
                <input
                  id="p-kategorie"
                  name="kategorie"
                  className="eingabe"
                  list="kategorien"
                  defaultValue={produkt?.kategorie ?? ""}
                  required
                />
                <datalist id="kategorien">
                  {kategorien.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="p-bild">
                Bild <span className="font-normal text-leise">(optional)</span>
              </label>
              <div className="flex items-start gap-3">
                {/* Vorschau aktualisiert sich beim Tippen */}
                {bildVorschau ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bildVorschau}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-weich border border-linie object-cover"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0.25";
                    }}
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-weich border border-dashed border-linie text-[0.6rem] font-bold uppercase text-leise">
                    Vorschau
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <input
                    id="p-bild"
                    name="bildUrl"
                    className="eingabe"
                    type="url"
                    placeholder="https://…"
                    defaultValue={produkt?.bildUrl ?? ""}
                    onChange={(e) => setBildVorschau(e.target.value.trim())}
                  />
                  <p className="mt-1 text-xs text-leise">
                    Adresse eines Bildes im Netz. Ohne Bild zeigt der Shop das
                    gezeichnete Kategorie-Motiv.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                name="aktiv"
                defaultChecked={produkt ? produkt.aktiv : true}
                className="h-6 w-6 accent-honig"
              />
              <span className="text-base">Im Shop veröffentlichen</span>
            </label>

            {status.fehler && (
              <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
                {status.fehler}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-zweit flex-1" onClick={onFertig}>
                Abbrechen
              </button>
              <button type="submit" className="btn-primaer flex-[2]" disabled={laeuft}>
                {laeuft ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
