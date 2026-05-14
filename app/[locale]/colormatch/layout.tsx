import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/colormatch",
    title: "ColorMatch — RAL Color Code Quiz Game",
    description:
      "Identify RAL colors used by professional painters and facade specialists. 10 rounds, multiple choice, 5-second rounds. Used by Renisual professionals.",
  });

export default function LocaleColorMatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="colormatch" />
      {children}
    </>
  );
}
