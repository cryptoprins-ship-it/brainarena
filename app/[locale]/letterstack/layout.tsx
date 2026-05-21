import GameJsonLd from "@/components/GameJsonLd";
import { buildHowToPlayGameMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildHowToPlayGameMetadata({
    params: props.params,
    path: "/letterstack",
    slug: "letterstack",
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
