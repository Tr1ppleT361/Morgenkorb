"use client";

import type { Produkt } from "@/app/page";
import { euro } from "@/lib/geld";
import { schluessel } from "@/lib/warenkorb";
import { KategorieIcon, kategorieTon } from "./KategorieIcon";

/**
 * Eine Produktkachel wie in einem Online-Shop.
 *
 * Hat das Produkt mehrere Sorten (z. B. Fanta Orange / Exotic), zeigt die
 * Kachel "ab X €" und einen Knopf, der die Sortenauswahl öffnet.
 */
export function ProduktKachel({
  produkt,
  mengen,
  gesperrt,
  favorit,
  onAendern,
  onSortenWaehlen,
  onFavorit,
  onAnsehen,
}: {
  produkt: Produkt;
  /** Menge je Warenkorb-Schlüssel */
  mengen: Record<string, number>;
  gesperrt: boolean;
  favorit: boolean;
  onAendern: (key: string, delta: number) => void;
  onSortenWaehlen: (produkt: Produkt) => void;
  onFavorit: (produktId: number) => void;
  onAnsehen: (produktId: number) => void;
}) {
  const hatSorten = produkt.varianten.length > 0;

  // Wie viel von diesem Produkt liegt insgesamt im Korb?
  const gesamtMenge = hatSorten
    ? produkt.varianten.reduce(
        (s, v) => s + (mengen[schluessel(produkt.id, v.id)] ?? 0),
        0,
      )
    : (mengen[schluessel(produkt.id)] ?? 0);

  const imKorb = gesamtMenge > 0;
  const einzelSchluessel = schluessel(produkt.id);

  // Wie viel ist noch da? null heißt "unbegrenzt".
  const restBestand = hatSorten
    ? summeBestand(produkt.varianten)
    : produkt.bestand;
  const ausverkauft = restBestand !== null && restBestand <= 0;
  // Alles Verfügbare schon im Korb?
  const grenzeErreicht =
    !hatSorten && produkt.bestand !== null && gesamtMenge >= produkt.bestand;

  return (
    <li
      className={
        "group flex flex-col overflow-hidden rounded-korb border bg-karte transition " +
        (imKorb
          ? "border-honig shadow-gehoben"
          : "border-linie shadow-sanft hover:-translate-y-0.5 hover:shadow-gehoben")
      }
    >
      {/* Bildfläche */}
      <div
        className="relative h-24 w-full overflow-hidden sm:h-28"
        style={{ color: kategorieTon(produkt.kategorie) }}
      >
        {produkt.bildUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produkt.bildUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="absolute inset-0 bg-current opacity-[0.09]" />
            <span className="absolute inset-0 flex items-center justify-center">
              <KategorieIcon
                kategorie={produkt.kategorie}
                variante={produkt.id}
                className="h-14 w-14 transition-transform duration-300 group-hover:scale-110"
              />
            </span>
          </>
        )}

        {imKorb && (
          <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-honig px-1.5 text-xs font-bold text-white ziffern shadow-sanft">
            {gesamtMenge}
          </span>
        )}

        {hatSorten && (
          <span className="absolute left-2 top-2 rounded-full bg-karte/90 px-2 py-0.5 text-[0.65rem] font-bold text-leise backdrop-blur">
            {produkt.varianten.length} Sorten
          </span>
        )}

        {/* Herz zum Merken */}
        <button
          type="button"
          aria-pressed={favorit}
          aria-label={
            favorit
              ? `${produkt.name} aus Favoriten entfernen`
              : `${produkt.name} zu Favoriten`
          }
          onClick={(e) => {
            e.stopPropagation();
            onFavorit(produkt.id);
          }}
          className={
            "absolute bottom-1.5 left-1.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition " +
            (favorit
              ? "bg-karte/90 text-beere"
              : "bg-karte/70 text-leise hover:text-beere")
          }
        >
          <HerzZeichen gefuellt={favorit} className="h-4 w-4" />
        </button>

        {ausverkauft && (
          <span className="absolute inset-0 flex items-center justify-center bg-grund/75 text-sm font-bold uppercase tracking-wide text-leise backdrop-blur-[1px]">
            Ausverkauft
          </span>
        )}
      </div>

      {/* Text und Bedienung */}
      <div className="flex flex-1 flex-col px-3 pb-2.5 pt-2">
        <button
          type="button"
          onClick={() => onAnsehen(produkt.id)}
          className="text-left"
        >
          <h3 className="line-clamp-2 text-[0.9rem] font-semibold leading-snug">
            {produkt.name}
          </h3>
        </button>

        {/* Wie viele sind noch da? Nur zeigen, wenn es knapp wird. */}
        {restBestand !== null && restBestand > 0 && restBestand <= 10 && (
          <p className="mt-0.5 text-[0.7rem] font-semibold text-ziegel">
            Noch {restBestand} {restBestand === 1 ? "Stück" : "Stück"}
          </p>
        )}

        <div className="mt-auto flex h-10 items-center justify-between gap-1.5 pt-2">
          <p className="font-titel text-[1.05rem] font-bold leading-none ziffern">
            {hatSorten && (
              <span className="mr-1 font-text text-xs font-normal text-leise">
                ab
              </span>
            )}
            {euro(produkt.preis)}
          </p>

          {hatSorten ? (
            <button
              type="button"
              disabled={gesperrt || ausverkauft}
              onClick={() => onSortenWaehlen(produkt)}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-honig/35 bg-honigHell px-3 text-xs font-bold text-ziegel transition hover:bg-honig hover:text-white disabled:opacity-40"
            >
              Sorte
              <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
                <path
                  d="m4 6 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          ) : imKorb ? (
            <div className="flex items-center gap-0.5 rounded-full border border-linie bg-grund p-0.5">
              <RundKnopf
                zeichen="minus"
                label={`Ein ${produkt.name} weniger`}
                disabled={gesperrt}
                onClick={() => onAendern(einzelSchluessel, -1)}
              />
              <span className="w-5 text-center text-sm font-bold ziffern">
                {gesamtMenge}
              </span>
              <RundKnopf
                zeichen="plus"
                label={`Ein ${produkt.name} mehr`}
                disabled={gesperrt || grenzeErreicht}
                onClick={() => onAendern(einzelSchluessel, 1)}
                betont
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={gesperrt || ausverkauft}
              onClick={() => onAendern(einzelSchluessel, 1)}
              aria-label={`Ein ${produkt.name} mehr`}
              title={ausverkauft ? "Ausverkauft" : "In den Korb"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-honig/35 bg-honigHell text-ziegel transition hover:border-honig hover:bg-honig hover:text-white active:translate-y-px disabled:opacity-40"
            >
              <Zeichen art="plus" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function RundKnopf({
  zeichen,
  label,
  disabled,
  onClick,
  betont = false,
}: {
  zeichen: "plus" | "minus";
  label: string;
  disabled: boolean;
  onClick: () => void;
  betont?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "flex h-8 w-8 items-center justify-center rounded-full transition active:translate-y-px disabled:opacity-40 " +
        (betont
          ? "bg-honig text-white"
          : "bg-karte text-tinte shadow-sanft hover:bg-honigHell")
      }
    >
      <Zeichen art={zeichen} className="h-3.5 w-3.5" />
    </button>
  );
}

export function Zeichen({
  art,
  className,
}: {
  art: "plus" | "minus";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d={art === "plus" ? "M8 3v10M3 8h10" : "M3 8h10"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Auswahlfenster für die Sorten eines Produkts. */
export function SortenFenster({
  produkt,
  mengen,
  gesperrt,
  onAendern,
  onSchliessen,
}: {
  produkt: Produkt;
  mengen: Record<string, number>;
  gesperrt: boolean;
  onAendern: (key: string, delta: number) => void;
  onSchliessen: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinte/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Sorte wählen: ${produkt.name}`}
      onClick={onSchliessen}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] border border-linie bg-grund p-4 pb-8 shadow-gehoben sm:mb-4 sm:rounded-korb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linie" />

        <div className="mb-4 flex items-center gap-3">
          <span
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-weich"
            style={{ color: kategorieTon(produkt.kategorie) }}
          >
            <span className="absolute inset-0 bg-current opacity-[0.12]" />
            <KategorieIcon
              kategorie={produkt.kategorie}
              variante={produkt.id}
              className="h-7 w-7"
            />
          </span>
          <div className="min-w-0">
            <h2 className="font-titel text-xl font-bold leading-tight">
              {produkt.name}
            </h2>
            <p className="text-sm text-leise">Welche Sorte darf es sein?</p>
          </div>
        </div>

        <ul className="karte divide-y divide-linie overflow-hidden">
          {produkt.varianten.map((v) => {
            const key = schluessel(produkt.id, v.id);
            const menge = mengen[key] ?? 0;
            const leer = v.bestand !== null && v.bestand <= 0;
            const grenze = v.bestand !== null && menge >= v.bestand;
            return (
              <li
                key={v.id}
                className={"flex items-center gap-3 p-3 " + (leer ? "opacity-55" : "")}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {v.name}
                    {leer && (
                      <span className="ml-2 rounded-full bg-leise/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-leise">
                        Ausverkauft
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-leise ziffern">
                    {euro(v.preis)}
                    {v.bestand !== null && v.bestand > 0 && v.bestand <= 10 && (
                      <span className="ml-1.5 font-semibold text-ziegel">
                        · noch {v.bestand}
                      </span>
                    )}
                  </p>
                </div>

                {menge > 0 ? (
                  <div className="flex items-center gap-0.5 rounded-full border border-linie bg-grund p-0.5">
                    <RundKnopf
                      zeichen="minus"
                      label={`Ein ${produkt.name} ${v.name} weniger`}
                      disabled={gesperrt}
                      onClick={() => onAendern(key, -1)}
                    />
                    <span className="w-6 text-center text-sm font-bold ziffern">
                      {menge}
                    </span>
                    <RundKnopf
                      zeichen="plus"
                      label={`Ein ${produkt.name} ${v.name} mehr`}
                      disabled={gesperrt || grenze}
                      onClick={() => onAendern(key, 1)}
                      betont
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={gesperrt || leer}
                    onClick={() => onAendern(key, 1)}
                    aria-label={`Ein ${produkt.name} ${v.name} mehr`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-honig/35 bg-honigHell text-ziegel transition hover:bg-honig hover:text-white disabled:opacity-40"
                  >
                    <Zeichen art="plus" className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <button type="button" className="btn-primaer mt-4 w-full" onClick={onSchliessen}>
          Fertig
        </button>
      </div>
    </div>
  );
}

/** Restbestand über alle Sorten. null, wenn mindestens eine unbegrenzt ist. */
function summeBestand(varianten: { bestand: number | null }[]): number | null {
  if (varianten.some((v) => v.bestand === null)) return null;
  return varianten.reduce((s, v) => s + (v.bestand ?? 0), 0);
}

export function HerzZeichen({
  gefuellt,
  className,
}: {
  gefuellt: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        d="M10 17s-6.5-4.2-6.5-8.3A3.7 3.7 0 0 1 10 6.2a3.7 3.7 0 0 1 6.5 2.5C16.5 12.8 10 17 10 17Z"
        fill={gefuellt ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
