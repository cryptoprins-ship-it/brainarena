import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WordBuild — Build a House with Words",
  description:
    "Type words to build a house — short words become bricks, longer words become roofs and chimneys. 10 rounds, daily category, global leaderboard.",
  alternates: { canonical: "/wordbuild" },
};

export default function WordBuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
