"use client";

import type { Produkt } from "@/app/page";
import { euro } from "@/lib/geld";
import { KategorieIcon, kategorieTon } from "./KategorieIcon";

/**
 * Eine Produktkachel wie in einem Online-Shop:
 * oben das Bild, darunter Name, Preis und der Knopf zum Hinzufügen.
 *
 * Die Höhe ändert sich nicht, wenn etwas in den Korb wandert – sonst würde
 * das ganze Raster beim Antippen springen.
 */
export function ProduktKachel({
  produkt,
  menge,
  gesperrt,
  onAendern,
}: {
  produkt: Produkt;
  menge: number;
  gesperrt: boolean;
  onAendern: (delta: number) => void;
}) {
  const imKorb = menge > 0;

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
            {menge}
          </span>
        )}
      </div>

      {/* Text und Bedienung */}
      <div className="flex flex-1 flex-col px-3 pb-2.5 pt-2">
        <h3 className="line-clamp-2 text-[0.9rem] font-semibold leading-snug">
          {produkt.name}
        </h3>

        <div className="mt-auto flex h-10 items-center justify-between gap-1.5 pt-2">
          <p className="font-titel text-[1.05rem] font-bold leading-none ziffern">
            {euro(produkt.preis)}
          </p>

          {imKorb ? (
            // Kompakte Mengenauswahl
            <div className="flex items-center gap-0.5 rounded-full border border-linie bg-grund p-0.5">
              <RundKnopf
                zeichen="minus"
                label={`Ein ${produkt.name} weniger`}
                disabled={gesperrt}
                onClick={() => onAendern(-1)}
              />
              <span className="w-5 text-center text-sm font-bold ziffern">
                {menge}
              </span>
              <RundKnopf
                zeichen="plus"
                label={`Ein ${produkt.name} mehr`}
                disabled={gesperrt}
                onClick={() => onAendern(1)}
                betont
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={gesperrt}
              onClick={() => onAendern(1)}
              aria-label={`Ein ${produkt.name} mehr`}
              title="In den Korb"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-honig/35 bg-honigHell text-ziegel transition hover:border-honig hover:bg-honig hover:text-white active:translate-y-px disabled:opacity-40 disabled:hover:bg-honigHell disabled:hover:text-ziegel"
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
