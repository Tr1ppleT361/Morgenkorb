/**
 * Seed-Skript: füllt die Datenbank mit dem Start-Sortiment (100 Produkte).
 *
 * Ausführen mit:  npm run db:seed
 *
 * Wichtig: alle Preise stehen in CENT (79 = 0,79 €).
 * Das Skript ist "idempotent" – man kann es mehrfach laufen lassen,
 * vorhandene Produkte werden dann nur aktualisiert (upsert).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [Name, Preis in Cent]
type Eintrag = [string, number];

const sortiment: Record<string, Eintrag[]> = {
  "Süßes": [
    ["Hanuta 2er", 79],
    ["Duplo", 59],
    ["Kinder Riegel", 49],
    ["Kinder Bueno", 119],
    ["Kinder Country", 55],
    ["Kinder Schokolade 4er", 139],
    ["Kinder Pingui", 79],
    ["Milchschnitte", 69],
    ["Yogurette 5er", 149],
    ["Ferrero Küsschen", 199],
    ["Snickers", 89],
    ["Twix", 89],
    ["Mars", 89],
    ["Bounty", 89],
    ["Milky Way", 59],
    ["Balisto", 69],
    ["KitKat", 85],
    ["Lion", 89],
    ["Nuts", 95],
    ["Milka Alpenmilch 100g", 149],
    ["Milka Oreo Tafel", 179],
    ["Ritter Sport Vollmilch", 149],
    ["Ritter Sport Knusperflakes", 149],
    ["Ritter Sport Erdnuss", 149],
    ["Oreo 154g", 179],
    ["Prinzenrolle", 149],
    ["Leibniz Butterkeks", 139],
    ["Manner Schnitten", 139],
    ["Toffifee", 199],
    ["Nutella & Go", 159],
  ],
  "Snacks": [
    ["Chio Chips Paprika", 199],
    ["Chio Chips Salted", 199],
    ["Chipsfrisch ungarisch", 199],
    ["Chipsfrisch Peperoni", 199],
    ["Crunchips Cheese & Onion", 199],
    ["Pringles Original", 249],
    ["Pringles Paprika", 249],
    ["Doritos Nacho Cheese", 199],
    ["Tortilla Chips", 179],
    ["Salsa Dip mild", 199],
    ["Erdnussflips", 149],
    ["Nic Nac's", 139],
    ["Ültje Erdnüsse", 179],
    ["Salzstangen", 99],
    ["Laugenbrezeln Beutel", 139],
    ["Käsegebäck", 149],
    ["TUC Cracker", 129],
    ["Popcorn süß", 149],
    ["Kartoffelsticks", 99],
    ["Mini Salami Snack", 149],
  ],
  "Getränke": [
    ["Coca-Cola 0,5l", 149],
    ["Coca-Cola Zero 0,5l", 149],
    ["Fanta 0,5l", 149],
    ["Sprite 0,5l", 149],
    ["Mezzo Mix 0,5l", 149],
    ["Pepsi 0,5l", 129],
    ["Spezi 0,5l", 139],
    ["Fritz-Kola 0,33l", 149],
    ["Club-Mate 0,5l", 149],
    ["Red Bull 0,25l", 179],
    ["Red Bull Sugarfree", 179],
    ["Monster Energy 0,5l", 189],
    ["Monster Ultra", 189],
    ["Eistee Pfirsich 0,5l", 129],
    ["Eistee Zitrone 0,5l", 129],
    ["Capri-Sun", 65],
    ["Apfelschorle 0,5l", 119],
    ["Orangensaft 0,5l", 149],
    ["Multivitaminsaft 0,5l", 149],
    ["Wasser still 0,5l", 79],
    ["Wasser sprudel 0,5l", 79],
    ["Müllermilch Schoko", 149],
    ["Müllermilch Banane", 149],
    ["Vanillemilch", 149],
    ["Latte Macchiato to go", 129],
  ],
  "Kaugummi & Bonbons": [
    ["Orbit Spearmint", 99],
    ["Extra Peppermint", 99],
    ["Airwaves Menthol", 99],
    ["Mentos Mint", 89],
    ["Tic Tac Mint", 129],
    ["Fisherman's Friend", 129],
    ["Haribo Goldbären", 149],
    ["Haribo Colorado", 149],
    ["Haribo Saure Pommes", 149],
    ["Haribo Happy Cola", 149],
    ["Maoam Stripes", 129],
    ["Katjes Wunderland", 149],
    ["nimm2 Bonbons", 179],
    ["Skittles", 109],
    ["M&M's Peanut", 159],
    ["Smarties", 99],
    ["Trolli Saure Glühwürmchen", 109],
  ],
  "Sonstiges": [
    ["Belegtes Brötchen Käse", 279],
    ["Belegtes Brötchen Salami", 279],
    ["Laugenbrezel", 99],
    ["Butter-Croissant", 99],
    ["Schoko-Croissant", 129],
    ["Corny Müsliriegel", 65],
    ["Banane", 45],
    ["Apfel", 59],
  ],
};

async function main() {
  let anzahl = 0;

  for (const [kategorie, produkte] of Object.entries(sortiment)) {
    for (const [name, preis] of produkte) {
      // upsert = anlegen, falls es den Namen noch nicht gibt, sonst aktualisieren
      await prisma.product.upsert({
        where: { name },
        update: { preis, kategorie },
        create: { name, preis, kategorie, aktiv: true },
      });
      anzahl++;
    }
  }

  console.log(`✅ ${anzahl} Produkte in der Datenbank.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
