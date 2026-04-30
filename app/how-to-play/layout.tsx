import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play — Game Rules & Controls",
  description:
    "Quick guides to every BrainArena game: Wordle, Boggle, Sudoku, Typing, TileDrop, WordBuild, ColorMatch, LetterStack, Vlakken, Verbind, Zon & Maan and Kronen.",
  alternates: { canonical: "/how-to-play" },
};

export default function HowToPlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
