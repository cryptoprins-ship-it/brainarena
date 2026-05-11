import JsonLd from "./JsonLd";

const BASE = "https://brainarena.fun";

// Per-game schema.org names + descriptions used in VideoGame structured data.
// Names favour the English/internationally-recognisable form so the rich
// result panel reads naturally in Google search; the visible H1 on each
// page is locale-driven elsewhere.
const GAMES = {
  wordle: {
    name: "Wordle",
    description: "Guess the daily 5-letter word in six tries. Native word lists in 6 languages.",
  },
  boggle: {
    name: "Boggle",
    description: "Find as many words as you can on a 4×4 grid in 3 minutes.",
  },
  sudoku: {
    name: "Sudoku",
    description: "Fill the 9×9 grid so every row, column and 3×3 box contains 1-9 exactly once.",
  },
  typing: {
    name: "Typing Test",
    description: "Type the paragraph as fast and accurately as you can in 60 seconds. WPM challenge.",
  },
  tiledrop: {
    name: "Tiledrop",
    description: "Falling-tile puzzle game — clear lines by completing rows.",
  },
  colormatch: {
    name: "Color Match",
    description: "Identify the right RAL colour from four candidates. 10 rounds, 5 seconds each.",
  },
  letterstack: {
    name: "Letterstack",
    description: "Catch falling letters and form words before the stack overflows.",
  },
  vlakken: {
    name: "Patches",
    description:
      "Fill the grid by completing the rectangular shapes around each numbered anchor.",
  },
  verbind: {
    name: "Connect",
    description:
      "Trace one path through every cell that visits the numbered checkpoints in order.",
  },
  zonmaan: {
    name: "Sun & Moon",
    description:
      "Fill the grid with suns and moons. No three in a row, balanced rows and columns.",
  },
  kronen: {
    name: "Crowns",
    description:
      "Place one crown in each row, column and colour region. No two crowns may touch.",
  },
  minesweeper: {
    name: "Minesweeper",
    description:
      "Uncover safe cells, flag the mines, never tap a bomb. 9×9, 12×12 and 14×14 daily boards.",
  },
} as const;

export type GameSlug = keyof typeof GAMES;

export default function GameJsonLd({ slug }: { slug: GameSlug }) {
  const { name, description } = GAMES[slug];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name,
        description,
        url: `${BASE}/${slug}`,
        genre: "Puzzle",
        gamePlatform: "Web",
        applicationCategory: "Game",
        operatingSystem: "Any",
        inLanguage: ["en", "nl", "de", "fr", "es", "pt-BR"],
        offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
        publisher: {
          "@type": "Organization",
          name: "BrainArena",
          url: BASE,
        },
      }}
    />
  );
}
