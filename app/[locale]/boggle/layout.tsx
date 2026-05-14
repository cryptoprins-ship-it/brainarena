import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/boggle",
    title: "Free Online Boggle Game",
    description:
      "Play free Boggle online — find as many words as you can in 3 minutes on a daily 4×4 grid. Compete on the global BrainArena leaderboard.",
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
