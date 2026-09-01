/**
 * Layout für alle /admin-Seiten.
 *
 * Hier wird geprüft, ob ein Admin angemeldet ist. Wenn nicht, geht es zur
 * normalen Anmeldeseite – es gibt also nur EIN Login für alle.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminIstEingerichtet, aktuellerNutzer } from "@/lib/auth";
import { AdminNavigation } from "./AdminNavigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nutzer = await aktuellerNutzer();

  // Nicht angemeldet -> zur Anmeldeseite, danach zurück zum Admin
  if (!nutzer) {
    redirect("/anmelden?ziel=%2Fadmin");
  }

  // Angemeldet, aber kein Admin
  if (nutzer.rolle !== "ADMIN") {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="karte p-6 text-center">
          <h1 className="font-titel text-xl font-bold">Kein Zugriff</h1>
          <p className="mt-2 text-sm text-leise">
            Dieser Bereich ist nur für den Einkauf. Du bist als{" "}
            <span className="font-semibold text-tinte">{nutzer.email}</span>{" "}
            angemeldet.
          </p>
          {!adminIstEingerichtet() && (
            <p className="mt-4 rounded-weich bg-honigHell px-3 py-2 text-left text-xs text-ziegel">
              Hinweis: Es sind noch keine Admin-Zugangsdaten hinterlegt. Trage{" "}
              <code className="font-mono">ADMIN_EMAIL</code> und{" "}
              <code className="font-mono">ADMIN_PASSWORT</code> in die
              Umgebungsvariablen ein.
            </p>
          )}
          <Link href="/" className="btn-zweit mt-5 w-full">
            Zur Bestellseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="etikett">Angemeldet als {nutzer.name}</p>
          <h1 className="font-titel text-3xl font-bold leading-tight">
            Verwaltung
          </h1>
        </div>
        <Link href="/konto" className="btn-zweit shrink-0 !px-3 text-sm">
          Konto
        </Link>
      </div>

      <AdminNavigation />

      <div className="mt-5">{children}</div>

      <p className="mt-10 text-center text-xs text-leise">
        <Link href="/" className="underline">
          Zur Bestellseite
        </Link>
      </p>
    </main>
  );
}
