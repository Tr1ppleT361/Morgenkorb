/** Seite zur Eingabe des Bestätigungscodes. */
import { redirect } from "next/navigation";
import { CodeFormular } from "@/components/CodeFormular";

export const dynamic = "force-dynamic";

export default async function BestaetigenSeite({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; ziel?: string; neu?: string }>;
}) {
  const { email, ziel, neu } = await searchParams;

  // Ohne Adresse ergibt die Seite keinen Sinn
  if (!email) redirect("/registrieren");

  return (
    <CodeFormular
      email={email}
      ziel={ziel ?? "/"}
      frischVerschickt={neu === "1"}
    />
  );
}
