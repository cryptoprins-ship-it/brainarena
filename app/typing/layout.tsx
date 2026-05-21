import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Typing Speed Test Online Free",
  description:
    "Free online typing speed test. Measure your WPM and accuracy in 60 seconds. Compete on the global BrainArena leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/typing", "en"),
    languages: generateHreflangAlternates("/typing"),
  },
};

export default function TypingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="typing" />
      {children}
    </>
  );
}
