import type { Metadata } from "next";
import { SUPPORTED, type Locale } from "@/lib/locales";
import { translate } from "@/lib/i18n";
import { canonicalUrlFor, generateHreflangAlternates } from "./hreflang";

// Per-route layouts under app/[locale]/<route>/layout.tsx all need the
// same three things: validate the locale param, build a self-referencing
// canonical, and emit the full hreflang cluster for the path. Wrapping
// that in one helper keeps each route's layout to the metadata that's
// actually unique (title + description).
export async function buildLocaleMetadata({
  params,
  path,
  title,
  description,
}: {
  params: Promise<{ locale: string }>;
  path: string;
  title: string;
  description: string;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrlFor(path, safeLocale),
      languages: generateHreflangAlternates(path),
    },
  };
}

// Game-route variant: pulls the title and description from the i18n
// translations keyed off the game slug. Each game has matching
// `game_<slug>` and `game_<slug>_desc` keys translated across all 8
// locales, so visitors landing on /<locale>/<slug> see their language
// rendered in the browser tab and meta description.
// Limited to the games whose `game_<slug>` + `game_<slug>_desc` keys
// already exist in lib/i18n.ts for every supported locale. The remaining
// games (wordle, boggle, sudoku, typing, tiledrop, colormatch,
// letterstack) keep their existing static layouts until matching i18n
// keys are added.
type GameSlug =
  | "vlakken" | "verbind" | "zonmaan" | "kronen"
  | "minesweeper" | "connections";

export async function buildGameLocaleMetadata({
  params,
  path,
  slug,
}: {
  params: Promise<{ locale: string }>;
  path: string;
  slug: GameSlug;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  const name = translate(safeLocale, `game_${slug}` as const);
  const desc = translate(safeLocale, `game_${slug}_desc` as const);
  return {
    title: `${name} — ${desc}`,
    description: desc,
    alternates: {
      canonical: canonicalUrlFor(path, safeLocale),
      languages: generateHreflangAlternates(path),
    },
  };
}
