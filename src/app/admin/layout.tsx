/**
 * Layout für alle /admin-Seiten.
 * Hier wird geprüft, ob man eingeloggt ist. Wenn nicht, zeigen wir
 * statt der Seite einfach das Login-Formular.
 */
import Link from "next/link";
import { adminIstEingerichtet, istAdmin } from "@/lib/auth";
import { LoginFormular } from "./LoginFormular";
import { ausloggen } from "./actions";
import { AdminNavigation } from "./AdminNavigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kein Passwort hinterlegt? Dann sagen wir das deutlich, statt eine
  // Login-Maske zu zeigen, bei der sich niemand anmelden könnte.
  if (!adminIstEingerichtet()) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="karte p-6">
          <h1 className="text-xl font-bold">Admin noch nicht eingerichtet</h1>
          <p className="mt-2 text-sm text-leise">
            Es ist kein Admin-Passwort hinterlegt. Trage die Umgebungsvariable{" "}
            <code className="rounded bg-honigHell px-1 font-mono text-[0.85em]">
              ADMIN_PASSWORD
            </code>{" "}
            ein – lokal in der Datei <code>.env</code>, auf Vercel unter
            Settings → Environment Variables. Danach einmal neu deployen.
          </p>
        </div>
      </main>
    );
  }

  if (!(await istAdmin())) {
    return <LoginFormular />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="etikett">Nur für dich</p>
          <h1 className="font-titel text-3xl font-bold leading-tight">
            Der Einkauf
          </h1>
        </div>
        <form action={ausloggen}>
          <button
            type="submit"
            className="rounded-weich border border-linie bg-karte px-3 py-2 text-sm font-semibold text-leise transition hover:text-tinte"
          >
            Abmelden
          </button>
        </form>
      </div>

      <AdminNavigation />

      <div className="mt-4">{children}</div>

      <p className="mt-10 text-center text-xs text-leise">
        <Link href="/" className="underline">
          Zur Bestellseite
        </Link>
      </p>
    </main>
  );
}
