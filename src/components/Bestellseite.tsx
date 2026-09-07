"use client";

/**
 * Die Bestellseite: Suche, Kategorien, Produktkacheln und Warenkorb.
 * "use client" = läuft im Browser, denn hier wird geklickt.
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Gruppe, Produkt } from "@/app/page";
import type { FensterStatus } from "@/lib/bestellschluss";
import { schluessel, zerlegen } from "@/lib/warenkorb";
import { bewerten } from "@/lib/suche";
import {
  angesehenLesen,
  angesehenMerken,
  favoritUmschalten,
  favoritenLesen,
} from "@/lib/merken";
import { Rueckgaengig } from "./Rueckgaengig";
import { HerzZeichen } from "./ProduktKachel";
import { euro } from "@/lib/geld";
import { config } from "@/config";
import { bestellungAufgeben } from "@/app/actions";
import { zahlungStarten } from "@/app/zahlung/actions";
import { ProduktKachel, SortenFenster, Zeichen } from "./ProduktKachel";
import { KategorieIcon, kategorieTon } from "./KategorieIcon";
import { KorbZeichen } from "./Logo";

/** Warenkorb: Schlüssel (siehe lib/warenkorb.ts) -> Menge */
type Warenkorb = Record<string, number>;

const SPEICHER_KEY = "morgenkorb_warenkorb";

/** Aus "Kaugummi & Bonbons" wird "kaugummi-bonbons" – für Sprungmarken. */
function alsAnker(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function Bestellseite({
  gruppen,
  fenster,
  nutzer,
  karteMoeglich = false,
  limitCent = 0,
  abholOrt = "",
  abholZeit = "",
}: {
  gruppen: Gruppe[];
  fenster: FensterStatus;
  /** Angemeldeter Nutzer – dann sind Name und Klasse schon ausgefüllt */
  nutzer?: { name: string; klasse: string } | null;
  /** Ist Stripe eingerichtet? Nur dann gibt es die Kartenzahlung. */
  karteMoeglich?: boolean;
  /** Höchstbetrag pro Bestellung in Cent. 0 = kein Limit. */
  limitCent?: number;
  abholOrt?: string;
  abholZeit?: string;
}) {
  const offen = fenster.offen;
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [warenkorb, setWarenkorb] = useState<Warenkorb>({});
  const [korbOffen, setKorbOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sendet, starteSenden] = useTransition();

  const [sortenProdukt, setSortenProdukt] = useState<Produkt | null>(null);
  const [favoriten, setFavoriten] = useState<number[]>([]);
  const [angesehen, setAngesehen] = useState<number[]>([]);
  const [ansicht, setAnsicht] = useState<"alle" | "favoriten" | "angesehen">("alle");
  const [merkmalFilter, setMerkmalFilter] = useState<string | null>(null);
  const [sortierung, setSortierung] = useState<"standard" | "preis" | "name" | "beliebt">("standard");
  const [letzteAktion, setLetzteAktion] = useState<
    { key: string; delta: number; text: string } | null
  >(null);
  const [zahlart, setZahlart] = useState<"BAR" | "KARTE">("BAR");
  const [ersatzRegel, setErsatzRegel] = useState<
    "WEGLASSEN" | "ERSATZ" | "RUECKSPRACHE"
  >("WEGLASSEN");
  const [name, setName] = useState(nutzer?.name ?? "");
  const [klasse, setKlasse] = useState(nutzer?.klasse ?? "");
  const [notiz, setNotiz] = useState("");

  // Warenkorb und Namen aus dem Browser-Speicher holen
  useEffect(() => {
    try {
      const roh = localStorage.getItem(SPEICHER_KEY);
      if (roh) setWarenkorb(JSON.parse(roh));
      setFavoriten(favoritenLesen());
      setAngesehen(angesehenLesen());
      // Nur nachfüllen, wenn wir die Daten nicht schon vom Konto haben
      if (!nutzer) {
        setName(localStorage.getItem("morgenkorb_name") ?? "");
        setKlasse(localStorage.getItem("morgenkorb_klasse") ?? "");
      }
    } catch {
      /* egal, dann eben leer */
    }
  }, [nutzer]);

  useEffect(() => {
    try {
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(warenkorb));
    } catch {
      /* z. B. Privatmodus – nicht schlimm */
    }
  }, [warenkorb]);

  // Solange der Warenkorb offen ist, soll die Seite dahinter nicht scrollen
  useEffect(() => {
    document.body.style.overflow = korbOffen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [korbOffen]);

  const alleProdukte = useMemo(() => gruppen.flatMap((g) => g.produkte), [gruppen]);
  const produktMap = useMemo(
    () => new Map(alleProdukte.map((p) => [p.id, p])),
    [alleProdukte],
  );

  // Welche Merkmale kommen im Sortiment überhaupt vor?
  const alleMerkmale = useMemo(() => {
    const menge = new Set<string>();
    for (const p of alleProdukte) {
      p.merkmale.forEach((m) => menge.add(m));
      p.varianten.forEach((v) => v.merkmale.forEach((m) => menge.add(m)));
    }
    return [...menge].sort();
  }, [alleProdukte]);

  /**
   * Produkte filtern und sortieren.
   * Reihenfolge: Ansicht (alle/Favoriten/zuletzt) -> Merkmal -> Suche -> Sortierung
   */
  const gefiltert = useMemo(() => {
    const q = suche.trim();

    // 1) Grundmenge je nach Ansicht
    let basis = alleProdukte;
    if (ansicht === "favoriten") {
      basis = alleProdukte.filter((p) => favoriten.includes(p.id));
    } else if (ansicht === "angesehen") {
      // in der Reihenfolge des Ansehens
      basis = angesehen
        .map((id) => produktMap.get(id))
        .filter((p): p is Produkt => Boolean(p));
    }

    // 2) Merkmal-Filter (zuckerfrei, vegan, ...)
    if (merkmalFilter) {
      basis = basis.filter(
        (p) =>
          p.merkmale.includes(merkmalFilter) ||
          p.varianten.some((v) => v.merkmale.includes(merkmalFilter)),
      );
    }

    // 3) Suche mit Tippfehlertoleranz
    let treffer: { produkt: Produkt; punkte: number }[];
    if (q) {
      treffer = basis
        .map((p) => ({ produkt: p, punkte: bewerten(p, q) }))
        .filter((t) => t.punkte > 0);
    } else {
      treffer = basis.map((p) => ({ produkt: p, punkte: 0 }));
    }

    // 4) Sortieren
    if (sortierung === "preis") {
      treffer.sort((a, b) => a.produkt.preis - b.produkt.preis);
    } else if (sortierung === "name") {
      treffer.sort((a, b) => a.produkt.name.localeCompare(b.produkt.name, "de"));
    } else if (sortierung === "beliebt") {
      treffer.sort((a, b) => b.produkt.bestellt - a.produkt.bestellt);
    } else if (q) {
      // Standard bei Suche: bester Treffer zuerst
      treffer.sort((a, b) => b.punkte - a.punkte);
    }

    return treffer.map((t) => t.produkt);
  }, [
    alleProdukte,
    produktMap,
    suche,
    ansicht,
    favoriten,
    angesehen,
    merkmalFilter,
    sortierung,
  ]);

  /**
   * Für die Anzeige: nach Kategorie gruppieren – außer wenn gesucht,
   * gefiltert oder sortiert wird. Dann ist eine flache Liste sinnvoller.
   */
  const flach =
    Boolean(suche.trim()) ||
    ansicht !== "alle" ||
    merkmalFilter !== null ||
    sortierung !== "standard";

  const anzeigeGruppen = useMemo(() => {
    if (!flach) {
      // Ursprüngliche Kategoriegruppen, aber nur mit den gefilterten Produkten
      const erlaubt = new Set(gefiltert.map((p) => p.id));
      return gruppen
        .map((g) => ({
          kategorie: g.kategorie,
          produkte: g.produkte.filter((p) => erlaubt.has(p.id)),
        }))
        .filter((g) => g.produkte.length > 0);
    }
    const titel =
      ansicht === "favoriten"
        ? "Deine Favoriten"
        : ansicht === "angesehen"
          ? "Zuletzt angesehen"
          : suche.trim()
            ? `Treffer für „${suche.trim()}"`
            : "Alle Produkte";
    return gefiltert.length ? [{ kategorie: titel, produkte: gefiltert }] : [];
  }, [flach, gefiltert, gruppen, ansicht, suche]);

  // Aus den Schlüsseln im Warenkorb die echten Produkte und Sorten holen
  const positionen = useMemo(() => {
    const liste: {
      key: string;
      produkt: Produkt;
      variante: { id: number; name: string; preis: number } | null;
      menge: number;
      preis: number;
    }[] = [];

    for (const [key, menge] of Object.entries(warenkorb)) {
      if (menge <= 0) continue;
      const teile = zerlegen(key);
      if (!teile) continue;
      const produkt = produktMap.get(teile.productId);
      if (!produkt) continue;

      const variante = teile.variantId
        ? (produkt.varianten.find((v) => v.id === teile.variantId) ?? null)
        : null;

      // Sorte gewählt, gibt es aber nicht mehr -> Eintrag überspringen
      if (teile.variantId && !variante) continue;

      liste.push({
        key,
        produkt,
        variante,
        menge,
        preis: variante ? variante.preis : produkt.preis,
      });
    }

    return liste.sort((a, b) =>
      `${a.produkt.name} ${a.variante?.name ?? ""}`.localeCompare(
        `${b.produkt.name} ${b.variante?.name ?? ""}`,
        "de",
      ),
    );
  }, [warenkorb, produktMap]);

  const anzahl = positionen.reduce((s, p) => s + p.menge, 0);
  const summe = positionen.reduce((s, p) => s + p.menge * p.preis, 0);

  function aendern(key: string, delta: number, name?: string) {
    setFehler(null);
    // Nur beim Hinzufügen eine Rückgängig-Leiste zeigen
    if (delta > 0 && name) {
      setLetzteAktion({ key, delta, text: `${name} hinzugefügt` });
    }
    setWarenkorb((alt) => {
      const neu = { ...alt };
      const menge = Math.min(
        config.maxMengeProProdukt,
        Math.max(0, (neu[key] ?? 0) + delta),
      );
      if (menge === 0) delete neu[key];
      else neu[key] = menge;
      return neu;
    });
  }

  /** Macht das letzte Hinzufügen rückgängig. */
  function rueckgaengig() {
    if (!letzteAktion) return;
    setWarenkorb((alt) => {
      const neu = { ...alt };
      const menge = Math.max(0, (neu[letzteAktion.key] ?? 0) - letzteAktion.delta);
      if (menge === 0) delete neu[letzteAktion.key];
      else neu[letzteAktion.key] = menge;
      return neu;
    });
    setLetzteAktion(null);
  }

  function herzUmschalten(produktId: number) {
    setFavoriten(favoritUmschalten(produktId));
  }

  function angesehenSetzen(produktId: number) {
    setAngesehen(angesehenMerken(produktId));
  }

  function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);

    starteSenden(async () => {
      const ergebnis = await bestellungAufgeben({
        name,
        klasse,
        notiz,
        zahlart,
        ersatzRegel,
        positionen: positionen.map((p) => ({
          productId: p.produkt.id,
          variantId: p.variante?.id ?? null,
          menge: p.menge,
        })),
      });

      if (!ergebnis.ok) {
        setFehler(ergebnis.fehler);
        return;
      }

      try {
        localStorage.setItem("morgenkorb_name", name.trim());
        localStorage.setItem("morgenkorb_klasse", klasse.trim());
        localStorage.removeItem(SPEICHER_KEY);
      } catch {
        /* egal */
      }

      // Bei Kartenzahlung geht es weiter zu Stripe
      if (zahlart === "KARTE") {
        const zahlung = await zahlungStarten(ergebnis.orderId);
        if (zahlung.ok) {
          window.location.href = zahlung.url;
          return;
        }
        // Klappt nicht? Bestellung steht trotzdem – dann eben bar.
        router.push(
          `/bestellung/${ergebnis.orderId}?zahlfehler=${encodeURIComponent(zahlung.fehler)}`,
        );
        return;
      }

      router.push(`/bestellung/${ergebnis.orderId}`);
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-36 pt-4">
      {offen ? <Begruessung fenster={fenster} /> : <GeschlossenHinweis fenster={fenster} />}

      {/* Suche + Kategorien, bleiben beim Scrollen oben kleben */}
      <div className="sticky top-[69px] z-20 -mx-4 bg-grund/90 px-4 pb-3 pt-3 backdrop-blur-md">
        <div className="relative">
          <LupenZeichen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-leise" />
          <input
            type="search"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Wonach ist dir? z. B. Hanuta"
            className="eingabe pl-11"
            aria-label="Produkte suchen"
          />
        </div>

        {/* Ansicht, Merkmale und Sortierung */}
        <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip aktiv={ansicht === "alle"} onClick={() => setAnsicht("alle")}>
            Alle
          </Chip>
          <Chip
            aktiv={ansicht === "favoriten"}
            onClick={() => setAnsicht("favoriten")}
          >
            <HerzZeichen gefuellt={ansicht === "favoriten"} className="h-3.5 w-3.5" />
            Favoriten
            {favoriten.length > 0 && (
              <span className="ziffern">({favoriten.length})</span>
            )}
          </Chip>
          {angesehen.length > 0 && (
            <Chip
              aktiv={ansicht === "angesehen"}
              onClick={() => setAnsicht("angesehen")}
            >
              Zuletzt angesehen
            </Chip>
          )}

          {alleMerkmale.map((m) => (
            <Chip
              key={m}
              aktiv={merkmalFilter === m}
              onClick={() => setMerkmalFilter(merkmalFilter === m ? null : m)}
            >
              {m}
            </Chip>
          ))}

          {/* Sortierung */}
          <label className="flex shrink-0 items-center gap-1.5 rounded-full border border-linie bg-karte py-2 pl-3 pr-2 text-sm font-semibold">
            <span className="text-leise">Sortieren</span>
            <select
              value={sortierung}
              onChange={(e) =>
                setSortierung(e.target.value as typeof sortierung)
              }
              className="bg-transparent text-sm font-semibold outline-none"
              aria-label="Produkte sortieren"
            >
              <option value="standard">Standard</option>
              <option value="preis">Preis</option>
              <option value="name">Name</option>
              <option value="beliebt">Meistbestellt</option>
            </select>
          </label>
        </div>

        {!suche && ansicht === "alle" && !merkmalFilter && sortierung === "standard" && (
          <nav className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gruppen.map((g) => (
              <a
                key={g.kategorie}
                href={`#${alsAnker(g.kategorie)}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-linie bg-karte py-2 pl-2 pr-3.5 text-sm font-semibold transition hover:border-honig hover:bg-honigHell"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center"
                  style={{ color: kategorieTon(g.kategorie) }}
                >
                  <KategorieIcon kategorie={g.kategorie} className="h-5 w-5" />
                </span>
                {g.kategorie}
              </a>
            ))}
          </nav>
        )}
      </div>

      {anzeigeGruppen.length === 0 && (
        <p className="py-16 text-center text-leise">
          {ansicht === "favoriten"
            ? "Du hast noch nichts mit dem Herz markiert."
            : ansicht === "angesehen"
              ? "Du hast dir noch nichts angeschaut."
              : `Nichts gefunden für „${suche}".`}
        </p>
      )}

      {anzeigeGruppen.map((gruppe) => (
        <section
          key={gruppe.kategorie}
          id={alsAnker(gruppe.kategorie)}
          className="mt-6 scroll-mt-[150px]"
        >
          <div className="mb-3 flex items-baseline gap-2.5">
            <h2 className="font-titel text-xl font-bold">{gruppe.kategorie}</h2>
            <span className="h-px flex-1 bg-linie" />
            <span className="etikett">{gruppe.produkte.length}</span>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gruppe.produkte.map((p) => (
              <ProduktKachel
                key={p.id}
                produkt={p}
                mengen={warenkorb}
                gesperrt={!offen}
                favorit={favoriten.includes(p.id)}
                onAendern={(key, delta) => aendern(key, delta, p.name)}
                onSortenWaehlen={(prod) => {
                  angesehenSetzen(prod.id);
                  setSortenProdukt(prod);
                }}
                onFavorit={herzUmschalten}
                onAnsehen={angesehenSetzen}
              />
            ))}
          </ul>
        </section>
      ))}

      <KorbLeiste
        anzahl={anzahl}
        summe={summe}
        offen={offen}
        onOeffnen={() => setKorbOffen(true)}
      />

      {/* Kurz nach dem Hinzufügen: Rückgängig anbieten */}
      {letzteAktion && !korbOffen && (
        <Rueckgaengig
          text={letzteAktion.text}
          onRueckgaengig={rueckgaengig}
          onSchliessen={() => setLetzteAktion(null)}
        />
      )}

      {/* Sortenauswahl für Produkte mit mehreren Geschmacksrichtungen */}
      {sortenProdukt && (
        <SortenFenster
          produkt={sortenProdukt}
          mengen={warenkorb}
          gesperrt={!offen}
          onAendern={aendern}
          onSchliessen={() => setSortenProdukt(null)}
        />
      )}

      {korbOffen && (
        <KorbFenster
          positionen={positionen}
          summe={summe}
          anzahl={anzahl}
          name={name}
          klasse={klasse}
          notiz={notiz}
          fehler={fehler}
          sendet={sendet}
          setName={setName}
          setKlasse={setKlasse}
          setNotiz={setNotiz}
          angemeldet={Boolean(nutzer)}
          karteMoeglich={karteMoeglich}
          zahlart={zahlart}
          setZahlart={setZahlart}
          ersatzRegel={ersatzRegel}
          setErsatzRegel={setErsatzRegel}
          limitCent={limitCent}
          abholOrt={abholOrt}
          abholZeit={abholZeit}
          onSchliessen={() => setKorbOffen(false)}
          onAendern={aendern}
          onAbsenden={absenden}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ Teile */

function Begruessung({ fenster }: { fenster: FensterStatus }) {
  const knapp = fenster.minutenRest > 0 && fenster.minutenRest <= 60;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="min-w-0 flex-1">
        <h1 className="font-titel text-2xl font-bold leading-tight sm:text-[1.75rem]">
          Was soll morgen im Korb sein?
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-leise">
          <span>Aussuchen, Namen dazu, fertig.</span>
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8rem] font-semibold " +
              (knapp ? "bg-beere/12 text-beere" : "bg-honigHell text-ziegel")
            }
          >
            <UhrZeichen className="h-3.5 w-3.5" />
            {knapp ? `Noch ${fenster.minutenRest} Min.` : `bis ${fenster.ende} Uhr`}
          </span>
        </p>
      </div>
      <KorbZeichen className="hidden h-16 w-16 shrink-0 text-honig opacity-25 sm:block" />
    </div>
  );
}

function GeschlossenHinweis({ fenster }: { fenster: FensterStatus }) {
  // Je nach Grund eine passende Meldung
  const { titel, text } =
    fenster.grund === "pausiert"
      ? {
          titel: "Bestellungen sind gerade pausiert",
          text: "Der Einkauf macht heute eine Pause. Stöbern geht trotzdem.",
        }
      : fenster.grund === "zu_frueh"
        ? {
            titel: `Bestellungen öffnen um ${fenster.start} Uhr`,
            text: `Täglich von ${fenster.start} bis ${fenster.ende} Uhr kannst du bestellen. Schau dich solange schon um.`,
          }
        : {
            titel: "Bestellungen für morgen sind geschlossen",
            text: `Bestellschluss ist täglich um ${fenster.ende} Uhr. Ab ${fenster.start} Uhr geht es wieder los.`,
          };

  return (
    <div className="karte flex items-start gap-4 border-beere/40 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-weich bg-beere/10 text-beere">
        <MondZeichen className="h-5 w-5" />
      </span>
      <div>
        <h1 className="font-titel text-xl font-bold">{titel}</h1>
        <p className="mt-1 text-sm text-leise">{text}</p>
      </div>
    </div>
  );
}

function KorbLeiste({
  anzahl,
  summe,
  offen,
  onOeffnen,
}: {
  anzahl: number;
  summe: number;
  offen: boolean;
  onOeffnen: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-korb border border-linie bg-karte/95 p-2.5 pl-4 shadow-gehoben backdrop-blur-md">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-weich bg-honigHell text-ziegel">
          <KorbZeichen className="h-6 w-6" />
          {anzahl > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ziegel px-1 text-[0.7rem] font-bold text-white ziffern">
              {anzahl}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-leise">
            {anzahl === 0 ? "Dein Korb ist leer" : `${anzahl} im Korb`}
          </p>
          <p className="font-titel text-xl font-bold leading-tight ziffern">
            {euro(summe)}
          </p>
        </div>

        <button
          type="button"
          className="btn-primaer shrink-0 whitespace-nowrap"
          disabled={!offen || anzahl === 0}
          onClick={onOeffnen}
        >
          {offen ? "Weiter" : "Geschlossen"}
        </button>
      </div>
    </div>
  );
}

function KorbFenster({
  positionen,
  summe,
  anzahl,
  name,
  klasse,
  notiz,
  fehler,
  sendet,
  angemeldet,
  karteMoeglich,
  zahlart,
  setZahlart,
  ersatzRegel,
  setErsatzRegel,
  limitCent,
  abholOrt,
  abholZeit,
  setName,
  setKlasse,
  setNotiz,
  onSchliessen,
  onAendern,
  onAbsenden,
}: {
  positionen: {
    key: string;
    produkt: Produkt;
    variante: { id: number; name: string; preis: number } | null;
    menge: number;
    preis: number;
  }[];
  summe: number;
  anzahl: number;
  name: string;
  klasse: string;
  notiz: string;
  fehler: string | null;
  sendet: boolean;
  angemeldet: boolean;
  karteMoeglich: boolean;
  zahlart: "BAR" | "KARTE";
  setZahlart: (z: "BAR" | "KARTE") => void;
  ersatzRegel: "WEGLASSEN" | "ERSATZ" | "RUECKSPRACHE";
  setErsatzRegel: (r: "WEGLASSEN" | "ERSATZ" | "RUECKSPRACHE") => void;
  limitCent: number;
  abholOrt: string;
  abholZeit: string;
  setName: (v: string) => void;
  setKlasse: (v: string) => void;
  setNotiz: (v: string) => void;
  onSchliessen: () => void;
  onAendern: (key: string, delta: number) => void;
  onAbsenden: (e: React.FormEvent) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-tinte/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Dein Korb"
      onClick={onSchliessen}
    >
      <div
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] border border-linie bg-grund p-4 pb-8 shadow-gehoben sm:mb-4 sm:rounded-korb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linie" />

        <div className="mb-4 flex items-center gap-2.5">
          <KorbZeichen className="h-6 w-6 text-ziegel" />
          <h2 className="font-titel text-2xl font-bold">Dein Korb</h2>
          <span className="ml-auto etikett">
            {anzahl} {anzahl === 1 ? "Teil" : "Teile"}
          </span>
        </div>

        {/* Positionen */}
        <ul className="karte divide-y divide-linie overflow-hidden">
          {positionen.map((pos) => (
            <li key={pos.key} className="flex items-center gap-3 p-3">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-weich"
                style={{ color: kategorieTon(pos.produkt.kategorie) }}
              >
                <span className="absolute inset-0 bg-current opacity-[0.12]" />
                <KategorieIcon
                  kategorie={pos.produkt.kategorie}
                  variante={pos.produkt.id}
                  className="h-7 w-7"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {pos.produkt.name}
                  {pos.variante && (
                    <span className="font-normal text-leise">
                      {" "}
                      · {pos.variante.name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-leise ziffern">
                  <span className="font-semibold text-tinte">
                    {euro(pos.menge * pos.preis)}
                  </span>
                  <span className="ml-1.5 text-xs">
                    ({euro(pos.preis)} je Stück)
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-linie bg-grund p-0.5">
                <button
                  type="button"
                  aria-label={`Ein ${pos.produkt.name} weniger`}
                  onClick={() => onAendern(pos.key, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-karte text-tinte shadow-sanft transition hover:bg-honigHell"
                >
                  <Zeichen art="minus" className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-bold ziffern">
                  {pos.menge}
                </span>
                <button
                  type="button"
                  aria-label={`Ein ${pos.produkt.name} mehr`}
                  onClick={() => onAendern(pos.key, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-honig text-white transition hover:brightness-110"
                >
                  <Zeichen art="plus" className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Summe */}
        <div className="mt-3 rounded-korb bg-honigHell px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Zusammen</span>
            <span className="font-titel text-2xl font-bold ziffern">
              {euro(summe)}
            </span>
          </div>

          {/* Restbudget bis zum Bestelllimit */}
          {limitCent > 0 && (
            <div className="mt-2.5 border-t border-ziegel/15 pt-2.5">
              <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-ziegel/15">
                <div
                  className={
                    "h-full rounded-full transition-all " +
                    (summe > limitCent ? "bg-beere" : "bg-ziegel")
                  }
                  style={{
                    width: `${Math.min(100, (summe / limitCent) * 100)}%`,
                  }}
                />
              </div>
              <p
                className={
                  "text-xs font-semibold " +
                  (summe > limitCent ? "text-beere" : "text-ziegel")
                }
              >
                {summe > limitCent
                  ? `${euro(summe - limitCent)} über dem Bestelllimit von ${euro(limitCent)}`
                  : `Noch ${euro(limitCent - summe)} bis zum Bestelllimit`}
              </p>
            </div>
          )}
        </div>

        {/* Wo und wann gibt es die Sachen? */}
        {(abholOrt || abholZeit) && (
          <div className="karte mt-3 flex items-start gap-3 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-weich bg-honigHell text-ziegel">
              <OrtZeichen className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">Abholung</p>
              <p className="text-leise">
                {[abholOrt, abholZeit].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* Formular */}
        <form onSubmit={onAbsenden} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                Dein Name
              </label>
              <input
                id="name"
                className="eingabe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={60}
                autoComplete="name"
                placeholder="z. B. Lena"
              />
            </div>
            <div>
              <label htmlFor="klasse" className="mb-1.5 block text-sm font-semibold">
                Klasse
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
          </div>

          <div>
            <label htmlFor="notiz" className="mb-1.5 block text-sm font-semibold">
              Notiz <span className="font-normal text-leise">(optional)</span>
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

          {/* Was tun, wenn etwas nicht da ist? */}
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              Wenn etwas nicht verfügbar ist
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <ZahlartKnopf
                gewaehlt={ersatzRegel === "WEGLASSEN"}
                onClick={() => setErsatzRegel("WEGLASSEN")}
                titel="Weglassen"
                text="einfach nicht mitbringen"
              />
              <ZahlartKnopf
                gewaehlt={ersatzRegel === "ERSATZ"}
                onClick={() => setErsatzRegel("ERSATZ")}
                titel="Ersatz"
                text="etwas Ähnliches"
              />
              <ZahlartKnopf
                gewaehlt={ersatzRegel === "RUECKSPRACHE"}
                onClick={() => setErsatzRegel("RUECKSPRACHE")}
                titel="Nachfragen"
                text="kurz Bescheid sagen"
              />
            </div>
          </div>

          {/* Zahlart */}
          {karteMoeglich && (
            <div>
              <p className="mb-1.5 text-sm font-semibold">Bezahlen</p>
              <div className="grid grid-cols-2 gap-2">
                <ZahlartKnopf
                  gewaehlt={zahlart === "BAR"}
                  onClick={() => setZahlart("BAR")}
                  titel="Bar"
                  text="bei der Übergabe"
                />
                <ZahlartKnopf
                  gewaehlt={zahlart === "KARTE"}
                  onClick={() => setZahlart("KARTE")}
                  titel="Karte"
                  text="sofort online"
                />
              </div>
            </div>
          )}

          {fehler && (
            <p className="rounded-weich border border-beere/40 bg-beere/10 px-4 py-3 text-sm font-semibold text-beere">
              {fehler}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              className="btn-zweit flex-1 whitespace-nowrap !px-3 text-sm"
              onClick={onSchliessen}
            >
              Weiter stöbern
            </button>
            <button
              type="submit"
              className="btn-primaer flex-[1.4]"
              disabled={sendet || anzahl === 0}
            >
              {sendet
                ? "Moment…"
                : zahlart === "KARTE"
                  ? "Weiter zur Zahlung"
                  : "Bestellen"}
            </button>
          </div>

          <p className="pt-1 text-center text-xs text-leise">
            {angemeldet ? (
              <>Du bist angemeldet – die Bestellung landet in deinem Konto.</>
            ) : (
              <>
                Bezahlt wird morgen bar bei der Übergabe.{" "}
                <a href="/registrieren?ziel=%2F" className="underline">
                  Mit Konto
                </a>{" "}
                kannst du den Status verfolgen.
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

/** Kleiner runder Filter-Knopf. */
function Chip({
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
      aria-pressed={aktiv}
      className={
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold capitalize transition " +
        (aktiv
          ? "bg-honig text-white"
          : "border border-linie bg-karte text-leise hover:bg-honigHell")
      }
    >
      {children}
    </button>
  );
}

function OrtZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path
        d="M10 18s6-4.6 6-9a6 6 0 1 0-12 0c0 4.4 6 9 6 9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.8" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/** Ein Knopf zur Wahl der Zahlart. */
function ZahlartKnopf({
  gewaehlt,
  onClick,
  titel,
  text,
}: {
  gewaehlt: boolean;
  onClick: () => void;
  titel: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={gewaehlt}
      className={
        "rounded-weich border-2 px-3 py-2.5 text-left transition " +
        (gewaehlt
          ? "border-honig bg-honigHell"
          : "border-linie bg-karte hover:border-honig/50")
      }
    >
      <span className="block text-sm font-bold">{titel}</span>
      <span className="block text-xs text-leise">{text}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ Icons */

function LupenZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UhrZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 5.8V10l2.8 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MondZeichen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
