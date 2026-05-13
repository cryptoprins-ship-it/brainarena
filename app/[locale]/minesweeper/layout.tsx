import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/minesweeper",
    title: "Free Daily Minesweeper Online",
    description:
      "Play free daily Minesweeper online. Same board for everyone, three difficulties on a 9×9, 12×12 or 14×14 grid — race the clock on the global leaderboard.",
  });

export default function LocaleMinesweeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="minesweeper" />
      {children}
    </>
  );
}
