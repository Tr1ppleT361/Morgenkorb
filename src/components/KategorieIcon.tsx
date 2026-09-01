/**
 * Kleine gezeichnete Motive je Kategorie.
 *
 * Die meisten Produkte haben kein Foto. Statt leerer grauer Kästen bekommt
 * jedes Produkt ein Motiv aus seiner Kategorie – und zwar eins von dreien,
 * damit nicht zehnmal dasselbe Bild nebeneinander steht.
 */

type Props = {
  kategorie: string;
  /** Zahl (z. B. die Produkt-ID) – daraus wird immer dasselbe Motiv gewählt */
  variante?: number;
  className?: string;
};

/** Farbton je Kategorie, passend zur Palette in globals.css */
export function kategorieTon(kategorie: string): string {
  switch (kategorie) {
    case "Süßes":
      return "rgb(var(--ziegel))";
    case "Snacks":
      return "rgb(var(--honig))";
    case "Getränke":
      return "rgb(var(--moos))";
    case "Kaugummi & Bonbons":
      return "rgb(var(--beere))";
    default:
      return "rgb(var(--leise))";
  }
}

// Gemeinsame Strich-Einstellungen für alle Motive
const s = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const fuellung = { fill: "currentColor", fillOpacity: 0.16 };
const zart = { ...s, strokeWidth: 1.4, opacity: 0.6 };

/** Alle Motive, nach Kategorie sortiert. */
const motive: Record<string, ((k: string) => React.JSX.Element)[]> = {
  "Süßes": [
    // Bonbon im Papier
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <ellipse cx="20" cy="20" rx="8" ry="6.5" {...fuellung} {...s} />
        <path d="M12 20 5 15v10l7-5Zm16 0 7-5v10l-7-5Z" {...fuellung} {...s} />
        <path d="M17.5 18.5c1.2 1 3.8 1 5 2" {...zart} />
      </svg>
    ),
    // Schokoladentafel
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <rect x="9" y="7" width="22" height="26" rx="3" {...fuellung} {...s} />
        <path d="M20 7v26M9 15.7h22M9 24.3h22" {...zart} />
      </svg>
    ),
    // Keks
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <circle cx="20" cy="20" r="12" {...fuellung} {...s} />
        <circle cx="16" cy="17" r="1.7" fill="currentColor" />
        <circle cx="24" cy="16" r="1.4" fill="currentColor" />
        <circle cx="21.5" cy="24" r="1.7" fill="currentColor" />
        <circle cx="15" cy="24" r="1.2" fill="currentColor" />
      </svg>
    ),
  ],

  "Snacks": [
    // Chipstüte
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M13 10h14l-1.5 21a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L13 10Z" {...fuellung} {...s} />
        <path d="M12 10c1.6-1.6 3-1.6 4.6 0 1.6-1.6 3-1.6 4.6 0 1.6-1.6 3-1.6 4.6 0" {...s} />
        <path d="M17 19h6M17 24h4" {...zart} />
      </svg>
    ),
    // Erdnuss
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M14 11c4 0 6 2.6 6 5.5s-3 3.5-3 6.5 3 3 3 6-2.4 5-6 5-7-3.4-7-7.6c0-2.4 1.2-3.4 1.2-5.4S7 15.6 7 14c0-1.8 3-3 7-3Z"
          {...fuellung} {...s} transform="translate(6 0)" />
        <path d="M21 18.5c1 .6 2 .6 3 0" {...zart} />
      </svg>
    ),
    // Cracker
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <rect x="8" y="8" width="24" height="24" rx="4" {...fuellung} {...s} />
        <circle cx="16" cy="16" r="1.4" fill="currentColor" />
        <circle cx="24" cy="16" r="1.4" fill="currentColor" />
        <circle cx="16" cy="24" r="1.4" fill="currentColor" />
        <circle cx="24" cy="24" r="1.4" fill="currentColor" />
        <circle cx="20" cy="20" r="1.4" fill="currentColor" />
      </svg>
    ),
  ],

  "Getränke": [
    // Flasche
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M17 5h6v4.5l2.4 3.6a5 5 0 0 1 .85 2.8V32a3 3 0 0 1-3 3h-6.5a3 3 0 0 1-3-3V15.9a5 5 0 0 1 .85-2.8L17 9.5V5Z" {...fuellung} {...s} />
        <path d="M14 21h12" {...zart} />
      </svg>
    ),
    // Dose
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <rect x="12" y="7" width="16" height="26" rx="3.5" {...fuellung} {...s} />
        <path d="M12 12h16" {...s} />
        <path d="M18 9.5h4" {...zart} />
        <path d="M16 18v8m4-8v8m4-8v8" {...zart} />
      </svg>
    ),
    // Becher zum Mitnehmen
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M12 14h16l-2 18a2 2 0 0 1-2 1.8h-8A2 2 0 0 1 14 32L12 14Z" {...fuellung} {...s} />
        <path d="M10.5 10.5h19a1.5 1.5 0 0 1 0 3.5h-19a1.5 1.5 0 0 1 0-3.5Z" {...s} />
        <path d="M22 10.5 24 5" {...zart} />
      </svg>
    ),
  ],

  "Kaugummi & Bonbons": [
    // Kaugummikugeln
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <circle cx="15" cy="16" r="6.5" {...fuellung} {...s} />
        <circle cx="25.5" cy="24.5" r="7.5" {...fuellung} {...s} />
        <path d="M12.6 14c.7-.9 1.7-1.4 2.8-1.5" {...zart} />
      </svg>
    ),
    // Dragee-Päckchen
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <rect x="13" y="6" width="14" height="28" rx="3" {...fuellung} {...s} />
        <path d="M13 12h14" {...zart} />
        <circle cx="18" cy="19" r="1.8" fill="currentColor" fillOpacity="0.7" />
        <circle cx="23" cy="24" r="1.8" fill="currentColor" fillOpacity="0.7" />
        <circle cx="18" cy="28" r="1.8" fill="currentColor" fillOpacity="0.7" />
      </svg>
    ),
    // Lutscher
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <circle cx="20" cy="16" r="9.5" {...fuellung} {...s} />
        <path d="M20 16a3.4 3.4 0 1 1 3.2-2.2" {...zart} />
        <path d="M20 25.5V34" {...s} />
      </svg>
    ),
  ],

  "Sonstiges": [
    // Croissant
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M6 25c2.5-9 8-13.5 14-13.5S31.5 16 34 25c-3-1.8-6-2.6-9-2.6H15c-3 0-6 .8-9 2.6Z" {...fuellung} {...s} />
        <path d="M15 22.4c.6-3.4 2-6 5-7.6m5 7.6c-.6-3.4-2-6-5-7.6" {...zart} />
      </svg>
    ),
    // Apfel
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M20 13c-1.6-1.4-4-2-6-1-2.6 1.3-4 4.2-4 7.6C10 26 14.6 34 18 34c1 0 1.4-.6 2-.6s1 .6 2 .6c3.4 0 8-8 8-14.4 0-3.4-1.4-6.3-4-7.6-2-1-4.4-.4-6 1Z" {...fuellung} {...s} />
        <path d="M20 12.5V8m0 0c2.2-1.6 4.2-1.6 5.5-1-.3 2.4-2.6 3.4-5.5 3Z" {...zart} />
      </svg>
    ),
    // Brötchen
    (k) => (
      <svg key={k} viewBox="0 0 40 40" fill="none" className={k} aria-hidden>
        <path d="M6 27c0-7.2 6.3-13 14-13s14 5.8 14 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" {...fuellung} {...s} />
        <path d="M14 27c0-4 1-7.4 2.6-9.6M20 27V16.4M26 27c0-4-1-7.4-2.6-9.6" {...zart} />
      </svg>
    ),
  ],
};

export function KategorieIcon({ kategorie, variante = 0, className = "" }: Props) {
  const liste = motive[kategorie] ?? motive["Sonstiges"];
  // Immer dasselbe Motiv für dasselbe Produkt – kein zufälliges Springen
  const gewaehlt = liste[Math.abs(variante) % liste.length];
  return gewaehlt(className);
}
