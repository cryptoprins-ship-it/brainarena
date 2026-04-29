import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CityPlanner — Urban Puzzle Game",
  description:
    "Build a city in 20 placements. Park houses next to greenery, keep factories away. Daily challenge with same piece sequence for everyone.",
  alternates: { canonical: "/cityplanner" },
};

export default function CityPlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
