import GameJsonLd from "@/components/GameJsonLd";
import { buildGameLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildGameLocaleMetadata({
    params: props.params,
    path: "/minesweeper",
    slug: "minesweeper",
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
