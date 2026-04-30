import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    "",
    "wordle",
    "boggle",
    "sudoku",
    "typing",
    "tiledrop",
    "wordbuild",
    "colormatch",
    "cityplanner",
    "letterstack",
    "achievements",
    "leaderboard",
    "how-to-play",
    "privacy",
    "contact",
  ].map((p) => ({
    url: p ? `${BASE}/${p}` : BASE,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1.0 : 0.8,
  }));
}
