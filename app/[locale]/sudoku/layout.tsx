import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/sudoku",
    title: "Free Daily Sudoku Puzzle",
    description:
      "Play a free daily Sudoku puzzle online. Easy, medium and hard daily challenges — same puzzle for everyone, race the clock on the global leaderboard.",
  });

export default function LocaleSudokuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="sudoku" />
      {children}
    </>
  );
}
