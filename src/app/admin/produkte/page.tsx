/**
 * Admin-Ansicht "Produkte": anlegen, bearbeiten, aktiv/inaktiv schalten.
 */
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import { ProduktVerwaltung } from "./ProduktVerwaltung";

export const dynamic = "force-dynamic";

export default async function ProdukteSeite() {
  const produkte = await prisma.product.findMany({
    orderBy: [{ kategorie: "asc" }, { name: "asc" }],
  });

  // Vorschläge für das Kategorie-Feld: alles, was es schon gibt
  const kategorien = Array.from(
    new Set([
      ...config.kategorienReihenfolge,
      ...produkte.map((p) => p.kategorie),
    ]),
  );

  return <ProduktVerwaltung produkte={produkte} kategorien={kategorien} />;
}
