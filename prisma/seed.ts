/**
 * Seed-Skript: füllt die Datenbank mit dem Start-Sortiment.
 *
 * Ausführen mit:  npm run db:seed
 *
 * Die Produktliste steht in prisma/sortiment.ts (mit Einkaufspreisen),
 * die Preisberechnung in prisma/preise.ts.
 *
 * Das Skript macht nichts, wenn schon Produkte in der Datenbank stehen –
 * so überschreibt kein Deployment deine im Admin geänderten Preise.
 * Erzwingen mit:  npm run db:seed -- --force
 */
import { PrismaClient } from "@prisma/client";
import { sortiment } from "./sortiment";
import { verkaufspreis } from "./preise";

const prisma = new PrismaClient();

async function main() {
  const erzwingen =
    process.argv.includes("--force") || process.env.FORCE_SEED === "1";

  const vorhanden = await prisma.product.count();
  if (vorhanden > 0 && !erzwingen) {
    console.log(
      `↩︎  ${vorhanden} Produkte sind schon da – Seed übersprungen. ` +
        `(Zum Überschreiben: npm run db:seed -- --force)`,
    );
    return;
  }

  let produkte = 0;
  let varianten = 0;

  for (const gruppe of sortiment) {
    // Kategorie anlegen oder aktualisieren
    const kategorie = await prisma.category.upsert({
      where: { name: gruppe.kategorie },
      update: { sortierung: gruppe.sortierung },
      create: { name: gruppe.kategorie, sortierung: gruppe.sortierung },
    });

    for (const eintrag of gruppe.produkte) {
      // Bei Varianten gilt der Preis der günstigsten Sorte als Startpreis
      const grundEinkauf = eintrag.varianten
        ? Math.min(...eintrag.varianten.map((v) => v.einkauf))
        : eintrag.einkauf;

      const produkt = await prisma.product.upsert({
        where: { name: eintrag.name },
        update: {
          preis: verkaufspreis(grundEinkauf),
          einkauf: grundEinkauf,
          categoryId: kategorie.id,
        },
        create: {
          name: eintrag.name,
          preis: verkaufspreis(grundEinkauf),
          einkauf: grundEinkauf,
          categoryId: kategorie.id,
          aktiv: true,
        },
      });
      produkte++;

      for (const [i, v] of (eintrag.varianten ?? []).entries()) {
        await prisma.productVariant.upsert({
          where: { productId_name: { productId: produkt.id, name: v.name } },
          update: {
            preis: verkaufspreis(v.einkauf),
            einkauf: v.einkauf,
            sortierung: i * 10,
          },
          create: {
            productId: produkt.id,
            name: v.name,
            preis: verkaufspreis(v.einkauf),
            einkauf: v.einkauf,
            sortierung: i * 10,
          },
        });
        varianten++;
      }
    }
  }

  console.log(
    `✅ ${sortiment.length} Kategorien, ${produkte} Produkte, ${varianten} Varianten.`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
