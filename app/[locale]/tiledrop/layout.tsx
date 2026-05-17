import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/tiledrop",
    title: "TileDrop — Free Online Tile Puzzle Game",
    description:
      "Play TileDrop free online — the addictive falling-tile puzzle game. Stack the tiles, clear the lines, and compete globally for the highest score.",
  });

export default function LocaleTileDropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="tiledrop" />
      {children}
    </>
  );
}
