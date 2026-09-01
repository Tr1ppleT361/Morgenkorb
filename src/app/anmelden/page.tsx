/** Anmeldeseite. */
import { redirect } from "next/navigation";
import { aktuellerNutzer } from "@/lib/auth";
import { KontoFormular } from "@/components/KontoFormular";

export const dynamic = "force-dynamic";

export default async function AnmeldeSeite({
  searchParams,
}: {
  searchParams: Promise<{ ziel?: string }>;
}) {
  // Schon angemeldet? Dann direkt weiter.
  if (await aktuellerNutzer()) redirect("/");

  const { ziel } = await searchParams;
  return <KontoFormular art="anmelden" ziel={ziel ?? "/"} />;
}
