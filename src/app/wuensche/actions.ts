"use server";

/**
 * Produktwünsche: Vorschlagen und Unterstützen.
 * Abstimmen geht nur mit Konto – sonst könnte einer beliebig oft klicken.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { aktuellerNutzer } from "@/lib/auth";
import { protokollieren } from "@/lib/protokoll";

export type WunschStatus = { fehler?: string; erfolg?: string };

export async function wunschAnlegen(
  _vorher: WunschStatus,
  formData: FormData,
): Promise<WunschStatus> {
  const text = String(formData.get("text") ?? "").trim();
  const nutzer = await aktuellerNutzer();
  const name = nutzer?.name ?? String(formData.get("name") ?? "").trim();

  if (text.length < 2) return { fehler: "Was wünschst du dir denn?" };
  if (text.length > 100) return { fehler: "Bitte etwas kürzer fassen." };
  if (name.length < 2) return { fehler: "Bitte gib deinen Namen an." };

  // Gibt es den Wunsch schon? Dann lieber dafür stimmen.
  const aehnlich = await prisma.wunsch.findFirst({
    where: { text: { equals: text, mode: "insensitive" }, erledigt: false },
  });
  if (aehnlich) {
    return {
      fehler: `„${aehnlich.text}" steht schon auf der Liste – stimm einfach dafür.`,
    };
  }

  const wunsch = await prisma.wunsch.create({
    data: { text, name: name.slice(0, 60), userId: nutzer?.id ?? null },
  });

  // Wer etwas vorschlägt, stimmt automatisch dafür
  if (nutzer) {
    await prisma.wunschStimme.create({
      data: { wunschId: wunsch.id, userId: nutzer.id },
    });
  }

  revalidatePath("/wuensche");
  revalidatePath("/admin/wuensche");
  return { erfolg: "Danke! Dein Wunsch steht auf der Liste." };
}

/** Stimme geben oder zurückziehen. */
export async function stimmeUmschalten(
  wunschId: string,
): Promise<{ ok: boolean; fehler?: string }> {
  const nutzer = await aktuellerNutzer();
  if (!nutzer)
    return { ok: false, fehler: "Zum Abstimmen brauchst du ein Konto." };

  const vorhanden = await prisma.wunschStimme.findUnique({
    where: { wunschId_userId: { wunschId, userId: nutzer.id } },
  });

  if (vorhanden) {
    await prisma.wunschStimme.delete({
      where: { wunschId_userId: { wunschId, userId: nutzer.id } },
    });
  } else {
    await prisma.wunschStimme.create({ data: { wunschId, userId: nutzer.id } });
  }

  revalidatePath("/wuensche");
  revalidatePath("/admin/wuensche");
  return { ok: true };
}

/** Admin: Wunsch als erledigt markieren, mit optionaler Antwort. */
export async function wunschErledigen(
  wunschId: string,
  erledigt: boolean,
  antwort?: string,
) {
  const { nurAdmin } = await import("@/lib/auth");
  const admin = await nurAdmin();

  const wunsch = await prisma.wunsch.update({
    where: { id: wunschId },
    data: { erledigt, antwort: antwort?.trim() || null },
  });

  await protokollieren({
    wer: admin.email,
    aktion: erledigt ? "Wunsch erledigt" : "Wunsch wieder geöffnet",
    objekt: `Wunsch „${wunsch.text}"`,
    details: antwort || undefined,
  });

  revalidatePath("/wuensche");
  revalidatePath("/admin/wuensche");
}
