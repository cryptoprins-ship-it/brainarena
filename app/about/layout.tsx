import type { Metadata } from "next";
import {
  canonicalUrlFor,
  generateHreflangAlternates,
} from "@/lib/seo/hreflang";

export const metadata: Metadata = {
  title: "About — BrainArena",
  description:
    "BrainArena is a small, ad-supported puzzle site built and run by Marcel from Hillegom, the Netherlands. Daily logic and word games, no accounts, no paywall.",
  alternates: {
    canonical: canonicalUrlFor("/about", "en"),
    languages: generateHreflangAlternates("/about"),
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
