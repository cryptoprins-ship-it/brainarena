import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/vlakken",
    title: "Vlakken — Patches Logic Puzzle",
    description:
      "Tile a daily grid by completing rectangles around numbered anchors. New puzzle every day, with Easy / Medium / Hard.",
  });

export default function LocaleVlakkenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="vlakken" />
      {children}
    </>
  );
}
