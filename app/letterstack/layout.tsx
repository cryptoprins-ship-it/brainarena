import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LetterStack — Catch & Form Words",
  description:
    "Catch falling letters, stack them and spell words for points. Power-ups, increasing speed, and a global leaderboard.",
  alternates: { canonical: "/letterstack" },
};

export default function LetterStackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
