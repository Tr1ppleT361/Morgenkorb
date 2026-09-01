# 🧺 Morgenkorb

Eine kleine Bestell-Website für die Schulklasse.
Abends bestellen die Mitschüler, morgens gibt es eine fertige Einkaufsliste.

- **Seite 1 (`/`)** – Bestellen: Produkte nach Kategorie, Suche, Plus/Minus,
  Warenkorb-Leiste unten, Bestellschluss um 20:00 Uhr.
- **Seite 2 (`/admin`)** – Passwortgeschützt: Einkaufsliste zum Abhaken,
  Ansicht pro Person mit „bezahlt"-Häkchen, Produktverwaltung, Archiv.

Kein Login für die Besteller, kein Zahlungsdienst – **bezahlt wird bar bei der
Übergabe**.

---

## Was steckt drin?

| Baustein | Wofür |
| --- | --- |
| [Next.js 15](https://nextjs.org) (App Router) | Seiten und Server-Logik |
| TypeScript | Tippfehler fallen schon beim Schreiben auf |
| [Tailwind CSS](https://tailwindcss.com) | Styling direkt im HTML |
| [Prisma](https://prisma.io) + SQLite | Datenbank (später leicht auf Postgres umstellbar) |

---

## Schnellstart (5 Minuten)

Du brauchst **Node.js 18.18 oder neuer** ([nodejs.org](https://nodejs.org)).

```bash
# 1) Projekt holen
git clone https://github.com/Tr1ppleT361/Morgenkorb.git
cd Morgenkorb

# 2) Pakete installieren
npm install

# 3) Einstellungen anlegen
cp .env.example .env
#    -> .env öffnen und ADMIN_PASSWORD auf ein eigenes Passwort ändern!

# 4) Datenbank anlegen und mit 100 Produkten füllen
npm run setup

# 5) Loslegen
npm run dev
```

Fertig: [http://localhost:3000](http://localhost:3000) im Browser öffnen.
Der Admin-Bereich liegt unter [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Alle Befehle

| Befehl | Was passiert |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit automatischem Neuladen |
| `npm run build` | Optimierte Version bauen (für den Server) |
| `npm start` | Die gebaute Version starten |
| `npm run setup` | Datenbank anlegen **und** Produkte einfüllen |
| `npm run db:push` | Datenbank an das Schema anpassen |
| `npm run db:seed` | Die 100 Produkte einfüllen (überschreibt Preise) |
| `npm run db:studio` | Datenbank im Browser anschauen (Prisma Studio) |

---

## Einstellungen

### `.env` (geheim, wird **nicht** mit hochgeladen)

```bash
DATABASE_URL="file:./dev.db"       # Ort der Datenbank
ADMIN_PASSWORD="dein-passwort"     # Passwort für /admin
ADMIN_SECRET="langer-zufallstext"  # sichert das Login-Cookie ab
```

Einen guten `ADMIN_SECRET` bekommst du mit:

```bash
openssl rand -hex 32
```

### `src/config.ts` (nicht geheim)

Hier stellst du alles ein, was mit dem Ablauf zu tun hat:

```ts
bestellschluss: { stunde: 20, minute: 0 },  // Bestellschluss
zeitzone: "Europe/Berlin",                  // gilt für den Bestellschluss
kategorienReihenfolge: [...],               // Reihenfolge auf der Startseite
maxMengeProProdukt: 20,                     // Obergrenze pro Produkt
```

Der Bestellschluss wird **zweimal** geprüft: einmal im Browser (Formular wird
grau) und einmal auf dem Server. Der Server ist der entscheidende Teil – so
kann niemand die Sperre umgehen.

---

## Wie läuft ein Tag ab?

1. **Nachmittag/Abend** – Mitschüler öffnen `/`, legen Sachen in den Warenkorb
   und bestellen mit Name + Klasse. Sie sehen sofort, was sie mitbringen müssen.
2. **20:00 Uhr** – Bestellschluss. Die Seite zeigt
   *„Bestellungen für morgen sind geschlossen"*.
3. **Am nächsten Morgen** – Du öffnest `/admin` → **Einkaufsliste**
   (`6× Hanuta 2er`, `3× Coca-Cola 0,5l` …) und hakst beim Einkaufen ab.
4. **In der Schule** – Reiter **Pro Person**: austeilen, Geld kassieren,
   „bezahlt" antippen.
5. **Danach** – Button **Tag abschließen**. Alle Bestellungen wandern ins
   **Archiv**, die Tagesliste ist wieder leer für den nächsten Abend.

---

## Datenmodell

Alle Preise sind **ganze Zahlen in Cent** (`149` = 1,49 €).
Kommazahlen sind bei Geld ungenau – deshalb rechnen wir überall in Cent und
teilen erst kurz vor der Anzeige durch 100 (siehe `src/lib/geld.ts`).

```
Product    id, name (einmalig), preis (Cent), kategorie, bildUrl?, aktiv
Order      id, name, klasse, notiz?, erstelltAm, bezahlt, abgeschlossen
OrderItem  id, orderId, productId, menge, preisBeimKauf (Cent)
```

`preisBeimKauf` merkt sich den Preis vom Bestellzeitpunkt. Änderst du später
den Produktpreis, bleiben alte Bestellungen trotzdem korrekt.

---

## Ordnerübersicht

```
prisma/
  schema.prisma        Datenmodell
  seed.ts              die 100 Startprodukte
src/
  config.ts            Bestellschluss & Co.
  lib/
    prisma.ts          Datenbankverbindung
    geld.ts            Cent -> "1,49 €"
    bestellschluss.ts  offen oder geschlossen?
    auth.ts            Passwortschutz für /admin
  components/
    Bestellseite.tsx   Produktliste + Warenkorb (läuft im Browser)
    ThemeToggle.tsx    hell/dunkel umschalten
  app/
    page.tsx           Startseite (lädt Produkte aus der DB)
    actions.ts         Bestellung speichern (läuft nur auf dem Server)
    bestellung/[id]/   Bestätigungsseite
    admin/             Login, Einkaufsliste, Pro Person, Produkte, Archiv
```

---

## Später auf Postgres wechseln

Das Schema benutzt absichtlich nur Dinge, die SQLite **und** Postgres können.
Der Umzug hat drei Schritte:

1. In `prisma/schema.prisma` den Provider ändern:

   ```prisma
   datasource db {
     provider = "postgresql"   // vorher: "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. In `.env` die neue Adresse eintragen:

   ```bash
   DATABASE_URL="postgresql://benutzer:passwort@host:5432/morgenkorb?schema=public"
   ```

3. Tabellen anlegen und Produkte einfüllen:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

## Online stellen (Deployment)

### Variante A: Vercel + Postgres (empfohlen)

SQLite funktioniert auf Vercel nicht dauerhaft, weil das Dateisystem dort nach
jedem Aufruf zurückgesetzt wird. Nimm deshalb eine echte Datenbank – z. B.
[Neon](https://neon.tech) oder Vercel Postgres, beide haben ein Gratis-Angebot.

1. Erst wie oben auf **Postgres** umstellen und die Änderung committen.
2. Projekt auf [vercel.com](https://vercel.com) importieren.
3. Unter *Settings → Environment Variables* eintragen:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.
4. Deployen. Danach einmal lokal – mit der Postgres-`DATABASE_URL` in der
   `.env` – die Tabellen anlegen und die Produkte einfüllen:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

### Variante B: Eigener Server / Raspberry Pi (SQLite reicht)

```bash
git clone https://github.com/Tr1ppleT361/Morgenkorb.git
cd Morgenkorb
npm install
cp .env.example .env      # Passwort setzen!
npm run setup
npm run build
npm start                 # läuft auf Port 3000
```

Damit die Seite nach einem Neustart wieder läuft, lohnt sich ein
Prozessmanager wie [PM2](https://pm2.keymetrics.io):

```bash
npm install -g pm2
pm2 start "npm start" --name morgenkorb
pm2 save
```

**Bitte denk daran:** Vergiss nicht, die Datei `prisma/dev.db` regelmäßig zu
sichern – da stecken alle Bestellungen drin.

---

## Häufige Fragen

**Ich habe mein Admin-Passwort vergessen.**
`ADMIN_PASSWORD` in der `.env` ändern und den Server neu starten.

**Ein Produkt gibt es nicht mehr.**
Im Admin unter *Produkte* den Schalter auf inaktiv stellen. Es verschwindet aus
dem Shop, alte Bestellungen bleiben aber erhalten. (Löschen geht bewusst nicht,
sonst würden alte Bestellungen kaputtgehen.)

**Die Preise stimmen nicht mehr.**
Im Admin unter *Produkte* auf *Bearbeiten* tippen. Bereits abgeschickte
Bestellungen behalten ihren alten Preis.

**Ich habe aus Versehen den Tag abgeschlossen.**
Kein Drama: Die Bestellungen sind nur im Reiter *Archiv* gelandet, gelöscht
wurde nichts.

**Kann jemand nach 20:00 Uhr doch noch bestellen?**
Nein. Auch wenn jemand im Browser trickst, lehnt der Server die Bestellung ab.
