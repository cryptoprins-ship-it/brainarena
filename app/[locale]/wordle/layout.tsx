import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/wordle",
    title: "Play Wordle Free — Dutch, German, French, Spanish",
    description:
      "Free daily Wordle in 5 languages — English, Dutch, German, French, Spanish. Same answer for everyone, share your streak.",
  });

export default function LocaleWordleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="wordle" />
      {children}
    </>
  );
}
