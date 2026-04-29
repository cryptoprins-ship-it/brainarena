import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TileDrop — Free Online Tile Puzzle Game",
  description:
    "Play TileDrop free online — the addictive falling-tile puzzle game. Stack the tiles, clear the lines, and compete globally for the highest score.",
  alternates: { canonical: "/tiledrop" },
};

export default function TileDropLayout({ children }: { children: React.ReactNode }) {
  return children;
}
