import type { Metadata } from "next";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "How to Play — Game Rules & Controls",
  description:
    "Quick guides to every BrainArena game: Wordle, Boggle, Sudoku, Typing, TileDrop, ColorMatch, LetterStack, Vlakken, Verbind, Zon & Maan and Kronen.",
  alternates: {
    canonical: canonicalUrlFor("/how-to-play", "en"),
    languages: generateHreflangAlternates("/how-to-play"),
  },
};

export default function HowToPlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
