import GameJsonLd from "@/components/GameJsonLd";
import { buildHowToPlayGameMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildHowToPlayGameMetadata({
    params: props.params,
    path: "/boggle",
    slug: "boggle",
  });

export default function LocaleBoggleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="boggle" />
      {children}
    </>
  );
}
