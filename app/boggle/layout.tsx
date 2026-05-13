import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "Free Online Boggle Game",
  description:
    "Play free Boggle online — find as many words as you can in 3 minutes on a daily 4×4 grid. Compete on the global BrainArena leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/boggle", "en"),
    languages: generateHreflangAlternates("/boggle"),
  },
};

export default function BoggleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="boggle" />
      {children}
    </>
  );
}
