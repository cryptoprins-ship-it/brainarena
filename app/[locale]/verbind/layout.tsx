import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/verbind",
    title: "Verbind — Connect-the-Numbers Path Puzzle",
    description:
      "Trace one continuous path through every cell, in numerical order, on a daily grid. Easy / Medium / Hard.",
  });

export default function LocaleVerbindLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="verbind" />
      {children}
    </>
  );
}
