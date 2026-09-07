/** Kunde ändert oder storniert seine eigene Bestellung. */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aktuellerNutzer } from "@/lib/auth";
import { aenderbarkeit, aenderGrundText } from "@/lib/aenderfrist";
import { summeCent } from "@/lib/geld";
import { AenderFormular } from "./AenderFormular";

export const dynamic = "force-dynamic";

export default async function AendernSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bestellung = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!bestellung) notFound();

  // Bestellungen mit Konto darf nur der Besitzer sehen
  if (bestellung.userId) {
    const nutzer = await aktuellerNutzer();
    if (!nutzer || nutzer.id !== bestellung.userId) {
      redirect(`/anmelden?ziel=${encodeURIComponent(`/bestellung/${id}/aendern`)}`);
    }
  }

  const darf = await aenderbarkeit(bestellung);

  if (!darf.erlaubt) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="karte p-6 text-center">
          <h1 className="font-titel text-xl font-bold">Ändern nicht mehr möglich</h1>
          <p className="mt-2 text-sm text-leise">{aenderGrundText(darf)}</p>
          <Link href={`/bestellung/${id}`} className="btn-zweit mt-5 w-full">
            Zurück zur Bestellung
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AenderFormular
      orderId={id}
      frist={darf.frist}
      bezahlt={bestellung.zahlstatus === "BEZAHLT"}
      summe={summeCent(bestellung.items)}
      artikel={bestellung.items.map((i) => ({
        id: i.id,
        name: i.variantName
          ? `${i.product.name} – ${i.variantName}`
          : i.product.name,
        menge: i.menge,
        preis: i.preisBeimKauf,
      }))}
    />
  );
}
