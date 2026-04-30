import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kronen — Crowns Logic Puzzle",
  description:
    "Place exactly one crown in each row, column, and color region. No two crowns may touch. Daily puzzle with Easy / Medium / Hard.",
  alternates: { canonical: "/kronen" },
};

export default function KronenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
