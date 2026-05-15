import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ColorMatch — RAL Color Code Quiz Game",
  description:
    "Identify RAL colors used by professional painters and facade specialists. 10 rounds, multiple choice, 5-second rounds. Used by Renisual professionals.",
  alternates: {
    canonical: canonicalUrlFor("/colormatch", "en"),
    languages: generateHreflangAlternates("/colormatch"),
  },
};

export default function ColorMatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="colormatch" />
      {children}
    </>
  );
}
