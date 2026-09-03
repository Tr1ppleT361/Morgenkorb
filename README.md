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

### 2. Admin-Zugang eintragen

**Settings → Environment Variables**:

| Name | Wert |
| --- | --- |
| `ADMIN_EMAIL` | deine E-Mail, z. B. `du@example.com` |
| `ADMIN_PASSWORT` | dein Wunschpasswort |
| `ADMIN_NAME` | optional, wie du im Admin heißt |

Aus diesen Angaben wird beim ersten Anmeldeversuch automatisch ein
Admin-Konto in der Datenbank angelegt. Du musst dich also **nicht** vorher
registrieren. Änderst du das Passwort hier später, gilt beim nächsten
Anmelden das neue – aussperren kannst du dich nicht.

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

## Konten und Anmeldung

Es gibt **ein** Login für alle – unter `/anmelden`. Ob jemand Admin ist,
entscheidet die Rolle im Konto.

### Registrierung mit E-Mail-Bestätigung

Wer ein Konto anlegt, bekommt einen **sechsstelligen Code per E-Mail**. Erst
nach Eingabe des Codes ist das Konto freigeschaltet. Das passiert **nur bei
der Registrierung** – beim normalen Anmelden danach nie wieder.

Damit möglichst wenig Unsinn durchkommt, wird die Adresse vorher geprüft:
Form (`etwas@etwas.de`), bekannte Wegwerf-Anbieter werden abgelehnt, und
häufige Vertipper bekommen einen Hinweis („Meintest du @gmail.com?"). Lehnt
der Mailanbieter die Adresse ab, wird das angefangene Konto wieder gelöscht –
sonst wäre die Adresse für immer blockiert.

Der Code gilt 30 Minuten, erlaubt 5 Fehlversuche und man kann sich höchstens
5 neue pro Stunde schicken lassen. Gespeichert wird nur der Hash des Codes.

**Dafür brauchst du einen Mail-Dienst:** Konto bei [Resend](https://resend.com)
anlegen (kostenlos für kleine Mengen), Domain verifizieren, API-Key erzeugen
und als `RESEND_API_KEY` plus `MAIL_ABSENDER` eintragen. Ohne diese beiden
Variablen kann sich niemand registrieren.

### Für dich (Admin)

Melde dich mit `ADMIN_EMAIL` und `ADMIN_PASSWORT` an. Admin-Konten brauchen
keine E-Mail-Bestätigung, damit du dich nie aussperrst. Die Anmeldung hält
**30 Tage**.

### Wie die Passwörter gespeichert werden

Passwörter landen **nie** im Klartext in der Datenbank, sondern nur als
scrypt-Hash mit eigenem Zufallssalz pro Konto (siehe
`src/lib/passwort.ts`). Beim Anmelden bekommt der Browser ein `httpOnly`-Cookie
mit einem Zufallsschlüssel; in der Datenbank steht nur dessen Hash.

---

## Kartenzahlung mit Stripe

Ohne Stripe-Schlüssel gibt es einfach nur Barzahlung – die Seite funktioniert
vollständig. Mit Stripe können deine Mitschüler zusätzlich sofort mit Karte
(und allem, was Stripe sonst anbietet) bezahlen.

### Einrichten

1. Konto bei [stripe.com](https://stripe.com) anlegen.
2. **Developers → API keys**: den *Secret key* kopieren →
   `STRIPE_SECRET_KEY` in den Vercel-Variablen.
3. **Developers → Webhooks → Add endpoint**:
   `https://deine-domain/api/stripe/webhook`
   Ereignisse: `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `charge.refunded`.
4. Das *Signing secret* des Endpoints kopieren → `STRIPE_WEBHOOK_SECRET`.
5. Neu deployen.

Das Geld landet direkt auf deinem Stripe-Konto und wird von dort ausgezahlt.

### Warum das sicher ist

- Der geheime Schlüssel wird **nur serverseitig** benutzt (`src/lib/stripe.ts`).
  Im Browser landet er nie.
- Der Betrag wird **immer frisch aus der Datenbank** gerechnet, nie aus dem,
  was der Browser schickt.
- Ob eine Bestellung bezahlt ist, entscheidet **ausschließlich der Webhook**.
  Die Erfolgsseite im Browser ist kein Beweis – die kann jeder aufrufen.
- Jeder Webhook-Aufruf wird **signaturgeprüft**. Ohne gültige Signatur
  passiert nichts.
- Doppelt zugestellte Webhooks buchen nicht doppelt (`updateMany` mit der
  Bedingung „noch nicht bezahlt").

---

## Der Admin-Bereich

| Reiter | Was du dort machst |
| --- | --- |
| **Übersicht** | Zahlen des Tages, Bestellstatus auf einen Blick, Sprung in alle Bereiche |
| **Bestellungen** | Jede Bestellung mit Kunde, Artikeln, Betrag – und der Statuswechsel |
| **Einkaufsliste** | Alles zusammengezählt zum Abhaken im Laden, „Tag abschließen" |
| **Kunden** | Alle Konten mit Bestellzahl und offenem Betrag, dazu Gast-Bestellungen |
| **Produkte** | Anlegen, bearbeiten, Bild setzen, veröffentlichen oder verstecken |
| **Kasse** | Wer hat bezahlt, was fehlt noch – auch aus früheren Tagen |
| **Kategorien** | Anlegen, umbenennen, sortieren, ausblenden, löschen |
| **Archiv** | Abgeschlossene Bestellungen |
| **Zeiten** | Bestellzeitfenster einstellen |

### Bestellstatus

Jede Bestellung durchläuft vier Schritte:

1. **Bestellung erhalten** – ist angekommen und für morgen vorgemerkt
2. **Wird bearbeitet** – steht auf der Einkaufsliste
3. **Versendet** – eingekauft und eingepackt
4. **Zugestellt** – übergeben

Den Status änderst du unter *Bestellungen*: entweder pro Bestellung mit
„Weiter zu …", per Auswahlfeld, oder für alle auf einmal über die Leiste
oben. Jede Änderung wird mit Zeitstempel mitgeschrieben – der Kunde sieht
den Verlauf sofort auf seiner Bestätigungsseite und unter `/konto`.

„Tag abschließen" verschiebt alles ins Archiv und setzt offene Bestellungen
auf *Zugestellt*. **Gelöscht wird nichts** – die Kunden sehen ihre
Bestellungen weiterhin.

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
Category         id, name (einmalig), sortierung, aktiv
Product          id, name (einmalig), preis (Cent), einkauf?, categoryId,
                 bildUrl?, aktiv
ProductVariant   id, productId, name, preis (Cent), einkauf?, aktiv
Order            id, name, klasse, notiz?, erstelltAm, bezahlt, abgeschlossen,
                 userId?, status, statusAm,
                 zahlart, zahlstatus, bezahltAm?, stripeSessionId?,
                 stripePaymentIntentId?
OrderItem        id, orderId, productId, variantId?, variantName?,
                 menge, preisBeimKauf (Cent)
User             id, email (einmalig), name, klasse?, passwortHash, rolle,
                 emailVerifiziertAm?
Session          id, tokenHash, userId, laeuftAbAm
VerificationCode id, userId, codeHash, laeuftAbAm, versuche
OrderStatus      id, orderId, status, am, notiz?   (der Verlauf)
Setting          schluessel, wert                  (z. B. die Bestellzeiten)
```

`Order.userId` ist optional: Bestellungen ohne Konto funktionieren weiterhin.

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

## Bestellzeiten

Unter **Admin → Zeiten** stellst du ein, von wann bis wann bestellt werden
kann. Die Zeiten stehen **nicht im Code**, sondern in der Datenbank – du
änderst sie jederzeit über die Website.

- Ein Fenster über Mitternacht ist erlaubt (Start 18:00, Ende 02:00).
- Der Schalter „Bestellungen angenommen" schließt sofort, egal welche Uhrzeit.
- Geprüft wird auch auf dem Server: Wer im Browser trickst, kommt trotzdem
  nicht durch.

---

## Sortiment, Preise und Sorten

Das Startsortiment umfasst rund 150 Produkte in acht Kategorien, dazu eine
kleine **Bäckerei**-Kategorie – die kannst du an Tagen ohne Ware mit einem
Klick komplett ausblenden (Admin → Kategorien → Schalter).

### Wie die Preise entstehen

In `prisma/sortiment.ts` steht zu jedem Produkt der **Einkaufspreis**.
`prisma/preise.ts` rechnet daraus den Verkaufspreis:

1. Einkauf + 30 % Aufschlag
2. gerundet auf barzahlungsfreundliche Beträge: unter 1 € auf 10 Cent,
   ab 1 € auf 50 Cent – also 1,50 € oder 2,00 €, nie 1,89 €
3. mindestens 10 % Marge müssen übrig bleiben

Im Schnitt kommen so rund 29 % Marge heraus. Willst du mehr oder weniger,
änderst du `AUFSCHLAG` in `prisma/preise.ts`.

### Sorten

Produkte wie Fanta oder Monster haben **Sorten** mit eigenen Preisen. Im Shop
steht dann „ab 1,50 €" und ein Knopf öffnet die Auswahl. Sorten pflegst du im
Admin unter *Produkte → Sorten*. Ein Produkt ohne Sorten funktioniert
unverändert.

---

## Aussehen ändern

Die Farben stehen alle an **einer** Stelle: ganz oben in `src/app/globals.css`.
Dort gibt es einen Block für hell und einen für dunkel:

```css
:root {
  --grund: 247 241 231;  /* Seitenhintergrund */
  --karte: 255 252 246;  /* Kartenflächen */
  --tinte: 44 33 25;     /* Textfarbe */
  --honig: 214 138 45;   /* Hauptakzent */
  --ziegel: 176 74 45;   /* Knöpfe */
  ...
}
```

Die Zahlen sind Rot, Grün und Blau (0–255). Änderst du sie, ändert sich die
ganze Seite mit – im Code steht nämlich nirgends eine feste Farbe, sondern
immer nur `bg-karte`, `text-leise` und so weiter.

Die Schriften (Fraunces für Überschriften, Nunito für den Rest) werden in
`src/app/layout.tsx` geladen. Die gezeichneten Produktbilder stecken in
`src/components/KategorieIcon.tsx` – drei Motive je Kategorie, damit nicht
überall dasselbe Bild steht. Sobald ein Produkt eine `bildUrl` hat, wird
stattdessen das Foto angezeigt.

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
`ADMIN_PASSWORT` in den Umgebungsvariablen ändern und neu deployen. Beim
nächsten Anmelden gilt das neue Passwort automatisch.

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
