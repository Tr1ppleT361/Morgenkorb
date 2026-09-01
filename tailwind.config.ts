import type { Config } from "tailwindcss";

/**
 * Die Farben stehen NICHT hier, sondern als CSS-Variablen in globals.css.
 * Vorteil: hell und dunkel werden dort einmal festgelegt, und im JSX steht
 * einfach `bg-karte` statt `bg-white dark:bg-slate-900`.
 *
 * Das `<alpha-value>` sorgt dafür, dass Abstufungen wie `bg-karte/60`
 * weiterhin funktionieren.
 */
const farbe = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        grund: farbe("grund"), // Seitenhintergrund (warmes Papier)
        karte: farbe("karte"), // Kartenflächen
        linie: farbe("linie"), // Trennlinien und Rahmen
        tinte: farbe("tinte"), // Haupttext
        leise: farbe("leise"), // Nebentext
        honig: farbe("honig"), // Hauptakzent (warmes Orange)
        honigHell: farbe("honig-hell"),
        ziegel: farbe("ziegel"), // kräftiger Akzent für Knöpfe
        moos: farbe("moos"), // "erledigt" / "bezahlt"
        beere: farbe("beere"), // Hinweise und Warnungen
      },
      fontFamily: {
        // Werden in layout.tsx geladen und als CSS-Variable gesetzt
        titel: ["var(--font-titel)", "Georgia", "serif"],
        text: ["var(--font-text)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Etwas weichere, ungleichmäßigere Rundungen wirken handgemachter
        weich: "0.875rem",
        korb: "1.25rem",
      },
      boxShadow: {
        // Sehr weiche, warme Schatten statt harter grauer Kanten
        sanft: "0 1px 2px rgb(74 52 32 / 0.06), 0 6px 16px -8px rgb(74 52 32 / 0.14)",
        gehoben: "0 2px 4px rgb(74 52 32 / 0.08), 0 14px 30px -12px rgb(74 52 32 / 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
