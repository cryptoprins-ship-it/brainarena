import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Daily Minesweeper Online",
  description:
    "Play free daily Minesweeper online. Same board for everyone, three difficulties on a 9×9, 12×12 or 14×14 grid — race the clock on the global leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/minesweeper", "en"),
    languages: generateHreflangAlternates("/minesweeper"),
  },
};

export default function MinesweeperLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="minesweeper" />
      {children}
    </>
  );
}
