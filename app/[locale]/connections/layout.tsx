import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/connections",
    title: "Daily Connections — Group 16 Words",
    description:
      "Free daily Connections-style word puzzle: group 16 words into 4 hidden categories. Yellow easy, green medium, blue hard, purple tricky. Global leaderboard.",
  });

export default function LocaleConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="connections" />
      {children}
    </>
  );
}
