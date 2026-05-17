import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TileDrop — Free Online Tile Puzzle Game",
  description:
    "Play TileDrop free online — the addictive falling-tile puzzle game. Stack the tiles, clear the lines, and compete globally for the highest score.",
  alternates: {
    canonical: canonicalUrlFor("/tiledrop", "en"),
    languages: generateHreflangAlternates("/tiledrop"),
  },
};

export default function TileDropLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="tiledrop" />
      {children}
    </>
  );
}
