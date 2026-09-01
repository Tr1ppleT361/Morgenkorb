import type { Metadata, Viewport } from "next";
import "./globals.css";
import { config } from "@/config";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export const metadata: Metadata = {
  title: config.appName,
  description: config.slogan,
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/*
          Dieses kleine Skript läuft VOR dem ersten Rendern und setzt die
          Klasse "dark" am <html>-Element. So blitzt beim Laden nicht kurz
          die helle Seite auf, wenn man Dark Mode gewählt hat.
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
        {/* Kopfzeile – klebt oben fest */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                🧺
              </span>
              <span className="text-lg font-bold">{config.appName}</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
