"use client";

import { useState, useTransition } from "react";
import { zahlungStarten } from "@/app/zahlung/actions";

/** Knopf, um eine offene Bestellung nachträglich mit Karte zu bezahlen. */
export function JetztBezahlen({
  orderId,
  betrag,
}: {
  orderId: string;
  betrag: string;
}) {
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn-primaer w-full"
        disabled={laeuft}
        onClick={() =>
          starte(async () => {
            setFehler(null);
            const r = await zahlungStarten(orderId);
            if (r.ok) window.location.href = r.url;
            else setFehler(r.fehler);
          })
        }
      >
        {laeuft ? "Moment…" : `${betrag} mit Karte bezahlen`}
      </button>
      {fehler && (
        <p className="mt-2 rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
          {fehler}
        </p>
      )}
      <p className="mt-2 text-center text-xs text-leise">
        Die Zahlung läuft sicher über Stripe.
      </p>
    </div>
  );
}
