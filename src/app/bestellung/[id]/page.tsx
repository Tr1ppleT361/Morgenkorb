/**
 * Bestätigungsseite nach dem Absenden.
 * Die Adresse enthält die zufällige Bestell-ID, z. B. /bestellung/clx123...
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { euro, summeCent } from "@/lib/geld";
import { config } from "@/config";

export const dynamic = "force-dynamic";

export default async function Bestaetigung({
  params,
}: {
  // In Next.js 15 sind params ein Promise – deshalb das await unten.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bestellung = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!bestellung) notFound();

  const summe = summeCent(bestellung.items);

  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: config.zeitzone,
  }).format(bestellung.erstelltAm);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="karte p-6 text-center">
        <div className="text-5xl" aria-hidden>
          ✅
        </div>
        <h1 className="mt-3 text-2xl font-bold">Bestellung eingegangen!</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Danke, {bestellung.name}! Deine Sachen sind morgen früh da.
        </p>
      </div>

      <div className="karte mt-4 p-4">
        <h2 className="mb-3 text-lg font-bold">Deine Artikel</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {bestellung.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <span className="w-10 shrink-0 font-bold text-korb-700 dark:text-korb-400">
                {item.menge}×
              </span>
              <span className="min-w-0 flex-1">{item.product.name}</span>
              <span className="tabular-nums">
                {euro(item.menge * item.preisBeimKauf)}
              </span>
            </li>
          ))}
        </ul>

        {bestellung.notiz && (
          <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-800">
            <span className="font-semibold">Notiz:</span> {bestellung.notiz}
          </p>
        )}
      </div>

      {/* Der wichtigste Teil: was mitzubringen ist */}
      <div className="karte mt-4 border-korb-300 bg-korb-50 p-6 text-center dark:border-korb-800 dark:bg-korb-900/30">
        <p className="text-sm font-semibold uppercase tracking-wide text-korb-800 dark:text-korb-300">
          Bitte mitbringen
        </p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{euro(summe)}</p>
        <p className="mt-2 text-sm text-korb-900 dark:text-korb-200">
          {config.uebergabeHinweis}
        </p>
      </div>

      <dl className="mt-4 space-y-1 px-1 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex justify-between">
          <dt>Klasse</dt>
          <dd>{bestellung.klasse}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Bestellt am</dt>
          <dd>{datum} Uhr</dd>
        </div>
        <div className="flex justify-between">
          <dt>Bestellnummer</dt>
          <dd className="font-mono text-xs">{bestellung.id}</dd>
        </div>
      </dl>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-ghost flex-1">
          Zurück zur Startseite
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Tipp: Speichere diese Seite als Lesezeichen, dann findest du deine
        Bestellung wieder.
      </p>
    </main>
  );
}
