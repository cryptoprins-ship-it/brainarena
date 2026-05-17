import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vlakken — Patches Logic Puzzle",
  description:
    "Tile a daily grid by completing rectangles around numbered anchors. New puzzle every day, with Easy / Medium / Hard.",
  alternates: {
    canonical: canonicalUrlFor("/vlakken", "en"),
    languages: generateHreflangAlternates("/vlakken"),
  },
};

export default function VlakkenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="vlakken" />
      {children}
    </>
  );
}
