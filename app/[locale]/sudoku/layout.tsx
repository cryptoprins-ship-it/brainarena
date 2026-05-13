import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import { SUPPORTED, type Locale } from "@/lib/locales";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";

  // Title/description stay English for now — sudoku has no entry in
  // lib/seoMeta.ts and machine-translating 8 variants without review
  // would ship low-quality SERP snippets. Hreflang still clusters the
  // pages so Google serves the right URL per user.
  return {
    title: "Free Daily Sudoku Puzzle",
    description:
      "Play a free daily Sudoku puzzle online. Easy, medium and hard daily challenges — same puzzle for everyone, race the clock on the global leaderboard.",
    alternates: {
      canonical: canonicalUrlFor("/sudoku", safeLocale),
      languages: generateHreflangAlternates("/sudoku"),
    },
  };
}

export default function LocaleSudokuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="sudoku" />
      {children}
    </>
  );
}
