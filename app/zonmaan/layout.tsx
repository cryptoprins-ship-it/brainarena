import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "Zon & Maan — Sun & Moon Logic Grid",
  description:
    "Fill a daily grid with suns and moons. No three in a row, balanced rows and columns, plus = / × edge constraints. Easy / Medium / Hard.",
  alternates: {
    canonical: canonicalUrlFor("/zonmaan", "en"),
    languages: generateHreflangAlternates("/zonmaan"),
  },
};

export default function ZonMaanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="zonmaan" />
      {children}
    </>
  );
}
