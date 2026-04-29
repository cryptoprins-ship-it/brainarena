import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievements & Streaks",
  description:
    "Track your daily game streaks, earn medals and compare yourself to professionals worldwide on BrainArena.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
