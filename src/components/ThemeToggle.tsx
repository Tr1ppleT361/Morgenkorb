"use client";

import { useEffect, useState } from "react";

/**
 * Kleiner Knopf zum Umschalten zwischen hell und dunkel.
 * Die Auswahl wird im Browser (localStorage) gemerkt.
 */
export function ThemeToggle() {
  const [dunkel, setDunkel] = useState(false);
  // "montiert" verhindert, dass Server- und Browser-Ausgabe auseinanderlaufen
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
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-xl dark:border-slate-700"
    >
      {montiert ? (dunkel ? "☀️" : "🌙") : "🌙"}
    </button>
  );
}
