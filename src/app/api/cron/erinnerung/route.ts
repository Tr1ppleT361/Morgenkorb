/**
 * Erinnerung vor Bestellschluss.
 *
 * Wird von einem Vercel-Cron regelmäßig aufgerufen (siehe vercel.json).
 * Wer eingestellt hat, erinnert werden zu wollen, und kurz vor
 * Bestellschluss noch etwas im Korb hat, bekommt eine Mail.
 *
 * Damit das überhaupt geht, speichern angemeldete Nutzer ihren Warenkorb
 * zusätzlich auf dem Server (Tabelle Cart).
 *
 * Absicherung: Vercel schickt bei Cron-Aufrufen den CRON_SECRET als
 * Authorization-Kopfzeile. Ohne den passiert hier nichts.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bestellfenster } from "@/lib/bestellschluss";
import { mailEingerichtet, mailSenden } from "@/lib/email";
import { basisAdresse } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** So viele Minuten vor Schluss wird erinnert. */
const VORLAUF_MINUTEN = 60;

export async function GET(anfrage: Request) {
  // Nur Vercel-Cron (oder wer das Geheimnis kennt) darf hier rein
  const geheim = process.env.CRON_SECRET;
  if (geheim) {
    const kopf = anfrage.headers.get("authorization");
    if (kopf !== `Bearer ${geheim}`) {
      return NextResponse.json({ fehler: "Nicht erlaubt." }, { status: 401 });
    }
  }

  const fenster = await bestellfenster();

  // Nur im richtigen Zeitfenster erinnern
  if (!fenster.offen || fenster.minutenRest > VORLAUF_MINUTEN) {
    return NextResponse.json({
      erinnert: 0,
      grund: fenster.offen ? "noch zu früh" : "geschlossen",
    });
  }

  if (!mailEingerichtet()) {
    return NextResponse.json({ erinnert: 0, grund: "Mailversand fehlt" });
  }

  // Heute schon erinnert? Dann nicht nochmal.
  const heuteFrueh = new Date();
  heuteFrueh.setHours(0, 0, 0, 0);

  const koerbe = await prisma.cart.findMany({
    where: {
      OR: [{ erinnertAm: null }, { erinnertAm: { lt: heuteFrueh } }],
      user: { erinnerung: true, emailVerifiziertAm: { not: null } },
    },
    include: { user: true },
    take: 200,
  });

  const basis = basisAdresse();
  let verschickt = 0;

  for (const korb of koerbe) {
    // Leerer Korb? Nichts zu erinnern.
    let anzahl = 0;
    try {
      const inhalt = JSON.parse(korb.inhalt) as Record<string, number>;
      anzahl = Object.values(inhalt).reduce((s, m) => s + (Number(m) || 0), 0);
    } catch {
      continue;
    }
    if (anzahl <= 0) continue;

    const text = [
      `Hallo ${korb.user.name},`,
      ``,
      `in deinem Morgenkorb liegen noch ${anzahl} ${anzahl === 1 ? "Teil" : "Teile"}.`,
      `Bestellschluss ist heute um ${fenster.ende} Uhr.`,
      ``,
      `Hier geht es zum Korb: ${basis}`,
      ``,
      `Keine Erinnerungen mehr? Unter "Konto" abschaltbar.`,
    ].join("\n");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#2c2119">
        <p style="font-size:16px">Hallo ${korb.user.name},</p>
        <p style="font-size:16px">
          in deinem Morgenkorb liegen noch
          <strong>${anzahl} ${anzahl === 1 ? "Teil" : "Teile"}</strong>.
          Bestellschluss ist heute um <strong>${fenster.ende} Uhr</strong>.
        </p>
        <p style="margin:24px 0">
          <a href="${basis}" style="background:#b04a2d;color:#fff;padding:12px 20px;
             border-radius:12px;text-decoration:none;font-weight:700">Zum Korb</a>
        </p>
        <p style="font-size:12px;color:#84715f">
          Keine Erinnerungen mehr? Unter „Konto" abschaltbar.
        </p>
      </div>`;

    const ergebnis = await mailSenden(
      korb.user.email,
      `Noch ${anzahl} ${anzahl === 1 ? "Teil" : "Teile"} im Korb – Schluss um ${fenster.ende} Uhr`,
      text,
      html,
    );

    if (ergebnis.ok) {
      verschickt++;
      await prisma.cart.update({
        where: { userId: korb.userId },
        data: { erinnertAm: new Date() },
      });
    }
  }

  return NextResponse.json({ erinnert: verschickt, geprueft: koerbe.length });
}
