import HomeClient from "@/app/HomeClient";
import { buildLocaleMetadata } from "@/lib/seo/localeMetadata";

export const generateMetadata = (props: {
  params: Promise<{ locale: string }>;
}) =>
  buildLocaleMetadata({
    params: props.params,
    path: "/",
    title: "BrainArena — Free Daily Puzzles & Word Games",
    description:
      "Play free Wordle, Boggle, Sudoku, logic puzzles and typing games. Compete globally in 8 languages.",
  });

export default function LocaleHomePage() {
  return <HomeClient />;
}
