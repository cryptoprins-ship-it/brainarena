import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LetterStack — Catch & Form Words",
  description:
    "Catch falling letters, stack them and spell words for points. Power-ups, increasing speed, and a global leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/letterstack", "en"),
    languages: generateHreflangAlternates("/letterstack"),
  },
};

export default function LetterStackLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="letterstack" />
      {children}
    </>
  );
}
