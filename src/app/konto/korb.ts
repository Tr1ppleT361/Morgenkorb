"use server";

/**
 * Speichert den Warenkorb angemeldeter Nutzer auf dem Server.
 *
 * Zwei Gründe:
 *  1. Die Erinnerung vor Bestellschluss muss wissen, wer noch etwas im Korb hat.
 *  2. Der Korb überlebt einen Gerätewechsel.
 *
 * Gäste sind nicht betroffen – bei ihnen bleibt alles im Browser.
 */
import { prisma } from "@/lib/prisma";
import { aktuellerNutzer } from "@/lib/auth";

export async function korbSpeichern(inhalt: Record<string, number>) {
  const nutzer = await aktuellerNutzer();
  if (!nutzer) return;

  // Sicherheitsnetz gegen riesige Eingaben
  const eintraege = Object.entries(inhalt).slice(0, 200);
  const sauber = Object.fromEntries(
    eintraege.filter(([, menge]) => Number.isInteger(menge) && menge > 0),
  );

  const text = JSON.stringify(sauber);

  if (Object.keys(sauber).length === 0) {
    await prisma.cart.deleteMany({ where: { userId: nutzer.id } });
    return;
  }

  await prisma.cart.upsert({
    where: { userId: nutzer.id },
    update: { inhalt: text, erinnertAm: null },
    create: { userId: nutzer.id, inhalt: text },
  });
}

/** Erinnerungen an- oder abschalten. */
export async function erinnerungUmschalten(an: boolean) {
  const nutzer = await aktuellerNutzer();
  if (!nutzer) return;
  await prisma.user.update({
    where: { id: nutzer.id },
    data: { erinnerung: an },
  });
}
