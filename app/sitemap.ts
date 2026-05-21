import type { MetadataRoute } from "next";
import { generateHreflangAlternates } from "@/lib/seo/hreflang";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

// Routes for which hreflang sitemap-alternates should be emitted. Must
// stay in lockstep with LOCALIZED_PATHS in lib/seo/hreflang.ts: a path
// appears here only after its /<locale>/<path> subtree exists.
const LOCALIZED_SITEMAP_PATHS: ReadonlySet<string> = new Set<string>([
  "/",
  "/wordle",
  "/boggle",
  "/sudoku",
  "/typing",
  "/tiledrop",
  "/colormatch",
  "/letterstack",
  "/vlakken",
  "/verbind",
  "/zonmaan",
  "/kronen",
  "/minesweeper",
  "/connections",
  "/how-to-play",
]);

// Pages whose content genuinely changes daily (a new daily puzzle, live
// scores). Everything else is near-static and gets a "monthly" hint so
// the sitemap doesn't claim a freshness it doesn't have.
const DAILY_PATHS: ReadonlySet<string> = new Set<string>([
  "",
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "colormatch",
  "letterstack",
  "vlakken",
  "verbind",
  "zonmaan",
  "kronen",
  "minesweeper",
  "connections",
  "leaderboard",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "",
    "wordle",
    "boggle",
    "sudoku",
    "typing",
    "tiledrop",
    "colormatch",
    "letterstack",
    "vlakken",
    "verbind",
    "zonmaan",
    "kronen",
    "minesweeper",
    "connections",
    "achievements",
    "leaderboard",
    "how-to-play",
    "about",
    "privacy",
    "contact",
  ];
  return paths.map((p) => {
    const path = p ? `/${p}` : "/";
    const entry: MetadataRoute.Sitemap[number] = {
      url: p ? `${BASE}/${p}` : BASE,
      lastModified: now,
      changeFrequency: DAILY_PATHS.has(p) ? "daily" : "monthly",
      priority: p === "" ? 1.0 : 0.8,
    };
    if (LOCALIZED_SITEMAP_PATHS.has(path)) {
      entry.alternates = { languages: generateHreflangAlternates(path) };
    }
    return entry;
  });
}
