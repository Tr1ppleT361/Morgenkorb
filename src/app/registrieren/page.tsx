/** Seite zum Anlegen eines Kontos. */
import { redirect } from "next/navigation";
import { aktuellerNutzer } from "@/lib/auth";
import { KontoFormular } from "@/components/KontoFormular";

export const dynamic = "force-dynamic";

export default async function RegistrierSeite({
  searchParams,
}: {
  searchParams: Promise<{ ziel?: string }>;
}) {
  if (await aktuellerNutzer()) redirect("/");

  const { ziel } = await searchParams;
  return <KontoFormular art="registrieren" ziel={ziel ?? "/"} />;
}
