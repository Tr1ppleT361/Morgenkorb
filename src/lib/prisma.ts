/**
 * Ein einziger Prisma-Client für die ganze App.
 *
 * Warum so umständlich? Beim Entwickeln lädt Next.js den Code ständig neu.
 * Ohne diesen Trick würde bei jedem Neuladen eine neue Datenbankverbindung
 * entstehen – irgendwann gibt es dann Fehler wegen "zu vielen Verbindungen".
 */
import { PrismaClient } from "@prisma/client";

/**
 * Vercel legt die Datenbank-Adresse je nach Anbieter unter verschiedenen
 * Namen ab. Prisma sucht aber immer nach DATABASE_URL. Falls die fehlt,
 * füllen wir sie hier aus einem der anderen Namen auf – das muss passieren,
 * BEVOR der PrismaClient erzeugt wird.
 */
if (!process.env.DATABASE_URL) {
  const ersatz = [
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
  ]
    .map((name) => process.env[name])
    .find((wert) => wert && wert.trim() !== "");

  if (ersatz) process.env.DATABASE_URL = ersatz;
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
