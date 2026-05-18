import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import NavBar from "@/components/NavBar";
import AchievementToast from "@/components/AchievementToast";
import NameGate from "@/components/NameGate";
import CookieBanner from "@/components/CookieBanner";
import FooterNav from "@/components/FooterNav";
import JsonLd from "@/components/JsonLd";
import ChunkErrorRecovery from "@/components/ChunkErrorRecovery";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";
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

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "BrainArena — Free Daily Puzzles & Word Games",
    template: "%s | BrainArena",
  },
  description:
    "Play free Wordle, Boggle, Sudoku, logic puzzles and typing games. Compete globally in 8 languages.",
  // Default metadata applies to the flat (English-canonical) home at /.
  // Per-route layouts and /[locale]/* pages override these via their own
  // generateMetadata / metadata exports.
  alternates: {
    canonical: canonicalUrlFor("/", "en"),
    languages: generateHreflangAlternates("/"),
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
      // Inline style is render-blocking and applies before the external
      // CSS bundle arrives — without this, mobile cold-load shows a
      // ~1-2s white flash because the Tailwind classes on <body> (and
      // the html/body rule in globals.css) only kick in once the CSS
      // file is parsed. The inline color matches `--bg` in globals.css.
      style={{ background: "#0a0a0a", colorScheme: "dark" }}
    >
      <body
        className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] text-white"
        style={{ background: "#0a0a0a", color: "#ffffff" }}
      >
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
        <ChunkErrorRecovery />
        <NavBar />
        <main className="flex-1">{children}</main>
        <AchievementToast />
        {/* Prompts for player name on first score submission so leaderboard
            entries have real identities instead of "Anonymous". */}
        <NameGate />
        {/* CookieBanner mounts the AdSense loader only after the user
            opts in to advertising cookies. NEXT_PUBLIC_ADSENSE_CLIENT
            controls which publisher ID is used; until it's set, no
            external script loads even with consent. */}
        <CookieBanner />
        <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-6 text-xs text-gray-500">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} BrainArena · Free daily puzzles & word games</p>
            <FooterNav />
          </div>
        </footer>
      </body>
    </html>
  );
}
