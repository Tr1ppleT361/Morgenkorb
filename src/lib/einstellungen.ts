/**
 * Einstellungen, die der Admin über die Website ändern kann.
 *
 * Bisher stand der Bestellschluss fest in src/config.ts. Jetzt liegt er in
 * der Datenbank (Tabelle Setting) und lässt sich im Admin ändern.
 * Die Werte aus config.ts dienen nur noch als Startwerte, falls in der
 * Datenbank noch nichts steht.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";

export const SCHLUESSEL = {
  start: "bestellStart",
  ende: "bestellEnde",
  aktiv: "bestellAktiv",
} as const;

export type Bestellzeiten = {
  /** "06:00" */
  start: string;
  /** "20:00" */
  ende: string;
  /** Kann der Admin Bestellungen komplett pausieren? */
  aktiv: boolean;
};

/** "20:00" -> 1200 Minuten. Ungültiges gibt null. */
export function alsMinuten(zeit: string): number | null {
  const treffer = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(zeit.trim());
  if (!treffer) return null;
  return Number(treffer[1]) * 60 + Number(treffer[2]);
}

/** 1200 -> "20:00" */
export function alsZeit(minuten: number): string {
  const m = ((minuten % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Der Startwert, falls in der Datenbank noch nichts steht. */
function standardEnde(): string {
  return alsZeit(
    config.bestellschluss.stunde * 60 + config.bestellschluss.minute,
  );
}

/**
 * Liest die Bestellzeiten. `cache` sorgt dafür, dass die Datenbank pro
 * Seitenaufruf nur einmal gefragt wird.
 */
export const bestellzeiten = cache(async (): Promise<Bestellzeiten> => {
  let zeilen: { schluessel: string; wert: string }[] = [];
  try {
    zeilen = await prisma.setting.findMany({
      where: { schluessel: { in: Object.values(SCHLUESSEL) } },
    });
  } catch {
    // Tabelle noch nicht da (z. B. beim allerersten Build) -> Startwerte
  }

  const map = new Map(zeilen.map((z) => [z.schluessel, z.wert]));

  const start = map.get(SCHLUESSEL.start) ?? "00:00";
  const ende = map.get(SCHLUESSEL.ende) ?? standardEnde();

  return {
    start: alsMinuten(start) === null ? "00:00" : start,
    ende: alsMinuten(ende) === null ? standardEnde() : ende,
    aktiv: (map.get(SCHLUESSEL.aktiv) ?? "1") !== "0",
  };
});

/** Speichert die Bestellzeiten. Wird nur vom Admin aufgerufen. */
export async function bestellzeitenSpeichern(z: Bestellzeiten): Promise<void> {
  const werte: [string, string][] = [
    [SCHLUESSEL.start, z.start],
    [SCHLUESSEL.ende, z.ende],
    [SCHLUESSEL.aktiv, z.aktiv ? "1" : "0"],
  ];

  await prisma.$transaction(
    werte.map(([schluessel, wert]) =>
      prisma.setting.upsert({
        where: { schluessel },
        update: { wert },
        create: { schluessel, wert },
      }),
    ),
  );
}
