import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { config } from "@/config";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KorbZeichen } from "@/components/Logo";
import { KontoKnopf } from "@/components/KontoKnopf";

/**
 * Zwei Schriften geben der Seite Charakter:
 * - Fraunces: eine weiche Serifenschrift für Überschriften und Preise.
 *   Wirkt handgemacht, fast wie ein Ladenschild.
 * - Nunito: eine runde, freundliche Schrift für alles andere.
 */
const titelSchrift = Fraunces({
  subsets: ["latin"],
  // Fraunces ist eine "variable font": alle Strichstärken stecken in einer
  // Datei. Über die Achsen SOFT und WONK bekommt sie ihre weichen, leicht
  // eigenwilligen Formen – genau das, was die Seite gemütlich macht.
  axes: ["SOFT", "WONK"],
  variable: "--font-titel",
  display: "swap",
});

const textSchrift = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: config.appName,
  description: config.slogan,
};

export const viewport: Viewport = {
  themeColor: "#F7F1E7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${titelSchrift.variable} ${textSchrift.variable}`}
    >
      <head>
        {/*
          Läuft vor dem ersten Rendern und setzt die Klasse "dark".
          So blitzt beim Laden nicht kurz die helle Seite auf.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var g = localStorage.getItem('theme');
                  var dunkel = g === 'dark' || (!g && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', dunkel);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-30 border-b border-linie bg-grund/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-weich bg-honigHell text-ziegel transition group-hover:rotate-[-4deg]">
                <KorbZeichen className="h-6 w-6" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-titel text-[1.35rem] font-bold tracking-tight">
                  {config.appName}
                </span>
                <span className="mt-0.5 hidden text-xs text-leise sm:block">
                  {config.slogan}
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <KontoKnopf />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {children}

        <footer className="mx-auto max-w-5xl px-4 pb-8 pt-12 text-center text-xs text-leise">
          <span className="inline-flex items-center gap-1.5">
            <KorbZeichen className="h-4 w-4" />
            {config.appName} · bar bezahlen bei der Übergabe
          </span>
        </footer>
      </body>
    </html>
  );
}
