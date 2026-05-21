import type { Metadata } from "next";
import GameJsonLd from "@/components/GameJsonLd";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Play Wordle Free — Daily Word in 6 Languages",
  description:
    "Free daily Wordle in 6 languages — English, Dutch, German, French, Spanish, Portuguese. Same answer for everyone, share your streak.",
  alternates: {
    canonical: canonicalUrlFor("/wordle", "en"),
    languages: generateHreflangAlternates("/wordle"),
  },
};

export default function WordleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="wordle" />
      {children}
    </>
  );
}
