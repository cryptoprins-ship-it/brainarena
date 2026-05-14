import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "Verbind — Connect-the-Numbers Path Puzzle",
  description:
    "Trace one continuous path through every cell, in numerical order, on a daily grid. Easy / Medium / Hard.",
  alternates: {
    canonical: canonicalUrlFor("/verbind", "en"),
    languages: generateHreflangAlternates("/verbind"),
  },
};

export default function VerbindLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="verbind" />
      {children}
    </>
  );
}
