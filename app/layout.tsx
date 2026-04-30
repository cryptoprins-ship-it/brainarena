import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import AchievementToast from "@/components/AchievementToast";
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
        <NavBar />
        <main className="flex-1">{children}</main>
        <AchievementToast />
        <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-6 text-xs text-gray-500">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} BrainArena · Free daily puzzles & word games</p>
            <nav className="flex flex-wrap items-center gap-4">
              <Link href="/how-to-play" className="hover:text-indigo-300">How to play</Link>
              <Link href="/privacy" className="hover:text-indigo-300">Privacy</Link>
              <Link href="/contact" className="hover:text-indigo-300">Contact</Link>
              <Link href="/leaderboard" className="hover:text-indigo-300">Leaderboard</Link>
              <Link href="/achievements" className="hover:text-indigo-300">Achievements</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
