import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/letterstack",
    title: "LetterStack — Catch & Form Words",
    description:
      "Catch falling letters, stack them and spell words for points. Power-ups, increasing speed, and a global leaderboard.",
  });

export default function LocaleLetterStackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="letterstack" />
      {children}
    </>
  );
}
