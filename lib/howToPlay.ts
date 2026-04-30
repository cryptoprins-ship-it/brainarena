import type { GameKey } from "./scores";

export type HowToPlayEntry = {
  label: string;
  href: string;
  summary: string;
  rules: string[];
};

export const HOW_TO_PLAY: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Guess the 5-letter word in 6 tries.",
    rules: [
      "Type any 5-letter word and press Enter to submit.",
      "Green = right letter, right spot. Yellow = right letter, wrong spot. Grey = not in the word.",
      "You get 6 guesses per puzzle.",
      "One daily word per language — same for everyone. Toggle Unlimited for endless play.",
      "Solving the daily keeps your streak alive.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Find as many words as you can on a 4×4 grid in 3 minutes.",
    rules: [
      "Click or drag through adjacent letters (including diagonals) to build a word.",
      "Words must be 3+ letters; each tile can be used only once per word.",
      "Scoring: 3 letters = 1 pt, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
      "Same daily grid for everyone — race the world.",
      "Score is submitted when the timer hits zero.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Fill the 9×9 grid so every row, column and 3×3 box has 1–9 exactly once.",
    rules: [
      "Click a cell, then click a number 1–9 (or use the keyboard).",
      "Wrong entries are highlighted red.",
      "3 hints per game reveal a correct cell.",
      "Easy / Medium / Hard each have a unique daily puzzle.",
      "Faster solves rank higher — time is the score.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Type the paragraph as fast and accurately as you can in 60 seconds.",
    rules: [
      "Click the input and start typing — the timer starts on your first keystroke.",
      "Correct letters are white, mistakes are red and underlined.",
      "WPM = correct characters ÷ 5 ÷ minutes elapsed.",
      "Each language has its own pool of texts.",
      "Press Restart for a new text any time.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Stack falling tiles, clear lines, don't top out.",
    rules: [
      "← / → to move, ↑ to rotate, ↓ to soft-drop, Space to hard-drop.",
      "C holds the current piece for later. P pauses.",
      "Mobile: swipe left/right, tap to rotate, swipe down to drop.",
      "Clear 1/2/3/4 lines for 100/300/500/800 × level.",
      "Speed increases every 10 cleared lines.",
    ],
  },
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Type words from today's category to build a house piece by piece.",
    rules: [
      "Every word must belong to the day's category.",
      "3 letters = brick, 4 = wall, 5 = window, 6 = roof tile, 7+ = chimney.",
      "Longer words score more points.",
      "10 rounds — your finished house is shown on the leaderboard.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identify the RAL colour code from a swatch in 5 seconds.",
    rules: [
      "Pick the matching code from 4 options before time runs out.",
      "100 pts per correct answer + a speed bonus of up to +50.",
      "10 rounds total.",
      "10/10 unlocks the Color Expert medal.",
    ],
  },
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Place 20 buildings on an 8×8 grid to score the highest city.",
    rules: [
      "🏠 next to 🌳 = +3 per neighbour.",
      "🏪 next to 🛣️ = +2 per neighbour.",
      "🏭 with no 🏠 neighbour = +2; 🏠 next to 🏭 = −2.",
      "Connected 🛣️ network = bonus equal to the longest road chain.",
      "Same piece sequence for everyone each day.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Catch falling letters, spell words, don't overflow.",
    rules: [
      "Press the matching letter key to catch a falling tile.",
      "Type a word using stacked letters and press Enter to score.",
      "3 letters = 10, 4 = 25, 5 = 50, 6+ = 100 pts.",
      "Letters fall faster over time — stack of 10 ends the run.",
      "Power-ups every 500 pts: 💣 bomb, ⏸️ slow, ⭐ wildcard.",
    ],
  },
};

export const HOW_TO_PLAY_ORDER: GameKey[] = [
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "wordbuild",
  "colormatch",
  "cityplanner",
  "letterstack",
];
