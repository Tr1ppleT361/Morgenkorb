/**
 * E-Mail-Versand.
 *
 * Wir sprechen Resend direkt über deren HTTP-Schnittstelle an – dafür
 * braucht es kein zusätzliches Paket, nur `fetch`.
 *
 * Nötig sind zwei Umgebungsvariablen:
 *   RESEND_API_KEY  = der Schlüssel aus deinem Resend-Konto
 *   MAIL_ABSENDER   = z. B. "Morgenkorb <noreply@deine-domain.de>"
 *
 * Fehlt der Schlüssel, wird nichts verschickt. Der Code landet dann im
 * Server-Log, damit man die Anmeldung trotzdem testen kann – aber nur,
 * wenn ausdrücklich MAIL_TESTMODUS=1 gesetzt ist.
 */

export type MailErgebnis =
  | { ok: true; verschickt: boolean }
  | { ok: false; fehler: string };

export function mailEingerichtet(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_ABSENDER);
}

export function testmodus(): boolean {
  return process.env.MAIL_TESTMODUS === "1";
}

/** Verschickt eine E-Mail. */
export async function mailSenden(
  an: string,
  betreff: string,
  text: string,
  html: string,
): Promise<MailErgebnis> {
  if (!mailEingerichtet()) {
    if (testmodus()) {
      console.log(`[TESTMODUS] Mail an ${an}: ${betreff}\n${text}`);
      return { ok: true, verschickt: false };
    }
    return {
      ok: false,
      fehler:
        "Der E-Mail-Versand ist nicht eingerichtet (RESEND_API_KEY und MAIL_ABSENDER fehlen).",
    };
  }

  try {
    const antwort = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_ABSENDER,
        to: [an],
        subject: betreff,
        text,
        html,
      }),
      // Nicht ewig hängen bleiben, wenn der Dienst klemmt
      signal: AbortSignal.timeout(10_000),
    });

    if (!antwort.ok) {
      const koerper = await antwort.text().catch(() => "");
      console.error("Mailversand fehlgeschlagen:", antwort.status, koerper);

      // 422 heißt bei Resend meist: Adresse existiert nicht / abgelehnt
      if (antwort.status === 422) {
        return {
          ok: false,
          fehler: "Diese E-Mail-Adresse wurde abgelehnt. Stimmt sie so?",
        };
      }
      return { ok: false, fehler: "Die E-Mail konnte nicht verschickt werden." };
    }

    return { ok: true, verschickt: true };
  } catch (e) {
    console.error("Mailversand fehlgeschlagen:", e);
    return { ok: false, fehler: "Die E-Mail konnte nicht verschickt werden." };
  }
}

/** Die Bestätigungsmail zur Registrierung. */
export async function bestaetigungsmailSenden(
  an: string,
  name: string,
  code: string,
): Promise<MailErgebnis> {
  const betreff = `${code} ist dein Bestätigungscode`;

  const text = [
    `Hallo ${name},`,
    ``,
    `dein Bestätigungscode für Morgenkorb lautet:`,
    ``,
    `    ${code}`,
    ``,
    `Gib ihn auf der Seite ein, um dein Konto freizuschalten.`,
    `Der Code gilt 30 Minuten.`,
    ``,
    `Wenn du dich nicht angemeldet hast, kannst du diese Mail einfach löschen.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#2c2119">
      <p style="font-size:16px">Hallo ${escapeHtml(name)},</p>
      <p style="font-size:16px">dein Bestätigungscode für <strong>Morgenkorb</strong> lautet:</p>
      <p style="font-size:34px;font-weight:700;letter-spacing:.22em;background:#faebd1;
                color:#b04a2d;padding:18px 12px;border-radius:14px;text-align:center;margin:24px 0">
        ${escapeHtml(code)}
      </p>
      <p style="font-size:15px;color:#84715f">
        Gib ihn auf der Seite ein, um dein Konto freizuschalten. Der Code gilt 30 Minuten.
      </p>
      <p style="font-size:13px;color:#84715f">
        Wenn du dich nicht angemeldet hast, kannst du diese Mail einfach löschen.
      </p>
    </div>`;

  return mailSenden(an, betreff, text, html);
}

/** Schützt vor eingeschleustem HTML in der Mail. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
