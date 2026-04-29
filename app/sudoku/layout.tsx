import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Daily Sudoku Puzzle",
  description:
    "Play a free daily Sudoku puzzle online. Easy, medium and hard daily challenges — same puzzle for everyone, race the clock on the global leaderboard.",
  alternates: { canonical: "/sudoku" },
};

export default function SudokuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
