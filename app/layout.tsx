import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "BrainArena — Free Daily Puzzles & Word Games",
    template: "%s | BrainArena",
  },
  description:
    "Play free Wordle, Boggle, Sudoku, TileDrop and typing games. Compete globally in 5 languages.",
  alternates: { canonical: BASE },
  openGraph: {
    title: "BrainArena — Free Daily Puzzles & Word Games",
    description:
      "Play free Wordle, Boggle, Sudoku, TileDrop and typing games. Compete globally in 5 languages.",
    type: "website",
    url: BASE,
    siteName: "BrainArena",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* AdSense placeholder — replace ca-pub-XXXXXXXX with your real publisher id */}
        <Script
          id="adsense-loader"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-white">Brain</span>
              <span className="text-indigo-400">Arena</span>
            </Link>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <Link href="/wordle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Wordle</Link>
              <Link href="/boggle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Boggle</Link>
              <Link href="/sudoku" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Sudoku</Link>
              <Link href="/typing" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Typing</Link>
              <Link href="/tiledrop" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">TileDrop</Link>
              <Link href="/wordbuild" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">WordBuild</Link>
              <Link href="/colormatch" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">ColorMatch</Link>
              <Link href="/cityplanner" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">CityPlanner</Link>
              <Link href="/letterstack" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">LetterStack</Link>
              <Link href="/leaderboard" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Leaderboard</Link>
            </div>
            <LanguageSwitcher />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} BrainArena · Free daily puzzles & word games
        </footer>
      </body>
    </html>
  );
}
