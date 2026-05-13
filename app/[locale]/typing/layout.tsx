import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/typing",
    title: "Typing Speed Test Online Free",
    description:
      "Free online typing speed test in 5 languages. Measure your WPM and accuracy in 60 seconds. Compete on the global BrainArena leaderboard.",
  });

export default function LocaleTypingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="typing" />
      {children}
    </>
  );
}
