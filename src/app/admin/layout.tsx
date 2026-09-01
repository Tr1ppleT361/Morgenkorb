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
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Es ist kein Admin-Passwort hinterlegt. Trage die Umgebungsvariable{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <form action={ausloggen}>
          <button type="submit" className="text-sm text-slate-500 underline">
            Abmelden
          </button>
        </form>
      </div>

      <AdminNavigation />

      <div className="mt-4">{children}</div>

      <p className="mt-10 text-center text-xs text-slate-400">
        <Link href="/" className="underline">
          Zur Bestellseite
        </Link>
      </p>
    </main>
  );
}
