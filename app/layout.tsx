import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import AchievementToast from "@/components/AchievementToast";
import CookieBanner from "@/components/CookieBanner";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

// Noto fallbacks for locales whose scripts are not covered by Inter:
// hi (Devanagari) and ja (CJK). The CSS variables are wired up in
// globals.css behind html[lang="..."] selectors so the rest of the UI
// keeps using its default sans without swapping the entire stack.
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-deva",
  display: "swap",
});

const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
});

// hreflang map. x-default points at English so search engines treat the
// canonical English page as the fallback for any unmatched locale.
const HREFLANG_MAP = {
  en: BASE,
  nl: BASE,
  de: BASE,
  fr: BASE,
  es: BASE,
  hi: BASE,
  "pt-BR": BASE,
  ja: BASE,
  "x-default": BASE,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "BrainArena — Free Daily Puzzles & Word Games",
    template: "%s | BrainArena",
  },
  description:
    "Play free Wordle, Boggle, Sudoku, logic puzzles and typing games. Compete globally in 8 languages.",
  alternates: {
    canonical: BASE,
    languages: HREFLANG_MAP,
  },
  openGraph: {
    title: "BrainArena — Free Daily Puzzles & Word Games",
    description:
      "Play free Wordle, Boggle, Sudoku, logic puzzles and typing games. Compete globally in 8 languages.",
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
    <html
      lang="en"
      className={`antialiased ${notoDevanagari.variable} ${notoJp.variable}`}
    >
      <body className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] text-white">
        {/* Site-wide structured data — Organization + WebSite. Game-specific
            VideoGame schemas live in each game's layout.tsx; homepage adds
            an ItemList of games. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${BASE}#organization`,
                name: "BrainArena",
                url: BASE,
                logo: `${BASE}/icon.png`,
                sameAs: [],
              },
              {
                "@type": "WebSite",
                "@id": `${BASE}#website`,
                url: BASE,
                name: "BrainArena",
                description:
                  "Free daily puzzles and word games — Wordle, Boggle, Sudoku, logic puzzles and more.",
                publisher: { "@id": `${BASE}#organization` },
                inLanguage: ["en", "nl", "de", "fr", "es", "pt-BR"],
              },
            ],
          }}
        />
        {/* Plausible analytics — cookieless, GDPR-exempt by design (no
            cookies, no fingerprinting, IP anonymised before storage).
            Loads unconditionally; the "Analytics" toggle in CookieBanner
            is reserved for any future cookie-based analytics tool. */}
        <Script
          defer
          data-domain="brainarena.fun"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <NavBar />
        <main className="flex-1">{children}</main>
        <AchievementToast />
        {/* CookieBanner mounts the AdSense loader only after the user
            opts in to advertising cookies. NEXT_PUBLIC_ADSENSE_CLIENT
            controls which publisher ID is used; until it's set, no
            external script loads even with consent. */}
        <CookieBanner />
        <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-6 text-xs text-gray-500">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} BrainArena · Free daily puzzles & word games</p>
            <nav className="flex flex-wrap items-center gap-4">
              <Link href="/how-to-play" className="hover:text-indigo-300">How to play</Link>
              <Link href="/about" className="hover:text-indigo-300">About</Link>
              <Link href="/privacy" className="hover:text-indigo-300">Privacy</Link>
              <Link href="/contact" className="hover:text-indigo-300">Contact</Link>
              <Link href="/leaderboard" className="hover:text-indigo-300">Leaderboard</Link>
              <Link href="/achievements" className="hover:text-indigo-300">Achievements</Link>
              <CookieSettingsLink />
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
