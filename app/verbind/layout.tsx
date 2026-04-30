import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verbind — Connect-the-Numbers Path Puzzle",
  description:
    "Trace one continuous path through every cell, in numerical order, on a daily grid. Easy / Medium / Hard.",
  alternates: { canonical: "/verbind" },
};

export default function VerbindLayout({ children }: { children: React.ReactNode }) {
  return children;
}
