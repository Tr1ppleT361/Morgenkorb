"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { euro } from "@/lib/geld";
import {
  kategorieVeroeffentlichen,
  produktAktivUmschalten,
  produktLoeschen,
  produktSpeichern,
  varianteAktivUmschalten,
  varianteLoeschen,
  varianteSpeichern,
  type ProduktStatus,
} from "../actions";

export type Variante = {
  id: number;
  name: string;
  preis: number;
  einkauf: number | null;
  aktiv: boolean;
};

export type Produkt = {
  id: number;
  name: string;
  preis: number;
  einkauf: number | null;
  bildUrl: string | null;
  aktiv: boolean;
  categoryId: number;
  kategorie: string;
  varianten: Variante[];
};

export type Kategorie = { id: number; name: string };

const start: ProduktStatus = {};

/** Marge in Prozent – hilft beim Preise setzen. */
function marge(einkauf: number | null, preis: number): number | null {
  if (!einkauf || einkauf <= 0) return null;
  return Math.round(((preis - einkauf) / einkauf) * 100);
}

export function ProduktVerwaltung({
  produkte,
  kategorien,
}: {
  produkte: Produkt[];
  kategorien: Kategorie[];
}) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [filterKategorie, setFilterKategorie] = useState<number | "alle">("alle");
  const [bearbeite, setBearbeite] = useState<Produkt | "neu" | null>(null);
  const [sorten, setSorten] = useState<Produkt | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return produkte.filter((p) => {
      if (filterKategorie !== "alle" && p.categoryId !== filterKategorie)
        return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.kategorie.toLowerCase().includes(q) ||
        p.varianten.some((v) => v.name.toLowerCase().includes(q))
      );
    });
  }, [produkte, suche, filterKategorie]);

  return (
    <div>
      {/* Suche + Neu */}
      <div className="flex gap-2">
        <input
          type="search"
          className="eingabe"
          placeholder="Produkt oder Sorte suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        <button
          type="button"
          className="btn-primaer shrink-0 !px-4"
          onClick={() => setBearbeite("neu")}
        >
          + Neu
        </button>
      </div>

      {/* Kategoriefilter */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterKnopf
          aktiv={filterKategorie === "alle"}
          onClick={() => setFilterKategorie("alle")}
        >
          Alle ({produkte.length})
        </FilterKnopf>
        {kategorien.map((k) => {
          const anzahl = produkte.filter((p) => p.categoryId === k.id).length;
          return (
            <FilterKnopf
              key={k.id}
              aktiv={filterKategorie === k.id}
              onClick={() => setFilterKategorie(k.id)}
            >
              {k.name} ({anzahl})
            </FilterKnopf>
          );
        })}
      </div>

      {/* Ganze Kategorie ein-/ausblenden */}
      {filterKategorie !== "alle" && (
        <div className="karte mt-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="etikett mr-1">Ganze Kategorie</span>
          <button
            type="button"
            className="rounded-full border border-linie bg-karte px-3 py-1.5 text-xs font-semibold transition hover:bg-honigHell"
            onClick={async () => {
              const n = await kategorieVeroeffentlichen(filterKategorie, true);
              setMeldung(`${n} Produkte veröffentlicht`);
              router.refresh();
            }}
          >
            veröffentlichen
          </button>
          <button
            type="button"
            className="rounded-full border border-linie bg-karte px-3 py-1.5 text-xs font-semibold text-leise transition hover:bg-honigHell"
            onClick={async () => {
              const n = await kategorieVeroeffentlichen(filterKategorie, false);
              setMeldung(`${n} Produkte versteckt`);
              router.refresh();
            }}
          >
            verstecken
          </button>
          <Link
            href="/admin/kategorien"
            className="ml-auto text-xs text-leise underline"
          >
            Kategorien verwalten
          </Link>
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between px-1">
        <p className="text-sm text-leise">
          {produkte.filter((p) => p.aktiv).length} veröffentlicht ·{" "}
          {produkte.filter((p) => !p.aktiv).length} versteckt
        </p>
        {meldung && (
          <p className="text-xs font-semibold text-moos">{meldung}</p>
        )}
      </div>

      <ul className="karte mt-2 divide-y divide-linie overflow-hidden">
        {gefiltert.map((p) => (
          <ProduktZeile
            key={p.id}
            produkt={p}
            onBearbeiten={() => setBearbeite(p)}
            onSorten={() => setSorten(p)}
            onFehler={setMeldung}
          />
        ))}
        {gefiltert.length === 0 && (
          <li className="p-6 text-center text-sm text-leise">
            Nichts gefunden.
          </li>
        )}
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

      {sorten && (
        <SortenFormular
          produkt={sorten}
          onFertig={() => {
            setSorten(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FilterKnopf({
  aktiv,
  onClick,
  children,
}: {
  aktiv: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition " +
        (aktiv
          ? "bg-honig text-white"
          : "border border-linie bg-karte text-leise hover:bg-honigHell")
      }
    >
      {children}
    </button>
  );
}

/** Eine Zeile in der Produktliste. */
function ProduktZeile({
  produkt: p,
  onBearbeiten,
  onSorten,
  onFehler,
}: {
  produkt: Produkt;
  onBearbeiten: () => void;
  onSorten: () => void;
  onFehler: (m: string) => void;
}) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const m = marge(p.einkauf, p.preis);

  return (
    <li className="flex items-center gap-3 px-3 py-3">
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
        <p className={"truncate font-medium " + (p.aktiv ? "" : "text-leise")}>
          {p.name}
          {p.varianten.length > 0 && (
            <span className="ml-1.5 rounded-full bg-honigHell px-1.5 py-0.5 text-[0.65rem] font-bold text-ziegel">
              {p.varianten.length} Sorten
            </span>
          )}
        </p>
        <p className="truncate text-sm text-leise">
          {euro(p.preis)}
          {p.einkauf && (
            <span className="text-xs">
              {" "}
              (EK {euro(p.einkauf)}
              {m !== null && `, +${m}%`})
            </span>
          )}{" "}
          · {p.kategorie}
          {!p.aktiv && " · versteckt"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onSorten}
          className="rounded-weich border border-linie px-2.5 py-2 text-xs font-semibold transition hover:bg-honigHell"
          title="Sorten verwalten"
        >
          Sorten
        </button>
        <button
          type="button"
          onClick={onBearbeiten}
          className="rounded-weich border border-linie px-2.5 py-2 text-xs font-semibold transition hover:bg-honigHell"
        >
          Bearbeiten
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={p.aktiv}
          aria-label={`${p.name} ${p.aktiv ? "verstecken" : "veröffentlichen"}`}
          title={p.aktiv ? "Im Shop sichtbar" : "Versteckt"}
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await produktAktivUmschalten(p.id, !p.aktiv);
              router.refresh();
            })
          }
          className={
            "relative h-8 w-14 shrink-0 rounded-full transition " +
            (p.aktiv ? "bg-moos" : "bg-linie")
          }
        >
          <span
            className={
              "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
              (p.aktiv ? "left-7" : "left-1")
            }
          />
        </button>

        <button
          type="button"
          aria-label={`${p.name} löschen`}
          title="Löschen"
          disabled={laeuft}
          onClick={() => {
            if (!confirm(`„${p.name}" endgültig löschen?`)) return;
            starte(async () => {
              const r = await produktLoeschen(p.id);
              if (!r.ok && r.fehler) onFehler(r.fehler);
              router.refresh();
            });
          }}
          className="flex h-9 w-9 items-center justify-center rounded-weich text-leise transition hover:bg-beere/10 hover:text-beere"
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
      </div>
    </li>
  );
}

/** Formular zum Anlegen/Bearbeiten eines Produkts. */
function ProduktFormular({
  produkt,
  kategorien,
  onFertig,
}: {
  produkt: Produkt | null;
  kategorien: Kategorie[];
  onFertig: () => void;
}) {
  const [status, formAction, laeuft] = useActionState(produktSpeichern, start);
  const [bildVorschau, setBildVorschau] = useState(produkt?.bildUrl ?? "");

  useEffect(() => {
    if (status.erfolg) onFertig();
  }, [status.erfolg, onFertig]);

  return (
    <Overlay titel={produkt ? "Produkt bearbeiten" : "Neues Produkt"} onSchliessen={onFertig}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={produkt?.id ?? ""} />

        <Feld id="p-name" name="name" label="Name" defaultValue={produkt?.name ?? ""} required maxLength={80} />

        <div className="grid grid-cols-2 gap-3">
          <Feld
            id="p-einkauf"
            name="einkauf"
            label="Einkauf in €"
            zusatz="(optional)"
            inputMode="decimal"
            placeholder="1,29"
            defaultValue={produkt?.einkauf ? (produkt.einkauf / 100).toFixed(2).replace(".", ",") : ""}
          />
          <Feld
            id="p-preis"
            name="preis"
            label="Verkauf in €"
            inputMode="decimal"
            placeholder="1,50"
            required
            defaultValue={produkt ? (produkt.preis / 100).toFixed(2).replace(".", ",") : ""}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="p-kat">
            Kategorie
          </label>
          <select
            id="p-kat"
            name="categoryId"
            className="eingabe"
            defaultValue={produkt?.categoryId ?? kategorien[0]?.id ?? ""}
            required
          >
            {kategorien.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="p-bild">
            Bild <span className="font-normal text-leise">(optional)</span>
          </label>
          <div className="flex items-start gap-3">
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
                Ohne Bild zeigt der Shop das gezeichnete Kategorie-Motiv.
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

        {status.fehler && <Fehler text={status.fehler} />}

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-zweit flex-1" onClick={onFertig}>
            Abbrechen
          </button>
          <button type="submit" className="btn-primaer flex-[2]" disabled={laeuft}>
            {laeuft ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

/** Sorten eines Produkts verwalten. */
function SortenFormular({
  produkt,
  onFertig,
}: {
  produkt: Produkt;
  onFertig: () => void;
}) {
  const router = useRouter();
  const [status, formAction, laeuft] = useActionState(varianteSpeichern, start);
  const [laeuftLoeschen, starte] = useTransition();

  useEffect(() => {
    if (status.erfolg) router.refresh();
  }, [status.erfolg, router]);

  return (
    <Overlay titel={`Sorten: ${produkt.name}`} onSchliessen={onFertig}>
      {produkt.varianten.length === 0 ? (
        <p className="rounded-weich bg-honigHell px-4 py-3 text-sm text-ziegel">
          Noch keine Sorten. Ohne Sorten wird das Produkt einfach mit seinem
          normalen Preis verkauft. Lege eine Sorte an, wenn es das Produkt in
          mehreren Geschmacksrichtungen gibt.
        </p>
      ) : (
        <ul className="karte divide-y divide-linie overflow-hidden">
          {produkt.varianten.map((v) => (
            <li key={v.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={"truncate font-medium " + (v.aktiv ? "" : "text-leise")}>
                  {v.name}
                  {!v.aktiv && " · versteckt"}
                </p>
                <p className="text-sm text-leise ziffern">
                  {euro(v.preis)}
                  {v.einkauf && ` (EK ${euro(v.einkauf)})`}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={v.aktiv}
                aria-label={`${v.name} ${v.aktiv ? "verstecken" : "veröffentlichen"}`}
                disabled={laeuftLoeschen}
                onClick={() =>
                  starte(async () => {
                    await varianteAktivUmschalten(v.id, !v.aktiv);
                    router.refresh();
                  })
                }
                className={
                  "relative h-7 w-12 shrink-0 rounded-full transition " +
                  (v.aktiv ? "bg-moos" : "bg-linie")
                }
              >
                <span
                  className={
                    "absolute top-1 h-5 w-5 rounded-full bg-white transition-all " +
                    (v.aktiv ? "left-6" : "left-1")
                  }
                />
              </button>
              <button
                type="button"
                aria-label={`${v.name} löschen`}
                disabled={laeuftLoeschen}
                onClick={() => {
                  if (!confirm(`Sorte „${v.name}" löschen?`)) return;
                  starte(async () => {
                    await varianteLoeschen(v.id);
                    router.refresh();
                  });
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-weich text-leise transition hover:bg-beere/10 hover:text-beere"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="productId" value={produkt.id} />
        <p className="etikett">Neue Sorte</p>
        <Feld id="v-name" name="name" label="Name der Sorte" placeholder="z. B. Exotic" required maxLength={40} />
        <div className="grid grid-cols-2 gap-3">
          <Feld id="v-einkauf" name="einkauf" label="Einkauf in €" zusatz="(optional)" inputMode="decimal" placeholder="1,29" />
          <Feld id="v-preis" name="preis" label="Verkauf in €" inputMode="decimal" placeholder="1,50" required />
        </div>
        {status.fehler && <Fehler text={status.fehler} />}
        <button type="submit" className="btn-primaer w-full" disabled={laeuft}>
          {laeuft ? "Speichert…" : "Sorte hinzufügen"}
        </button>
      </form>

      <button type="button" className="btn-zweit mt-3 w-full" onClick={onFertig}>
        Fertig
      </button>
    </Overlay>
  );
}

/* ------------------------------------------------------------- Bausteine */

function Overlay({
  titel,
  onSchliessen,
  children,
}: {
  titel: string;
  onSchliessen: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-tinte/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onSchliessen}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-linie bg-grund p-4 pb-8 shadow-gehoben sm:mb-4 sm:rounded-korb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linie" />
        <h2 className="mb-4 font-titel text-xl font-bold">{titel}</h2>
        {children}
      </div>
    </div>
  );
}

function Feld({
  id,
  label,
  zusatz,
  ...rest
}: { id: string; label: string; zusatz?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {zusatz && <span className="ml-1 font-normal text-leise">{zusatz}</span>}
      </label>
      <input id={id} className="eingabe" {...rest} />
    </div>
  );
}

function Fehler({ text }: { text: string }) {
  return (
    <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
      {text}
    </p>
  );
}
