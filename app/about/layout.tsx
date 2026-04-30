import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — BrainArena",
  description:
    "BrainArena is a small, ad-supported puzzle site built and run by Marcel from Hillegom, the Netherlands. Twelve daily logic and word games, no accounts, no paywall.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
