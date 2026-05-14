import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "Free Daily Sudoku Puzzle",
  description:
    "Play a free daily Sudoku puzzle online. Easy, medium and hard daily challenges — same puzzle for everyone, race the clock on the global leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/sudoku", "en"),
    languages: generateHreflangAlternates("/sudoku"),
  },
};

export default function SudokuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="sudoku" />
      {children}
    </>
  );
}
