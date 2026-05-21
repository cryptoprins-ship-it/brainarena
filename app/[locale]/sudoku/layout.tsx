import GameJsonLd from "@/components/GameJsonLd";
import { buildHowToPlayGameMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildHowToPlayGameMetadata({
    params: props.params,
    path: "/sudoku",
    slug: "sudoku",
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
