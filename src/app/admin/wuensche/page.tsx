/** Admin: Produktwünsche nach Beliebtheit. */
import { prisma } from "@/lib/prisma";
import { WunschVerwaltung } from "./WunschVerwaltung";

export const dynamic = "force-dynamic";

export default async function AdminWuenscheSeite() {
  const wuensche = await prisma.wunsch.findMany({
    include: { _count: { select: { stimmen: true } } },
    orderBy: { erstelltAm: "desc" },
    take: 200,
  });

  const sortiert = [...wuensche].sort((a, b) => {
    if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
    return b._count.stimmen - a._count.stimmen;
  });

  return (
    <WunschVerwaltung
      wuensche={sortiert.map((w) => ({
        id: w.id,
        text: w.text,
        name: w.name,
        stimmen: w._count.stimmen,
        erledigt: w.erledigt,
        antwort: w.antwort,
      }))}
    />
  );
}
