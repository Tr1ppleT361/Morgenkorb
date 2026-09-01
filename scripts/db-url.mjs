/**
 * Findet die Adresse der Datenbank.
 *
 * Warum so umständlich? Vercel legt die Variable je nach Datenbank-Anbieter
 * unter verschiedenen Namen ab: mal DATABASE_URL, mal POSTGRES_PRISMA_URL,
 * mal POSTGRES_URL. Statt darauf zu hoffen, dass es der richtige Name ist,
 * schauen wir einfach der Reihe nach nach.
 */

/** Namen für den normalen Betrieb (Abfragen). Pooled ist hier besser. */
const FUER_ABFRAGEN = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

/**
 * Namen zum Anlegen der Tabellen.
 * Hier ist eine direkte ("unpooled") Verbindung besser, weil Änderungen am
 * Tabellen-Aufbau über einen Verbindungs-Pool schiefgehen können.
 */
const FUER_TABELLEN = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
];

/** Sucht den ersten Namen, der einen nicht-leeren Wert hat. */
function ersteAdresse(namen, env = process.env) {
  for (const name of namen) {
    const wert = env[name];
    if (wert && wert.trim() !== "") return { name, wert: wert.trim() };
  }
  return null;
}

export function adresseFuerAbfragen(env = process.env) {
  return ersteAdresse(FUER_ABFRAGEN, env);
}

export function adresseFuerTabellen(env = process.env) {
  return ersteAdresse(FUER_TABELLEN, env);
}

export { FUER_ABFRAGEN, FUER_TABELLEN };
