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
| [Prisma](https://prisma.io) + Postgres | Datenbank |

---

## Online stellen mit Vercel (geht komplett im Browser)

Du brauchst dafür **keinen Computer mit Terminal** – Handy oder Tablet reicht.

### 1. Datenbank anlegen

Im Vercel-Projekt auf **Storage → Create Database → Postgres** (Neon).
Wichtig: Beim Anlegen **dieses Projekt auswählen** – erst dadurch trägt Vercel
die Zugangsdaten ein. Wenn die Datenbank schon existiert, geht das über
*Storage → Datenbank öffnen → Connect Project* nach.

Wie die Variable heißt, ist egal. Das Projekt akzeptiert `DATABASE_URL`,
`POSTGRES_PRISMA_URL` und `POSTGRES_URL` – **auch mit Präfix davor**, wie es
Vercel beim Anlegen vergibt (z. B. `MorgenkorbDB_DATABASE_URL`). Das Build-Log
schreibt in die erste Zeile, welche Variable es benutzt. Findet es gar keine,
steht dort im Klartext, was zu tun ist.

### 2. Passwörter eintragen

**Settings → Environment Variables**, zwei Stück anlegen:

| Name | Wert |
| --- | --- |
| `ADMIN_PASSWORD` | dein Wunschpasswort für `/admin` |
| `ADMIN_SECRET` | ein langer zufälliger Text (einfach ~40 Zeichen wild tippen) |

### 3. Neu deployen

**Deployments → … → Redeploy.**

Das war's. Beim Bauen passiert automatisch:

1. Die Tabellen werden in der Datenbank angelegt.
2. Die 100 Produkte werden eingefüllt.
3. Die Website wird gebaut.

> Der Seed überschreibt **nichts**, wenn schon Produkte da sind. Preise, die du
> später im Admin änderst, überleben jedes weitere Deployment.

---

## Lokal entwickeln (optional)

Du brauchst **Node.js 18.18 oder neuer** ([nodejs.org](https://nodejs.org)).

```bash
# 1) Projekt holen
git clone https://github.com/Tr1ppleT361/Morgenkorb.git
cd Morgenkorb

# 2) Pakete installieren
npm install

# 3) Einstellungen anlegen
cp .env.example .env
```

Jetzt `.env` öffnen und ausfüllen:

- `DATABASE_URL` – am einfachsten dieselbe wie auf Vercel. Die findest du dort
  unter *Storage → deine Datenbank → .env.local*. Achtung: Du arbeitest dann
  auf den echten Daten. Sauberer ist eine zweite, kostenlose Datenbank bei
  [Neon](https://neon.tech) zum Ausprobieren.
- `ADMIN_PASSWORD` – dein Passwort für `/admin`.
- `ADMIN_SECRET` – langer Zufallstext.

```bash
# 4) Tabellen anlegen und die 100 Produkte einfüllen
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
| `npm run build` | Datenbank vorbereiten und Website bauen (das macht auch Vercel) |
| `npm start` | Die gebaute Version starten |
| `npm run setup` | Datenbank anlegen **und** Produkte einfüllen |
| `npm run db:push` | Datenbank an das Schema anpassen |
| `npm run db:seed` | Die 100 Produkte einfüllen (tut nichts, wenn schon welche da sind) |
| `npm run db:seed -- --force` | Startsortiment erzwingen – **überschreibt geänderte Preise** |
| `npm run db:studio` | Datenbank im Browser anschauen (Prisma Studio) |

---

## Einstellungen

### `.env` (geheim, wird **nicht** mit hochgeladen)

```bash
DATABASE_URL="postgresql://..."    # Adresse der Datenbank
ADMIN_PASSWORD="dein-passwort"     # Passwort für /admin
ADMIN_SECRET="langer-zufallstext"  # sichert das Login-Cookie ab
```

Auf Vercel stehen dieselben drei Variablen unter *Settings → Environment
Variables*. `DATABASE_URL` setzt Vercel selbst, wenn du die Postgres-Datenbank
über *Storage* anlegst.

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

## Warum Postgres und nicht SQLite?

SQLite speichert alles in **einer Datei**. Das ist praktisch – aber Vercel
setzt das Dateisystem nach kurzer Zeit zurück. Die Datei wäre also regelmäßig
weg, samt aller Bestellungen. Postgres läuft als eigener Dienst daneben und
bleibt erhalten.

Falls du das Projekt später doch auf einem eigenen Rechner (Raspberry Pi,
alter Laptop) betreiben willst, kannst du zu SQLite zurück: In
`prisma/schema.prisma` `provider = "sqlite"` setzen, in `.env`
`DATABASE_URL="file:./dev.db"` eintragen, dann `npm run setup`. Das Schema
benutzt absichtlich nur Dinge, die beide Datenbanken können.

---

## Auf einem eigenen Server statt Vercel

```bash
git clone https://github.com/Tr1ppleT361/Morgenkorb.git
cd Morgenkorb
npm install
cp .env.example .env      # DATABASE_URL und Passwort setzen!
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

**Die Seite zeigt „Application error: a server-side exception".**
Meistens fehlt die `DATABASE_URL` oder die Datenbank ist nicht verbunden.
Schau bei Vercel unter *Deployments → dein Deployment → Runtime Logs*, dort
steht die genaue Ursache. Prüf danach unter *Storage*, ob die Datenbank mit dem
Projekt verbunden ist, und deploye neu.

**`/admin` sagt „Admin noch nicht eingerichtet".**
Dann fehlt `ADMIN_PASSWORD` in den Environment Variables. Eintragen und einmal
neu deployen.

**Muss ich bei jedem Deployment die Produkte neu einfüllen?**
Nein, das passiert automatisch beim Bauen – und nur beim allerersten Mal, wenn
die Datenbank noch leer ist.
