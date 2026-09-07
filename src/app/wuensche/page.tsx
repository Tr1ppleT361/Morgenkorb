/** Produktwünsche: vorschlagen und unterstützen. */
import { prisma } from "@/lib/prisma";
import { aktuellerNutzer } from "@/lib/auth";
import { WunschListe } from "./WunschListe";

export const dynamic = "force-dynamic";

export default async function WuenscheSeite() {
  const nutzer = await aktuellerNutzer();

  const wuensche = await prisma.wunsch.findMany({
    orderBy: [{ erledigt: "asc" }, { erstelltAm: "desc" }],
    include: {
      _count: { select: { stimmen: true } },
      stimmen: nutzer ? { where: { userId: nutzer.id } } : false,
    },
    take: 100,
  });

  // Nach Stimmen sortieren, Erledigte nach hinten
  const sortiert = [...wuensche].sort((a, b) => {
    if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
    return b._count.stimmen - a._count.stimmen;
  });

  return (
    <WunschListe
      angemeldet={Boolean(nutzer)}
      wuensche={sortiert.map((w) => ({
        id: w.id,
        text: w.text,
        name: w.name,
        stimmen: w._count.stimmen,
        erledigt: w.erledigt,
        antwort: w.antwort,
        eigeneStimme: Array.isArray(w.stimmen) ? w.stimmen.length > 0 : false,
      }))}
    />
  );
}
