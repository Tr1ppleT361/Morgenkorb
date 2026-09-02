/**
 * Das Start-Sortiment.
 *
 * Angegeben ist jeweils der ungefähre EINKAUFSPREIS bei Rewe in Cent.
 * Den Verkaufspreis rechnet prisma/preise.ts daraus aus (rund 30 % Aufschlag,
 * gerundet auf barzahlungsfreundliche Beträge).
 *
 * Produkte mit `varianten` haben mehrere Sorten, z. B. Fanta Orange und
 * Fanta Exotic. Varianten dürfen unterschiedlich teuer sein.
 */

export type Variante = { name: string; einkauf: number };
export type Eintrag = { name: string; einkauf: number; varianten?: Variante[] };
export type Gruppe = { kategorie: string; sortierung: number; produkte: Eintrag[] };

export const sortiment: Gruppe[] = [
  {
    kategorie: "Schokoriegel & Süßes",
    sortierung: 10,
    produkte: [
      { name: "Hanuta 2er", einkauf: 65 },
      { name: "Hanuta Minis Beutel", einkauf: 179 },
      { name: "Duplo", einkauf: 45 },
      { name: "Duplo White", einkauf: 49 },
      { name: "Duplo Chocnut", einkauf: 49 },
      { name: "Kinder Riegel", einkauf: 40 },
      { name: "Kinder Bueno", einkauf: 99 },
      { name: "Kinder Bueno White", einkauf: 105 },
      { name: "Kinder Country", einkauf: 45 },
      { name: "Kinder Schokolade 4er", einkauf: 119 },
      { name: "Kinder Pingui", einkauf: 69 },
      { name: "Kinder Maxi King", einkauf: 79 },
      { name: "Kinder Schokobons Beutel", einkauf: 189 },
      { name: "Milchschnitte", einkauf: 59 },
      { name: "Yogurette 5er", einkauf: 129 },
      { name: "Ferrero Küsschen", einkauf: 179 },
      { name: "Ferrero Rocher 3er", einkauf: 149 },
      { name: "Raffaello 4er", einkauf: 149 },
      { name: "Überraschungsei", einkauf: 99 },
      { name: "Snickers", einkauf: 79 },
      { name: "Twix", einkauf: 79 },
      { name: "Mars", einkauf: 79 },
      { name: "Bounty", einkauf: 79 },
      { name: "Milky Way", einkauf: 49 },
      { name: "Balisto", einkauf: 59 },
      { name: "Lion", einkauf: 79 },
      { name: "Nuts", einkauf: 85 },
      { name: "Knoppers", einkauf: 55 },
      { name: "Knoppers Nussriegel", einkauf: 69 },
      { name: "Merci Riegel", einkauf: 55 },
      { name: "Toffifee", einkauf: 179 },
      { name: "Nutella & Go", einkauf: 139 },
      {
        name: "KitKat",
        einkauf: 75,
        varianten: [
          { name: "Classic", einkauf: 75 },
          { name: "Chunky", einkauf: 85 },
          { name: "White", einkauf: 85 },
        ],
      },
      {
        name: "Milka Tafel 100g",
        einkauf: 129,
        varianten: [
          { name: "Alpenmilch", einkauf: 129 },
          { name: "Haselnuss", einkauf: 135 },
          { name: "Luflée", einkauf: 139 },
          { name: "Oreo", einkauf: 155 },
          { name: "Erdbeer", einkauf: 139 },
        ],
      },
      {
        name: "Ritter Sport 100g",
        einkauf: 129,
        varianten: [
          { name: "Vollmilch", einkauf: 129 },
          { name: "Knusperflakes", einkauf: 129 },
          { name: "Erdnuss", einkauf: 135 },
          { name: "Alpenmilch", einkauf: 129 },
          { name: "Marzipan", einkauf: 139 },
          { name: "Joghurt", einkauf: 129 },
        ],
      },
    ],
  },

  {
    kategorie: "Chips & Salziges",
    sortierung: 20,
    produkte: [
      {
        name: "Chio Chips",
        einkauf: 179,
        varianten: [
          { name: "Paprika", einkauf: 179 },
          { name: "Salted", einkauf: 179 },
          { name: "Sour Cream", einkauf: 185 },
        ],
      },
      {
        name: "Funny-frisch Chipsfrisch",
        einkauf: 179,
        varianten: [
          { name: "Ungarisch", einkauf: 179 },
          { name: "Peperoni", einkauf: 179 },
          { name: "Gewürz", einkauf: 179 },
        ],
      },
      {
        name: "Pringles",
        einkauf: 245,
        varianten: [
          { name: "Original", einkauf: 245 },
          { name: "Paprika", einkauf: 245 },
          { name: "Sour Cream & Onion", einkauf: 249 },
          { name: "Hot & Spicy", einkauf: 249 },
        ],
      },
      {
        name: "Doritos",
        einkauf: 189,
        varianten: [
          { name: "Nacho Cheese", einkauf: 189 },
          { name: "Sweet Chili", einkauf: 189 },
          { name: "Cool American", einkauf: 195 },
        ],
      },
      {
        name: "Crunchips",
        einkauf: 179,
        varianten: [
          { name: "Cheese & Onion", einkauf: 179 },
          { name: "Paprika", einkauf: 179 },
          { name: "Western Style", einkauf: 185 },
        ],
      },
      {
        name: "Lay's Chips",
        einkauf: 175,
        varianten: [
          { name: "Paprika", einkauf: 175 },
          { name: "Salted", einkauf: 175 },
        ],
      },
      {
        name: "TUC Cracker",
        einkauf: 119,
        varianten: [
          { name: "Original", einkauf: 119 },
          { name: "Cracker & Käse", einkauf: 139 },
        ],
      },
      { name: "Tortilla Chips", einkauf: 165 },
      { name: "Salsa Dip mild", einkauf: 179 },
      { name: "Erdnussflips", einkauf: 129 },
      { name: "Erdnusslocken", einkauf: 129 },
      { name: "Nic Nac's", einkauf: 125 },
      { name: "Ültje Erdnüsse", einkauf: 165 },
      { name: "Salzstangen", einkauf: 89 },
      { name: "Laugenbrezeln Beutel", einkauf: 125 },
      { name: "Käsegebäck", einkauf: 135 },
      { name: "Goldfischli", einkauf: 135 },
      { name: "Popcorn süß", einkauf: 135 },
      { name: "Popcorn salzig", einkauf: 135 },
      { name: "Kartoffelsticks", einkauf: 89 },
      { name: "Pombär", einkauf: 119 },
      { name: "Snack a Jacks", einkauf: 149 },
      { name: "Mini Salami Snack", einkauf: 135 },
      { name: "BiFi Original", einkauf: 79 },
      { name: "BiFi Roll", einkauf: 105 },
    ],
  },

  {
    kategorie: "Kekse & Gebäck",
    sortierung: 30,
    produkte: [
      { name: "Prinzenrolle", einkauf: 135 },
      { name: "Leibniz Butterkeks", einkauf: 119 },
      {
        name: "Leibniz Choco",
        einkauf: 145,
        varianten: [
          { name: "Vollmilch", einkauf: 145 },
          { name: "Zartbitter", einkauf: 145 },
          { name: "Weiß", einkauf: 149 },
        ],
      },
      { name: "Leibniz Minis", einkauf: 139 },
      { name: "Manner Schnitten", einkauf: 125 },
      {
        name: "Oreo",
        einkauf: 159,
        varianten: [
          { name: "Original", einkauf: 159 },
          { name: "Double Cream", einkauf: 169 },
        ],
      },
      {
        name: "Pick Up!",
        einkauf: 59,
        varianten: [
          { name: "Choco", einkauf: 59 },
          { name: "Milch", einkauf: 59 },
          { name: "Black'n White", einkauf: 65 },
        ],
      },
      { name: "Milka Choco Wafer", einkauf: 69 },
      { name: "Bahlsen Waffeletten", einkauf: 155 },
      { name: "Butterkeks Schoko", einkauf: 129 },
      { name: "Cookies mit Schokostücken", einkauf: 149 },
      { name: "Russisch Brot", einkauf: 99 },
    ],
  },

  {
    kategorie: "Getränke",
    sortierung: 40,
    produkte: [
      {
        name: "Coca-Cola 0,5l",
        einkauf: 129,
        varianten: [
          { name: "Original", einkauf: 129 },
          { name: "Zero", einkauf: 129 },
          { name: "Light", einkauf: 129 },
        ],
      },
      {
        name: "Fanta 0,5l",
        einkauf: 125,
        varianten: [
          { name: "Orange", einkauf: 125 },
          { name: "Exotic", einkauf: 129 },
          { name: "Lemon", einkauf: 129 },
          { name: "Zero Orange", einkauf: 125 },
        ],
      },
      { name: "Sprite 0,5l", einkauf: 125 },
      { name: "Mezzo Mix 0,5l", einkauf: 125 },
      {
        name: "Pepsi 0,5l",
        einkauf: 109,
        varianten: [
          { name: "Original", einkauf: 109 },
          { name: "Max", einkauf: 109 },
        ],
      },
      { name: "Spezi 0,5l", einkauf: 119 },
      {
        name: "Fritz-Kola 0,33l",
        einkauf: 135,
        varianten: [
          { name: "Kola", einkauf: 135 },
          { name: "Zuckerfrei", einkauf: 135 },
          { name: "Limo Orange", einkauf: 135 },
          { name: "Apfelschorle", einkauf: 129 },
        ],
      },
      { name: "Club-Mate 0,5l", einkauf: 129 },
      { name: "Wasser still 0,5l", einkauf: 55 },
      { name: "Wasser sprudel 0,5l", einkauf: 55 },
      { name: "Volvic 0,5l", einkauf: 89 },
      { name: "Apfelschorle 0,5l", einkauf: 99 },
      { name: "Orangensaft 0,5l", einkauf: 129 },
      { name: "Multivitaminsaft 0,5l", einkauf: 129 },
      {
        name: "Capri-Sun",
        einkauf: 55,
        varianten: [
          { name: "Orange", einkauf: 55 },
          { name: "Multivitamin", einkauf: 55 },
          { name: "Cola Mix", einkauf: 59 },
        ],
      },
      {
        name: "Müllermilch 0,4l",
        einkauf: 125,
        varianten: [
          { name: "Schoko", einkauf: 125 },
          { name: "Banane", einkauf: 125 },
          { name: "Vanille", einkauf: 125 },
          { name: "Erdbeer", einkauf: 125 },
        ],
      },
      { name: "Vanillemilch 0,5l", einkauf: 119 },
      { name: "Latte Macchiato to go", einkauf: 115 },
      { name: "Eiskaffee 0,25l", einkauf: 109 },
      { name: "Hohes C 0,25l", einkauf: 99 },
    ],
  },

  {
    kategorie: "Energy & Eistee",
    sortierung: 50,
    produkte: [
      {
        name: "Red Bull 0,25l",
        einkauf: 155,
        varianten: [
          { name: "Original", einkauf: 155 },
          { name: "Sugarfree", einkauf: 155 },
          { name: "Tropical", einkauf: 159 },
          { name: "Watermelon", einkauf: 159 },
        ],
      },
      {
        name: "Monster Energy 0,5l",
        einkauf: 169,
        varianten: [
          { name: "Original", einkauf: 169 },
          { name: "Ultra White", einkauf: 169 },
          { name: "Ultra Paradise", einkauf: 175 },
          { name: "Ultra Gold", einkauf: 175 },
          { name: "Mango Loco", einkauf: 179 },
          { name: "Pipeline Punch", einkauf: 179 },
        ],
      },
      {
        name: "Rockstar 0,5l",
        einkauf: 139,
        varianten: [
          { name: "Original", einkauf: 139 },
          { name: "Juiced Mango", einkauf: 145 },
        ],
      },
      { name: "Effect Energy 0,33l", einkauf: 119 },
      { name: "28 Black 0,25l", einkauf: 129 },
      { name: "Eistee Pfirsich 0,5l", einkauf: 99 },
      { name: "Eistee Zitrone 0,5l", einkauf: 99 },
      {
        name: "Arizona 0,5l",
        einkauf: 119,
        varianten: [
          { name: "Green Tea", einkauf: 119 },
          { name: "Blueberry", einkauf: 125 },
        ],
      },
      {
        name: "Lipton Ice Tea 0,5l",
        einkauf: 109,
        varianten: [
          { name: "Peach", einkauf: 109 },
          { name: "Lemon", einkauf: 109 },
        ],
      },
      { name: "Powerade 0,5l", einkauf: 125 },
    ],
  },

  {
    kategorie: "Kaugummi & Bonbons",
    sortierung: 60,
    produkte: [
      {
        name: "Orbit Kaugummi",
        einkauf: 85,
        varianten: [
          { name: "Spearmint", einkauf: 85 },
          { name: "Peppermint", einkauf: 85 },
          { name: "Bubblemint", einkauf: 89 },
        ],
      },
      {
        name: "Extra Kaugummi",
        einkauf: 85,
        varianten: [
          { name: "Peppermint", einkauf: 85 },
          { name: "Spearmint", einkauf: 85 },
          { name: "White Bubblemint", einkauf: 89 },
        ],
      },
      {
        name: "Airwaves",
        einkauf: 89,
        varianten: [
          { name: "Menthol", einkauf: 89 },
          { name: "Black Mint", einkauf: 89 },
          { name: "Cherry", einkauf: 89 },
        ],
      },
      {
        name: "Mentos",
        einkauf: 75,
        varianten: [
          { name: "Mint", einkauf: 75 },
          { name: "Fruit", einkauf: 75 },
        ],
      },
      {
        name: "Tic Tac",
        einkauf: 105,
        varianten: [
          { name: "Mint", einkauf: 105 },
          { name: "Orange", einkauf: 105 },
          { name: "Erdbeer-Mix", einkauf: 109 },
        ],
      },
      {
        name: "Fisherman's Friend",
        einkauf: 109,
        varianten: [
          { name: "Original", einkauf: 109 },
          { name: "Cherry", einkauf: 109 },
          { name: "Lemon", einkauf: 109 },
        ],
      },
      { name: "Haribo Goldbären", einkauf: 125 },
      { name: "Haribo Colorado", einkauf: 125 },
      { name: "Haribo Saure Pommes", einkauf: 125 },
      { name: "Haribo Happy Cola", einkauf: 125 },
      { name: "Haribo Phantasia", einkauf: 125 },
      { name: "Maoam Stripes", einkauf: 105 },
      { name: "Maoam Kracher", einkauf: 105 },
      { name: "Katjes Wunderland", einkauf: 125 },
      { name: "Katjes Saure Bohnen", einkauf: 125 },
      { name: "nimm2 Bonbons", einkauf: 155 },
      { name: "nimm2 Lachgummi", einkauf: 155 },
      { name: "Werther's Echte", einkauf: 129 },
      {
        name: "Skittles",
        einkauf: 95,
        varianten: [
          { name: "Fruits", einkauf: 95 },
          { name: "Crazy Sours", einkauf: 99 },
        ],
      },
      {
        name: "M&M's",
        einkauf: 139,
        varianten: [
          { name: "Peanut", einkauf: 139 },
          { name: "Choco", einkauf: 135 },
          { name: "Crispy", einkauf: 139 },
        ],
      },
      { name: "Smarties", einkauf: 85 },
      { name: "Trolli Saure Glühwürmchen", einkauf: 95 },
    ],
  },

  {
    kategorie: "Frühstück & Snacks",
    sortierung: 70,
    produkte: [
      {
        name: "Corny Müsliriegel",
        einkauf: 55,
        varianten: [
          { name: "Schoko", einkauf: 55 },
          { name: "Nuss", einkauf: 55 },
          { name: "Milch", einkauf: 55 },
        ],
      },
      { name: "Müsliriegel Hafer", einkauf: 49 },
      {
        name: "Proteinriegel",
        einkauf: 199,
        varianten: [
          { name: "Cookies & Cream", einkauf: 199 },
          { name: "Caramel", einkauf: 199 },
          { name: "Schoko", einkauf: 199 },
        ],
      },
      { name: "Banane", einkauf: 35 },
      { name: "Apfel", einkauf: 45 },
      { name: "Mandarine", einkauf: 39 },
      { name: "Actimel", einkauf: 55 },
      { name: "Fruchtzwerge", einkauf: 49 },
      { name: "Landliebe Grießpudding", einkauf: 79 },
      {
        name: "High Protein Pudding",
        einkauf: 129,
        varianten: [
          { name: "Schoko", einkauf: 129 },
          { name: "Vanille", einkauf: 129 },
        ],
      },
      { name: "Babybel", einkauf: 45 },
      { name: "Belegtes Brötchen Käse", einkauf: 229 },
      { name: "Belegtes Brötchen Salami", einkauf: 229 },
      { name: "Sandwich Schinken-Käse", einkauf: 249 },
      { name: "Sandwich Thunfisch", einkauf: 259 },
    ],
  },

  {
    // Kleinere Kategorie – Bäckerei gibt es nicht jeden Tag.
    // Wenn nichts da ist: im Admin die ganze Kategorie mit einem Klick
    // verstecken (Produkte -> Kategorie -> "aus").
    kategorie: "Bäckerei",
    sortierung: 80,
    produkte: [
      { name: "Laugenbrezel", einkauf: 79 },
      { name: "Laugenstange", einkauf: 89 },
      { name: "Butter-Croissant", einkauf: 85 },
      { name: "Schoko-Croissant", einkauf: 109 },
      { name: "Franzbrötchen", einkauf: 119 },
      { name: "Nussschnecke", einkauf: 129 },
      { name: "Streuselschnecke", einkauf: 119 },
      { name: "Käsebrötchen", einkauf: 99 },
      { name: "Berliner", einkauf: 99 },
    ],
  },
];
