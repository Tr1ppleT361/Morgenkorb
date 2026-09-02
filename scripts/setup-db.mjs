/**
 * Bereitet die Datenbank vor. Läuft automatisch beim Deployment (siehe
 * "build" in der package.json) und lokal über `npm run setup`.
 *
 * Schritte:
 *   1. Datenbank-Adresse finden
 *   2. Prisma Client erzeugen
 *   3. Tabellen anlegen bzw. angleichen
 *   4. Die 100 Produkte einfüllen (überspringt sich, wenn schon welche da sind)
 */
import { spawnSync } from "node:child_process";
import { adresseFuerAbfragen, adresseFuerTabellen, FUER_ABFRAGEN } from "./db-url.mjs";

// Lokal steht die Adresse in der Datei .env. Auf Vercel kommen die Variablen
// direkt aus der Umgebung, dann gibt es keine .env – beides ist in Ordnung.
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const zeile of readFileSync(".env", "utf8").split("\n")) {
    const treffer = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!treffer) continue; // Kommentare und Leerzeilen überspringen
    const [, name, rohwert] = treffer;
    // Anführungszeichen aussen entfernen
    const wert = rohwert.replace(/^["']|["']$/g, "");
    if (!process.env[name]) process.env[name] = wert;
  }
}

const abfragen = adresseFuerAbfragen();
const tabellen = adresseFuerTabellen();

if (!abfragen || !tabellen) {
  console.error(`
❌ Keine Datenbank gefunden.

Gesucht wurde nach diesen Namen – auch mit Präfix davor
(z. B. MorgenkorbDB_DATABASE_URL):
${FUER_ABFRAGEN.map((n) => `   • ${n}`).join("\n")}

Keine davon ist gesetzt. So behebst du das:

  Auf Vercel:
    1. Storage → Create Database → Postgres
    2. Beim Anlegen dieses Projekt auswählen (oder später: Connect Project)
    3. Deployments → … → Redeploy

  Lokal:
    DATABASE_URL in die Datei .env eintragen (Vorlage: .env.example)
`);
  process.exit(1);
}

console.log(`🔌 Datenbank gefunden über ${abfragen.name}`);
if (tabellen.name !== abfragen.name) {
  console.log(`   (Tabellen werden über ${tabellen.name} angelegt)`);
}

/** Führt einen Befehl aus und bricht bei Fehler ab. */
function lauf(beschreibung, befehl, argumente, extraEnv = {}) {
  console.log(`\n▶ ${beschreibung}`);
  const ergebnis = spawnSync(befehl, argumente, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });
  if (ergebnis.status !== 0) {
    console.error(`\n❌ Abgebrochen bei: ${beschreibung}`);
    process.exit(ergebnis.status ?? 1);
  }
}

lauf("Prisma Client erzeugen", "npx", ["prisma", "generate"], {
  DATABASE_URL: abfragen.wert,
});

// Ältere Datenbanken auf das neue Schema vorbereiten (siehe Datei).
// Auf einer frischen Datenbank passiert hier nichts.
lauf("Datenbank vorbereiten", "node", ["scripts/vor-migration.mjs"], {
  DATABASE_URL: tabellen.wert,
});

lauf("Tabellen anlegen/angleichen", "npx", ["prisma", "db", "push", "--skip-generate"], {
  DATABASE_URL: tabellen.wert,
});

lauf("Produkte einfüllen", "npx", ["tsx", "prisma/seed.ts"], {
  DATABASE_URL: abfragen.wert,
});

console.log("\n✅ Datenbank ist bereit.");
