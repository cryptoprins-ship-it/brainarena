import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/how-to-play",
    title: "How to Play — Game Rules & Controls",
    description:
      "Quick guides to every BrainArena game: Wordle, Boggle, Sudoku, Typing, TileDrop, ColorMatch, LetterStack, Vlakken, Verbind, Zon & Maan and Kronen.",
  });

export default function LocaleHowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
