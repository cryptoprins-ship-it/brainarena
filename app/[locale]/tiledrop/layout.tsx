import GameJsonLd from "@/components/GameJsonLd";
import { buildHowToPlayGameMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildHowToPlayGameMetadata({
    params: props.params,
    path: "/tiledrop",
    slug: "tiledrop",
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
