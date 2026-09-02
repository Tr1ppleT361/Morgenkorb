/**
 * Vorbereitung vor `prisma db push`.
 *
 * Problem: Produkte bekommen eine Pflicht-Verknüpfung zur neuen Tabelle
 * "Category". In einer Datenbank, in der schon Produkte stehen, kann
 * Postgres so eine Pflichtspalte nicht einfach anlegen – es wüsste ja
 * nicht, was es eintragen soll.
 *
 * Deshalb machen wir das hier vorher von Hand:
 *   1. Tabelle "Category" anlegen (falls es sie noch nicht gibt)
 *   2. Für jede bisherige Kategorie-Bezeichnung eine Zeile anlegen
 *   3. Bei jedem Produkt die passende categoryId eintragen
 *
 * Danach sind alle Zeilen gefüllt und `prisma db push` kann die Spalte
 * auf "Pflicht" setzen.
 *
 * Das Skript ist absichtlich vorsichtig: Auf einer frischen Datenbank
 * macht es schlicht nichts. Mehrfaches Ausführen schadet nicht.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Gibt es diese Tabelle? */
async function tabelleDa(name) {
  const [{ da }] = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = $1
     ) AS da`,
    name,
  );
  return da;
}

/** Gibt es diese Spalte? */
async function spalteDa(tabelle, spalte) {
  const [{ da }] = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = $1 AND column_name = $2
     ) AS da`,
    tabelle,
    spalte,
  );
  return da;
}

async function main() {
  // Frische Datenbank? Dann gibt es nichts zu überführen.
  if (!(await tabelleDa("Product"))) {
    console.log("   Neue Datenbank – nichts vorzubereiten.");
    return;
  }

  const hatAlteSpalte = await spalteDa("Product", "kategorie");
  const hatNeueSpalte = await spalteDa("Product", "categoryId");

  if (!hatAlteSpalte && hatNeueSpalte) {
    console.log("   Kategorien wurden bereits überführt.");
    return;
  }
  if (!hatAlteSpalte) {
    console.log("   Keine alte Kategorie-Spalte gefunden – nichts zu tun.");
    return;
  }

  // 1) Tabelle anlegen, falls sie fehlt
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id"         SERIAL PRIMARY KEY,
      "name"       TEXT NOT NULL UNIQUE,
      "sortierung" INTEGER NOT NULL DEFAULT 100,
      "aktiv"      BOOLEAN NOT NULL DEFAULT true
    )
  `);

  // 2) Spalte anlegen – zunächst ohne Pflicht
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryId" INTEGER`,
  );

  // 3) Für jede vorhandene Bezeichnung eine Kategorie anlegen
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Category" ("name")
    SELECT DISTINCT "kategorie" FROM "Product"
    WHERE "kategorie" IS NOT NULL AND "kategorie" <> ''
    ON CONFLICT ("name") DO NOTHING
  `);

  // 4) Produkte zuordnen
  const zugeordnet = await prisma.$executeRawUnsafe(`
    UPDATE "Product" p
    SET "categoryId" = c."id"
    FROM "Category" c
    WHERE c."name" = p."kategorie" AND p."categoryId" IS NULL
  `);

  // 5) Sicherheitsnetz: Produkte ohne Kategorie kommen nach "Sonstiges"
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Category" ("name") VALUES ('Sonstiges')
    ON CONFLICT ("name") DO NOTHING
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Sonstiges')
    WHERE "categoryId" IS NULL
  `);

  console.log(`   ${zugeordnet} Produkte einer Kategorie zugeordnet.`);
}

main()
  .catch((e) => {
    console.error("❌ Vorbereitung fehlgeschlagen:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
