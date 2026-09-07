/**
 * Die Produktsuche.
 *
 * Sie soll drei Dinge können:
 *  1. Sorten mitfinden: "Monster Mango" findet Monster Energy mit der
 *     Sorte "Mango Loco".
 *  2. Tippfehler verzeihen: "Snikers" findet Snickers.
 *  3. Umlaute egal: "kasegeback" findet Käsegebäck.
 */

/** Macht aus Text etwas gut Vergleichbares: klein, ohne Umlaute, ohne Zeichen. */
export function normalisieren(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    // Akzente entfernen (é -> e)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // alles außer Buchstaben und Ziffern zu Leerzeichen
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Zerlegt in einzelne Wörter. */
export function woerter(text: string): string[] {
  const n = normalisieren(text);
  return n ? n.split(" ") : [];
}

/**
 * Wie viele Änderungen braucht es von a nach b?
 * (Levenshtein-Abstand – "Snikers" -> "Snickers" ist 1.)
 *
 * Wir brechen ab, sobald der Abstand größer als `grenze` ist. Das macht
 * die Suche über viele Produkte schnell genug.
 */
export function abstand(a: string, b: string, grenze = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > grenze) return grenze + 1;

  let vorherige = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const aktuelle = [i];
    let kleinste = i;

    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      const wert = Math.min(
        aktuelle[j - 1] + 1, // einfügen
        vorherige[j] + 1, // löschen
        vorherige[j - 1] + kosten, // ersetzen
      );
      aktuelle.push(wert);
      if (wert < kleinste) kleinste = wert;
    }

    // Ganze Zeile schon über der Grenze? Dann wird es nicht mehr besser.
    if (kleinste > grenze) return grenze + 1;
    vorherige = aktuelle;
  }

  return vorherige[b.length];
}

/** Wie viele Tippfehler erlauben wir bei einem Wort dieser Länge? */
function toleranz(wort: string): number {
  if (wort.length <= 3) return 0; // "cola" nicht mit "kola" verwechseln
  if (wort.length <= 6) return 1;
  return 2;
}

/**
 * Passt ein Suchwort zu irgendeinem Wort im Produkttext?
 * Gibt eine Punktzahl zurück: höher ist besser, 0 heißt "passt nicht".
 */
function wortTreffer(suchwort: string, ziele: string[]): number {
  let beste = 0;

  for (const ziel of ziele) {
    if (ziel === suchwort) {
      beste = Math.max(beste, 100); // exakt
    } else if (ziel.startsWith(suchwort)) {
      beste = Math.max(beste, 80); // Wortanfang – "mons" -> "monster"
    } else if (suchwort.length >= 3 && ziel.includes(suchwort)) {
      beste = Math.max(beste, 55); // irgendwo drin
    } else {
      const t = toleranz(suchwort);
      if (t > 0) {
        const d = abstand(suchwort, ziel, t);
        if (d <= t) beste = Math.max(beste, 45 - d * 10); // Tippfehler
      }
    }
  }

  return beste;
}

export type Durchsuchbar = {
  name: string;
  kategorie: string;
  varianten?: { name: string }[];
  /** Merkmale wie "zuckerfrei" – als Liste oder als kommagetrennter Text */
  merkmale?: string[] | string | null;
};

/**
 * Bewertet ein Produkt gegen die Suchanfrage.
 * 0 = passt nicht. Je höher, desto besser.
 *
 * Wichtig: ALLE Suchwörter müssen irgendwo passen. Sonst würde
 * "Monster Mango" auch jedes andere Monster finden.
 */
export function bewerten(produkt: Durchsuchbar, anfrage: string): number {
  const suchwoerter = woerter(anfrage);
  if (suchwoerter.length === 0) return 1;

  // Alle Wörter, die zu diesem Produkt gehören – inklusive Sorten
  const ziele = [
    ...woerter(produkt.name),
    ...woerter(produkt.kategorie),
    ...(produkt.varianten ?? []).flatMap((v) => woerter(v.name)),
    ...woerter(
      Array.isArray(produkt.merkmale)
        ? produkt.merkmale.join(" ")
        : (produkt.merkmale ?? ""),
    ),
  ];

  let summe = 0;
  for (const wort of suchwoerter) {
    const punkte = wortTreffer(wort, ziele);
    if (punkte === 0) return 0; // ein Wort passt gar nicht -> raus
    summe += punkte;
  }

  // Treffer direkt im Namen sind mehr wert als in der Kategorie
  const imNamen = woerter(produkt.name);
  const namensBonus = suchwoerter.every((w) => wortTreffer(w, imNamen) > 0)
    ? 50
    : 0;

  return summe / suchwoerter.length + namensBonus;
}

/** Welche Sorte passt am besten zur Anfrage? Für die Vorauswahl. */
export function besteVariante(
  varianten: { id: number; name: string }[],
  anfrage: string,
): number | null {
  const suchwoerter = woerter(anfrage);
  if (suchwoerter.length === 0) return null;

  let beste: { id: number; punkte: number } | null = null;
  for (const v of varianten) {
    const ziele = woerter(v.name);
    let punkte = 0;
    for (const w of suchwoerter) punkte += wortTreffer(w, ziele);
    if (punkte > 0 && (!beste || punkte > beste.punkte))
      beste = { id: v.id, punkte };
  }
  return beste?.id ?? null;
}
