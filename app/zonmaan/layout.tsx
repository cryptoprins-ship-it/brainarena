import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zon & Maan — Sun & Moon Logic Grid",
  description:
    "Fill a daily grid with suns and moons. No three in a row, balanced rows and columns, plus = / × edge constraints. Easy / Medium / Hard.",
  alternates: { canonical: "/zonmaan" },
};

export default function ZonMaanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
