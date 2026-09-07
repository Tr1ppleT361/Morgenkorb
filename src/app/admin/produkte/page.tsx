/**
 * Admin: Produkte anlegen, bearbeiten, löschen, Sorten pflegen,
 * veröffentlichen oder verstecken.
 */
import { prisma } from "@/lib/prisma";
import { ProduktVerwaltung } from "./ProduktVerwaltung";

export const dynamic = "force-dynamic";

export default async function ProdukteSeite() {
  const [produkte, kategorien] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ category: { sortierung: "asc" } }, { name: "asc" }],
      include: {
        category: true,
        varianten: { orderBy: [{ sortierung: "asc" }, { name: "asc" }] },
      },
    }),
    prisma.category.findMany({ orderBy: { sortierung: "asc" } }),
  ]);

  return (
    <ProduktVerwaltung
      produkte={produkte.map((p) => ({
        id: p.id,
        name: p.name,
        preis: p.preis,
        einkauf: p.einkauf,
        bestand: p.bestand,
        merkmale: p.merkmale,
        zutaten: p.zutaten,
        allergene: p.allergene,
        bildUrl: p.bildUrl,
        aktiv: p.aktiv,
        categoryId: p.categoryId,
        kategorie: p.category.name,
        varianten: p.varianten.map((v) => ({
          id: v.id,
          name: v.name,
          preis: v.preis,
          einkauf: v.einkauf,
          bestand: v.bestand,
          aktiv: v.aktiv,
        })),
      }))}
      kategorien={kategorien.map((k) => ({ id: k.id, name: k.name }))}
    />
  );
}
