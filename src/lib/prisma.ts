/**
 * Ein einziger Prisma-Client für die ganze App.
 *
 * Warum so umständlich? Beim Entwickeln lädt Next.js den Code ständig neu.
 * Ohne diesen Trick würde bei jedem Neuladen eine neue Datenbankverbindung
 * entstehen – irgendwann gibt es dann Fehler wegen "zu vielen Verbindungen".
 */
import { PrismaClient } from "@prisma/client";

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
