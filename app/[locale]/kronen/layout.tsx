import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/kronen",
    title: "Kronen — Crowns Logic Puzzle",
    description:
      "Place exactly one crown in each row, column, and color region. No two crowns may touch. Daily puzzle with Easy / Medium / Hard.",
  });

export default function LocaleKronenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="kronen" />
      {children}
    </>
  );
}
