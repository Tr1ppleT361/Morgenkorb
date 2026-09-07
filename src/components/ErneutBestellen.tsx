"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { schluessel } from "@/lib/warenkorb";

const SPEICHER_KEY = "morgenkorb_warenkorb";

/**
 * "Nochmal bestellen": legt die Artikel einer früheren Bestellung wieder
 * in den Warenkorb und schickt dich zur Startseite.
 *
 * Der Korb wird dabei ergänzt, nicht ersetzt – falls schon etwas drin ist.
 */
export function ErneutBestellen({
  artikel,
  klein = false,
}: {
  artikel: { productId: number; variantId: number | null; menge: number }[];
  klein?: boolean;
}) {
  const router = useRouter();
  const [fertig, setFertig] = useState(false);

  function uebernehmen() {
    try {
      const roh = localStorage.getItem(SPEICHER_KEY);
      const korb: Record<string, number> = roh ? JSON.parse(roh) : {};

      for (const a of artikel) {
        const key = schluessel(a.productId, a.variantId);
        korb[key] = Math.min(20, (korb[key] ?? 0) + a.menge);
      }

      localStorage.setItem(SPEICHER_KEY, JSON.stringify(korb));
    } catch {
      /* Privatmodus – dann eben nicht */
    }
    setFertig(true);
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={uebernehmen}
      disabled={fertig}
      className={klein ? "btn-zweit !min-h-[2.5rem] !px-3 text-sm" : "btn-zweit w-full"}
    >
      {fertig ? "Im Korb…" : "Nochmal bestellen"}
    </button>
  );
}
