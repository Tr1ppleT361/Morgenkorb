/**
 * Ein einziger Prisma-Client für die ganze App.
 *
 * Warum so umständlich? Beim Entwickeln lädt Next.js den Code ständig neu.
 * Ohne diesen Trick würde bei jedem Neuladen eine neue Datenbankverbindung
 * entstehen – irgendwann gibt es dann Fehler wegen "zu vielen Verbindungen".
 */
import { PrismaClient } from "@prisma/client";

/**
 * Vercel legt die Datenbank-Adresse unter wechselnden Namen ab – und setzt
 * je nach Datenbank noch ein Präfix davor (z. B. MorgenkorbDB_DATABASE_URL).
 * Prisma sucht aber immer nach DATABASE_URL. Also füllen wir die auf,
 * BEVOR der PrismaClient erzeugt wird.
 *
 * Die Suche steckt in scripts/db-url.mjs, damit das Build-Skript und die App
 * garantiert nach denselben Regeln suchen.
 */
import { adresseFuerAbfragen } from "../../scripts/db-url.mjs";

if (!process.env.DATABASE_URL) {
  const gefunden = adresseFuerAbfragen(process.env);
  if (gefunden) process.env.DATABASE_URL = gefunden.wert;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
