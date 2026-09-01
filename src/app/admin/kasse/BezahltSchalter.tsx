"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { euro } from "@/lib/geld";
import { bezahltUmschalten } from "../actions";

/** Eine Zeile in der Kasse: antippen = bezahlt / nicht bezahlt. */
export function BezahltSchalter({
  id,
  name,
  klasse,
  bezahlt,
  betrag,
  zusatz,
}: {
  id: string;
  name: string;
  klasse: string;
  bezahlt: boolean;
  betrag: number;
  zusatz?: string;
}) {
  const [istBezahlt, setIstBezahlt] = useState(bezahlt);
  const [laeuft, starte] = useTransition();
  const router = useRouter();

  function umschalten() {
    const neu = !istBezahlt;
    setIstBezahlt(neu);
    starte(async () => {
      await bezahltUmschalten(id, neu);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={laeuft}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-honigHell"
    >
      <span
        className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.6rem] border-2 transition " +
          (istBezahlt
            ? "border-moos bg-moos text-white"
            : "border-linie bg-karte text-transparent")
        }
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={
            "block truncate font-semibold " +
            (istBezahlt ? "text-leise line-through" : "")
          }
        >
          {name} <span className="font-normal text-leise">· {klasse}</span>
        </span>
        {zusatz && <span className="block text-xs text-leise">{zusatz}</span>}
      </span>

      <span
        className={
          "shrink-0 font-titel text-lg font-bold ziffern " +
          (istBezahlt ? "text-leise" : "")
        }
      >
        {euro(betrag)}
      </span>
    </button>
  );
}
