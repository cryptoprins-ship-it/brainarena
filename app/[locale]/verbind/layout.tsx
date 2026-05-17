import GameJsonLd from "@/components/GameJsonLd";
import { buildGameLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildGameLocaleMetadata({
    params: props.params,
    path: "/verbind",
    slug: "verbind",
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
