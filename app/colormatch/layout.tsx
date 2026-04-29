import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ColorMatch — RAL Color Code Quiz Game",
  description:
    "Identify RAL colors used by professional painters and facade specialists. 10 rounds, multiple choice, 5-second rounds. Used by Renisual professionals.",
  alternates: { canonical: "/colormatch" },
};

export default function ColorMatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
