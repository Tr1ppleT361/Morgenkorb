/**
 * Zentrale Einstellungen.
 * Hier kannst du Dinge ändern, ohne im restlichen Code suchen zu müssen.
 */
export const config = {
  /** Name, der oben auf der Seite steht */
  appName: "Morgenkorb",
  /** Kurzer Untertitel auf der Startseite */
  slogan: "Heute bestellen, morgen mitgebracht.",

  /** Bestellschluss: nach dieser Uhrzeit ist das Formular gesperrt. */
  bestellschluss: {
    stunde: 20, // 20 Uhr
    minute: 0,
  },

  /**
   * Zeitzone, in der der Bestellschluss gilt.
   * Wichtig, falls der Server irgendwo anders steht (z. B. in den USA).
   */
  zeitzone: "Europe/Berlin",

  /** Reihenfolge der Kategorien auf der Bestellseite. */
  kategorienReihenfolge: [
    "Süßes",
    "Snacks",
    "Getränke",
    "Kaugummi & Bonbons",
    "Sonstiges",
  ],

  /** Maximale Menge pro Produkt und Bestellung. */
  maxMengeProProdukt: 20,

  /** Text auf der Bestätigungsseite. */
  uebergabeHinweis: "Bitte bring den Betrag passend in bar mit.",
} as const;
