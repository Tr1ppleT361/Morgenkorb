/**
 * Layout für alle /admin-Seiten.
 * Hier wird geprüft, ob man eingeloggt ist. Wenn nicht, zeigen wir
 * statt der Seite einfach das Login-Formular.
 */
import Link from "next/link";
import { istAdmin } from "@/lib/auth";
import { LoginFormular } from "./LoginFormular";
import { ausloggen } from "./actions";
import { AdminNavigation } from "./AdminNavigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
