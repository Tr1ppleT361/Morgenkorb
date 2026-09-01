"use client";

import { useEffect, useState } from "react";

/**
 * Umschalter hell/dunkel. Statt Emoji zwei gezeichnete Symbole –
 * die passen sich der Farbe an und sehen überall gleich aus.
 */
export function ThemeToggle() {
  const [dunkel, setDunkel] = useState(false);
  const [montiert, setMontiert] = useState(false);

  useEffect(() => {
    setMontiert(true);
    setDunkel(document.documentElement.classList.contains("dark"));
  }, []);

  function umschalten() {
    const neu = !dunkel;
    setDunkel(neu);
    document.documentElement.classList.toggle("dark", neu);
    localStorage.setItem("theme", neu ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      aria-label={dunkel ? "Helles Design" : "Dunkles Design"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-weich border border-linie bg-karte text-leise transition hover:text-honig"
    >
      {montiert && dunkel ? (
        // Sonne
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Mond
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
