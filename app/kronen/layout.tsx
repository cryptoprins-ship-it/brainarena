import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kronen — Crowns Logic Puzzle",
  description:
    "Place exactly one crown in each row, column, and color region. No two crowns may touch. Daily puzzle with Easy / Medium / Hard.",
  alternates: {
    canonical: canonicalUrlFor("/kronen", "en"),
    languages: generateHreflangAlternates("/kronen"),
  },
};

export default function KronenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="kronen" />
      {children}
    </>
  );
}
