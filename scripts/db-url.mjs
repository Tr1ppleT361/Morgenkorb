/**
 * Findet die Adresse der Datenbank in den Umgebungsvariablen.
 *
 * Warum so aufwendig? Es gibt zwei Stolperfallen:
 *
 * 1. Der Name ist je nach Anbieter anders: DATABASE_URL,
 *    POSTGRES_PRISMA_URL, POSTGRES_URL ...
 * 2. Vercel kann beim Anlegen der Datenbank ein Präfix davorsetzen.
 *    Dann heißt die Variable z. B. MorgenkorbDB_DATABASE_URL.
 *
 * Deshalb suchen wir in drei Stufen:
 *   a) exakt der erwartete Name
 *   b) irgendein Name, der auf den erwarteten Namen endet (also mit Präfix)
 *   c) als letzte Rettung: irgendeine Variable, deren Wert wie eine
 *      Postgres-Adresse aussieht
 */

/**
 * Endungen für den normalen Betrieb (Abfragen).
 * Eine "gepoolte" Verbindung ist hier besser, weil sich viele kurze
 * Anfragen eine Handvoll Verbindungen teilen.
 */
const FUER_ABFRAGEN = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

/**
 * Endungen zum Anlegen der Tabellen.
 * Hier ist eine direkte ("unpooled") Verbindung besser, weil Änderungen am
 * Tabellenaufbau über einen Verbindungs-Pool schiefgehen können.
 */
const FUER_TABELLEN = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
];

/** Sieht der Wert überhaupt nach einer Datenbank-Adresse aus? */
function istDatenbankAdresse(wert) {
  return (
    typeof wert === "string" &&
    /^(postgres|postgresql|prisma|prisma\+postgres):\/\//.test(wert.trim())
  );
}

/**
 * Sucht die passende Variable.
 * @param endungen Liste erwarteter Namen, wichtigster zuerst
 */
function suche(endungen, env) {
  // a) exakter Name
  for (const name of endungen) {
    if (istDatenbankAdresse(env[name])) {
      return { name, wert: env[name].trim() };
    }
  }

  // b) Name mit Präfix, z. B. MorgenkorbDB_DATABASE_URL
  for (const endung of endungen) {
    const treffer = Object.keys(env)
      .filter((name) => name.endsWith("_" + endung))
      .filter((name) => istDatenbankAdresse(env[name]))
      .sort(); // gleiche Kandidaten -> immer dieselbe Wahl
    if (treffer.length > 0) {
      return { name: treffer[0], wert: env[treffer[0]].trim() };
    }
  }

  // c) letzte Rettung: irgendetwas, das wie eine Postgres-Adresse aussieht
  const irgendeine = Object.keys(env)
    .filter((name) => istDatenbankAdresse(env[name]))
    .sort();
  if (irgendeine.length > 0) {
    return { name: irgendeine[0], wert: env[irgendeine[0]].trim() };
  }

  return null;
}

export function adresseFuerAbfragen(env = process.env) {
  return suche(FUER_ABFRAGEN, env);
}

export function adresseFuerTabellen(env = process.env) {
  return suche(FUER_TABELLEN, env);
}

export { FUER_ABFRAGEN, FUER_TABELLEN, istDatenbankAdresse };
