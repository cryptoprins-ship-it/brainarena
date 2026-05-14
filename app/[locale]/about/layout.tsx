import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/about",
    title: "About — BrainArena",
    description:
      "BrainArena is a small, ad-supported puzzle site built and run by Marcel from Hillegom, the Netherlands. Daily logic and word games, no accounts, no paywall.",
  });

export default function LocaleAboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
