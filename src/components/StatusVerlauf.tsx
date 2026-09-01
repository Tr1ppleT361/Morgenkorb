import { STATUS_REIHE, statusStufe, statusText } from "@/lib/status";

/**
 * Die Verfolgungsanzeige für den Kunden:
 * Bestellung erhalten -> Wird bearbeitet -> Versendet -> Zugestellt
 */
export function StatusVerlauf({
  status,
  verlauf,
  zeitzone,
}: {
  status: string;
  /** Wann wurde welcher Status gesetzt? */
  verlauf: { status: string; am: Date; notiz: string | null }[];
  zeitzone: string;
}) {
  if (status === "STORNIERT") {
    const t = statusText(status);
    return (
      <div className="karte border-beere/40 bg-beere/8 p-4">
        <p className="font-semibold text-beere">{t.titel}</p>
        <p className="mt-1 text-sm text-leise">{t.erklaerung}</p>
      </div>
    );
  }

  const jetzigeStufe = statusStufe(status);
  const zeitFormat = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: zeitzone,
  });

  return (
    <ol className="karte space-y-0 p-4">
      {STATUS_REIHE.map((s, i) => {
        const t = statusText(s);
        const erreicht = i <= jetzigeStufe;
        const istJetzt = i === jetzigeStufe;
        // Wann wurde dieser Schritt erreicht?
        const eintrag = verlauf.find((v) => v.status === s);

        return (
          <li key={s} className="flex gap-3">
            {/* Punkt + Linie */}
            <div className="flex flex-col items-center">
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition " +
                  (erreicht
                    ? "border-moos bg-moos text-white"
                    : "border-linie bg-karte text-transparent")
                }
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                  <path
                    d="m5 12.5 4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {i < STATUS_REIHE.length - 1 && (
                <span
                  className={
                    "w-0.5 flex-1 " + (i < jetzigeStufe ? "bg-moos" : "bg-linie")
                  }
                />
              )}
            </div>

            {/* Text */}
            <div className={"pb-5 " + (i === STATUS_REIHE.length - 1 ? "pb-0" : "")}>
              <p
                className={
                  "font-semibold leading-7 " + (erreicht ? "" : "text-leise")
                }
              >
                {t.titel}
                {istJetzt && (
                  <span className="ml-2 rounded-full bg-honig px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    JETZT
                  </span>
                )}
              </p>
              {erreicht && (
                <p className="text-sm text-leise">{t.erklaerung}</p>
              )}
              {eintrag && (
                <p className="mt-0.5 text-xs text-leise ziffern">
                  {zeitFormat.format(eintrag.am)} Uhr
                </p>
              )}
              {eintrag?.notiz && (
                <p className="mt-1 rounded-weich bg-honigHell px-2.5 py-1.5 text-sm">
                  {eintrag.notiz}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
