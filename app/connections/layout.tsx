import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "Daily Connections — Group 16 Words",
  description:
    "Free daily Connections-style word puzzle: group 16 words into 4 hidden categories. Yellow easy, green medium, blue hard, purple tricky. Global leaderboard.",
  alternates: {
    canonical: canonicalUrlFor("/connections", "en"),
    languages: generateHreflangAlternates("/connections"),
  },
};

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="connections" />
      {children}
    </>
  );
}
