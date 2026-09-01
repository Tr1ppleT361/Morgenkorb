"use client";

/**
 * Die eigentliche Bestellseite mit Suche, Produktliste und Warenkorb.
 * "use client" = dieser Teil läuft im Browser, denn hier wird geklickt.
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Gruppe, Produkt } from "@/app/page";
import { euro } from "@/lib/geld";
import { config } from "@/config";
import { bestellungAufgeben } from "@/app/actions";

/** Warenkorb: Produkt-ID -> Menge */
type Warenkorb = Record<number, number>;

const SPEICHER_KEY = "morgenkorb_warenkorb";

export function Bestellseite({
  gruppen,
  offen,
  schlussText,
  minutenRest,
}: {
  gruppen: Gruppe[];
  offen: boolean;
  schlussText: string;
  minutenRest: number;
}) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [warenkorb, setWarenkorb] = useState<Warenkorb>({});
  const [korbOffen, setKorbOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sendet, starteSenden] = useTransition();

  // Formularfelder
  const [name, setName] = useState("");
  const [klasse, setKlasse] = useState("");
  const [notiz, setNotiz] = useState("");

  // Warenkorb und Namen aus dem Browser-Speicher laden (falls die Seite
  // zwischendurch neu geladen wurde).
  useEffect(() => {
    try {
      const roh = localStorage.getItem(SPEICHER_KEY);
      if (roh) setWarenkorb(JSON.parse(roh));
      setName(localStorage.getItem("morgenkorb_name") ?? "");
      setKlasse(localStorage.getItem("morgenkorb_klasse") ?? "");
    } catch {
      /* egal, dann eben leer */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(warenkorb));
    } catch {
      /* z. B. Privatmodus – nicht schlimm */
    }
  }, [warenkorb]);

  // Alle Produkte flach, damit wir schnell nach ID suchen können
  const alleProdukte = useMemo(
    () => gruppen.flatMap((g) => g.produkte),
    [gruppen],
  );
  const produktMap = useMemo(
    () => new Map(alleProdukte.map((p) => [p.id, p])),
    [alleProdukte],
  );

  // Suche anwenden
  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return gruppen;
    return gruppen
      .map((g) => ({
        kategorie: g.kategorie,
        produkte: g.produkte.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            g.kategorie.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.produkte.length > 0);
  }, [gruppen, suche]);

  // Warenkorb-Zusammenfassung
  const positionen = useMemo(
    () =>
      Object.entries(warenkorb)
        .map(([id, menge]) => ({ produkt: produktMap.get(Number(id)), menge }))
        .filter(
          (p): p is { produkt: Produkt; menge: number } =>
            !!p.produkt && p.menge > 0,
        )
        .sort((a, b) => a.produkt.name.localeCompare(b.produkt.name, "de")),
    [warenkorb, produktMap],
  );

  const anzahl = positionen.reduce((s, p) => s + p.menge, 0);
  const summe = positionen.reduce((s, p) => s + p.menge * p.produkt.preis, 0);

  function aendern(id: number, delta: number) {
    setFehler(null);
    setWarenkorb((alt) => {
      const neu = { ...alt };
      const menge = Math.min(
        config.maxMengeProProdukt,
        Math.max(0, (neu[id] ?? 0) + delta),
      );
      if (menge === 0) delete neu[id];
      else neu[id] = menge;
      return neu;
    });
  }

  function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);

    starteSenden(async () => {
      const ergebnis = await bestellungAufgeben({
        name,
        klasse,
        notiz,
        positionen: positionen.map((p) => ({
          productId: p.produkt.id,
          menge: p.menge,
        })),
      });

      if (!ergebnis.ok) {
        setFehler(ergebnis.fehler);
        return;
      }

      // Name/Klasse merken (spart Tippen beim nächsten Mal), Korb leeren
      try {
        localStorage.setItem("morgenkorb_name", name.trim());
        localStorage.setItem("morgenkorb_klasse", klasse.trim());
        localStorage.removeItem(SPEICHER_KEY);
      } catch {
        /* egal */
      }
      router.push(`/bestellung/${ergebnis.orderId}`);
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-40 pt-4">
      {/* Hinweis, wenn Bestellschluss vorbei ist */}
      {!offen && (
        <div className="karte mb-4 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-base font-semibold text-amber-900 dark:text-amber-200">
            🌙 Bestellungen für morgen sind geschlossen
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            Bestellschluss ist täglich um {schlussText} Uhr. Schau morgen früh
            wieder vorbei – dann kannst du für den nächsten Tag bestellen.
          </p>
        </div>
      )}

      {offen && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{config.slogan}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bestellschluss {schlussText} Uhr
            {minutenRest <= 60 && minutenRest > 0 && (
              <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">
                · nur noch {minutenRest} Min.!
              </span>
            )}
          </p>
        </div>
      )}

      {/* Suchfeld */}
      <div className="sticky top-[61px] z-20 -mx-4 bg-slate-50/95 px-4 py-3 backdrop-blur dark:bg-slate-950/95">
        <input
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="🔍 Suchen, z. B. Hanuta oder Cola"
          className="eingabe"
          aria-label="Produkte suchen"
        />
      </div>

      {/* Produktliste nach Kategorien */}
      {gefiltert.length === 0 && (
        <p className="py-10 text-center text-slate-500">
          Nichts gefunden für „{suche}“.
        </p>
      )}

      {gefiltert.map((gruppe) => (
        <section key={gruppe.kategorie} className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {gruppe.kategorie}
          </h2>
          <ul className="karte divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            {gruppe.produkte.map((p) => (
              <ProduktZeile
                key={p.id}
                produkt={p}
                menge={warenkorb[p.id] ?? 0}
                gesperrt={!offen}
                onAendern={(d) => aendern(p.id, d)}
              />
            ))}
          </ul>
        </section>
      ))}

      {/* Fixierte Warenkorb-Leiste unten */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {anzahl === 0
                ? "Warenkorb leer"
                : `${anzahl} ${anzahl === 1 ? "Artikel" : "Artikel"}`}
            </p>
            <p className="text-xl font-bold tabular-nums">{euro(summe)}</p>
          </div>
          <button
            type="button"
            className="btn-primary min-h-[52px] flex-1 whitespace-nowrap"
            disabled={!offen || anzahl === 0}
            onClick={() => setKorbOffen(true)}
          >
            {offen ? "Zum Warenkorb" : "Geschlossen"}
          </button>
        </div>
      </div>

      {/* Warenkorb-Übersicht + Formular als "Sheet" von unten */}
      {korbOffen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/50"
          role="dialog"
          aria-modal="true"
          onClick={() => setKorbOffen(false)}
        >
          <div
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-3 text-xl font-bold">Deine Bestellung</h2>

              <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
                {positionen.map(({ produkt, menge }) => (
                  <li
                    key={produkt.id}
                    className="flex items-center gap-3 py-2 text-base"
                  >
                    <span className="w-10 shrink-0 font-bold text-korb-700 dark:text-korb-400">
                      {menge}×
                    </span>
                    <span className="min-w-0 flex-1 truncate">{produkt.name}</span>
                    <span className="tabular-nums">
                      {euro(menge * produkt.preis)}
                    </span>
                    <button
                      type="button"
                      aria-label={`${produkt.name} entfernen`}
                      onClick={() => aendern(produkt.id, -menge)}
                      className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mb-5 flex items-center justify-between rounded-xl bg-korb-50 px-4 py-3 dark:bg-korb-900/30">
                <span className="font-semibold">Summe</span>
                <span className="text-2xl font-bold tabular-nums">
                  {euro(summe)}
                </span>
              </div>

              <form onSubmit={absenden} className="space-y-3">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium">
                    Dein Name *
                  </label>
                  <input
                    id="name"
                    className="eingabe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={60}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="klasse" className="mb-1 block text-sm font-medium">
                    Klasse *
                  </label>
                  <input
                    id="klasse"
                    className="eingabe"
                    value={klasse}
                    onChange={(e) => setKlasse(e.target.value)}
                    required
                    maxLength={20}
                    placeholder="z. B. 10b"
                  />
                </div>
                <div>
                  <label htmlFor="notiz" className="mb-1 block text-sm font-medium">
                    Notiz (optional)
                  </label>
                  <textarea
                    id="notiz"
                    className="eingabe"
                    rows={2}
                    maxLength={300}
                    value={notiz}
                    onChange={(e) => setNotiz(e.target.value)}
                    placeholder="z. B. lieber ohne Nüsse"
                  />
                </div>

                {fehler && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                    {fehler}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    className="btn-ghost flex-1"
                    onClick={() => setKorbOffen(false)}
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-[2]"
                    disabled={sendet || anzahl === 0}
                  >
                    {sendet ? "Wird gesendet…" : `Bestellen · ${euro(summe)}`}
                  </button>
                </div>
                <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  Bezahlt wird bar bei der Übergabe.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** Eine Zeile in der Produktliste mit Plus/Minus-Knöpfen. */
function ProduktZeile({
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
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {produkt.bildUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={produkt.bildUrl}
          alt=""
          className="h-11 w-11 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{produkt.name}</p>
        <p className="text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {euro(produkt.preis)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Ein ${produkt.name} weniger`}
          disabled={gesperrt || menge === 0}
          onClick={() => onAendern(-1)}
          className="h-11 w-11 rounded-xl border border-slate-300 text-xl font-bold transition active:scale-90 disabled:opacity-30 dark:border-slate-700"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-bold tabular-nums">
          {menge > 0 ? menge : ""}
        </span>
        <button
          type="button"
          aria-label={`Ein ${produkt.name} mehr`}
          disabled={gesperrt}
          onClick={() => onAendern(1)}
          className="h-11 w-11 rounded-xl bg-korb-600 text-xl font-bold text-white transition active:scale-90 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </li>
  );
}
