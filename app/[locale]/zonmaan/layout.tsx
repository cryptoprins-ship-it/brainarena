import GameJsonLd from "@/components/GameJsonLd";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/zonmaan",
    title: "Zon & Maan — Sun & Moon Logic Grid",
    description:
      "Fill a daily grid with suns and moons. No three in a row, balanced rows and columns, plus = / × edge constraints. Easy / Medium / Hard.",
  });

export default function LocaleZonMaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameJsonLd slug="zonmaan" />
      {children}
    </>
  );
}
