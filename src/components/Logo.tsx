/**
 * Der Korb als gezeichnetes Zeichen – kein Emoji.
 * Emoji sehen auf jedem Gerät anders aus und wirken beliebig;
 * eine eigene Zeichnung gibt der Seite ein Gesicht.
 */
export function KorbZeichen({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Henkel */}
      <path
        d="M11 13c0-3.6 2.2-6 5-6s5 2.4 5 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Korbkörper */}
      <path
        d="M5.5 13.5h21l-2.1 11.2a3 3 0 0 1-2.9 2.4H10.5a3 3 0 0 1-2.9-2.4L5.5 13.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Geflecht */}
      <path
        d="M11.4 17.2 12.6 24M16 17.2V24m4.6-6.8L19.4 24"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
