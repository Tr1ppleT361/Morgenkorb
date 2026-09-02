/** Admin: Kategorien anlegen, umbenennen, sortieren, löschen. */
import { prisma } from "@/lib/prisma";
import { KategorieVerwaltung } from "./KategorieVerwaltung";

export const dynamic = "force-dynamic";

export default async function KategorienSeite() {
  const kategorien = await prisma.category.findMany({
    orderBy: { sortierung: "asc" },
    include: { _count: { select: { produkte: true } } },
  });

  return (
    <KategorieVerwaltung
      kategorien={kategorien.map((k) => ({
        id: k.id,
        name: k.name,
        sortierung: k.sortierung,
        aktiv: k.aktiv,
        anzahl: k._count.produkte,
      }))}
    />
  );
}
