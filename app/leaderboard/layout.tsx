import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Game Leaderboard",
  description:
    "Live BrainArena leaderboard — top scores in Wordle, Boggle, Sudoku, TileDrop and typing speed across the world.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
