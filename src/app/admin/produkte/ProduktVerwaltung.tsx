"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { euro } from "@/lib/geld";
import {
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
          placeholder="🔍 Produkt suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => setBearbeite("neu")}
        >
          + Neu
        </button>
      </div>

      <p className="mt-3 px-1 text-sm text-slate-500 dark:text-slate-400">
        {produkte.filter((p) => p.aktiv).length} aktiv ·{" "}
        {produkte.filter((p) => !p.aktiv).length} inaktiv
      </p>

      <ul className="karte mt-2 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {gefiltert.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p
                className={
                  "truncate font-medium " + (p.aktiv ? "" : "text-slate-400")
                }
              >
                {p.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {euro(p.preis)} · {p.kategorie}
                {!p.aktiv && " · inaktiv"}
              </p>
            </div>

            <button
              type="button"
              className="btn-ghost !px-3 !py-2 text-sm"
              onClick={() => setBearbeite(p)}
            >
              Bearbeiten
            </button>

            {/* Schalter aktiv/inaktiv */}
            <button
              type="button"
              role="switch"
              aria-checked={p.aktiv}
              aria-label={`${p.name} ${p.aktiv ? "deaktivieren" : "aktivieren"}`}
              onClick={async () => {
                await produktAktivUmschalten(p.id, !p.aktiv);
                router.refresh();
              }}
              className={
                "relative h-8 w-14 shrink-0 rounded-full transition " +
                (p.aktiv ? "bg-korb-600" : "bg-slate-300 dark:bg-slate-700")
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
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 dark:bg-slate-900"
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
                Bild-URL (optional)
              </label>
              <input
                id="p-bild"
                name="bildUrl"
                className="eingabe"
                type="url"
                placeholder="https://…"
                defaultValue={produkt?.bildUrl ?? ""}
              />
            </div>

            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                name="aktiv"
                defaultChecked={produkt ? produkt.aktiv : true}
                className="h-6 w-6 accent-korb-600"
              />
              <span className="text-base">Im Shop sichtbar (aktiv)</span>
            </label>

            {status.fehler && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                {status.fehler}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-ghost flex-1" onClick={onFertig}>
                Abbrechen
              </button>
              <button type="submit" className="btn-primary flex-[2]" disabled={laeuft}>
                {laeuft ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
