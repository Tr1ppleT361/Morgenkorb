/** Admin: Bestellzeiten einstellen. */
import { bestellzeiten, shopEinstellungen } from "@/lib/einstellungen";
import { bestellfenster } from "@/lib/bestellschluss";
import { config } from "@/config";
import { ZeitenFormular } from "./ZeitenFormular";

export const dynamic = "force-dynamic";

export default async function EinstellungenSeite() {
  const zeiten = await bestellzeiten();
  const shop = await shopEinstellungen();
  const fenster = await bestellfenster();

  return (
    <div className="space-y-5">
      {/* Aktueller Zustand */}
      <div className="karte flex items-center gap-3 p-4">
        <span
          className={
            "h-3 w-3 shrink-0 rounded-full " +
            (fenster.offen ? "bg-moos" : "bg-leise")
          }
        />
        <p className="text-sm">
          <span className="font-semibold">
            {fenster.offen ? "Gerade offen" : "Gerade geschlossen"}
          </span>
          <span className="text-leise">
            {" "}
            · Zeitzone {config.zeitzone}
          </span>
        </p>
      </div>

      <ZeitenFormular
        start={zeiten.start}
        ende={zeiten.ende}
        aktiv={zeiten.aktiv}
        abholOrt={shop.abholOrt}
        abholZeit={shop.abholZeit}
        limitCent={shop.limitCent}
        aenderFrist={shop.aenderFrist}
      />

      <div className="karte p-4 text-sm text-leise">
        <p className="font-semibold text-tinte">Wie das Fenster funktioniert</p>
        <ul className="mt-2 space-y-1.5">
          <li>
            Bestellt werden kann ab der Startzeit und bis zur Endzeit. Danach
            zeigt die Seite einen Hinweis und das Formular ist gesperrt.
          </li>
          <li>
            Die Sperre gilt auch auf dem Server – selbst wenn jemand im Browser
            trickst, wird die Bestellung abgelehnt.
          </li>
          <li>
            Ein Fenster über Mitternacht ist erlaubt: Start 18:00 und Ende 02:00
            bedeutet abends bis nachts um zwei.
          </li>
          <li>
            „Bestellungen angehalten" schließt sofort, egal welche Uhrzeit –
            praktisch, wenn du mal nicht einkaufen kannst.
          </li>
        </ul>
      </div>
    </div>
  );
}
