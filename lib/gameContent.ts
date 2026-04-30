// Long-form game content used for AdSense quality bar — strategy tips,
// FAQ entries, and a short editorial intro per game. We keep it in one
// file so updates don't have to chase per-page templates, and so the same
// block can be rendered on /how-to-play, on the per-game page, and in
// future blog posts.
//
// English-only on purpose for the first AdSense submission. Translation
// can come later — the reviewer reads English and only samples a handful
// of pages, so depth + originality matter more than locale coverage here.

import type { GameKey } from "./scores";

export type FaqEntry = { q: string; a: string };

export type GameContent = {
  intro: string;
  tips: string[];
  faqs: FaqEntry[];
};

export const GAME_CONTENT: Partial<Record<GameKey, GameContent>> = {
  wordle: {
    intro:
      "Wordle is a five-letter guessing game with one daily target word, six attempts, and tile-by-tile feedback. The skill ceiling is higher than it looks: pattern recognition, letter frequency, and a willingness to spend a guess on information rather than a shot at the answer all matter. BrainArena keeps the original spirit of one shared puzzle per language per day, plus an Unlimited mode for when you want to keep going.",
    tips: [
      "Open with a high-information word like CRANE, SLATE, or AUDIO. You want vowels and common consonants on the board to maximise yellow/grey signal in row one.",
      "Burn guess two on letters you haven't tried. If row one came back mostly grey, don't immediately re-use the green letters — spend a guess gathering new data first.",
      "Track positions, not just letters. A yellow E in column 3 means the answer has an E somewhere except column 3. That's two bits of information, not one.",
      "When stuck on the last guess, count letter frequencies. The most common 5th letters are E, S, T, Y. If your board fits the pattern _ _ _ _ E and you have E confirmed elsewhere, look elsewhere.",
    ],
    faqs: [
      {
        q: "How is the daily word chosen?",
        a: "It's seeded by the UTC date, so every player in your language gets the same target. Solving the daily preserves your streak; missing a day resets it.",
      },
      {
        q: "Are proper nouns or plurals allowed?",
        a: "No proper nouns. Plurals ending in -s are usually excluded too — the curated word list focuses on common five-letter dictionary entries.",
      },
      {
        q: "What does 'hard mode' do?",
        a: "BrainArena currently runs the standard ruleset. Any letter clue you've earned is yours to use or ignore — there's no enforcement of must-use rules.",
      },
      {
        q: "Why do I sometimes see a different word than a friend?",
        a: "The daily target is per language, not global. Your friend playing in French gets a different five-letter word than you on EN.",
      },
      {
        q: "Can I play more than once a day?",
        a: "Yes — Unlimited mode generates random valid words endlessly. Only the once-per-day daily counts toward your streak.",
      },
    ],
  },
  sudoku: {
    intro:
      "Sudoku is a 9×9 logic grid where every row, column, and 3×3 box must contain the digits 1-9 exactly once. BrainArena ships three difficulty tiers per day, each with a unique solution validated by the generator before the puzzle is published — you'll never get a board that has multiple answers or no answer at all.",
    tips: [
      "Scan rows, columns, and boxes for naked singles before pencil-marking anything. On easier boards you can often place 10-15 numbers without writing a single candidate.",
      "Use pencil marks on Medium and Hard. Short-circuiting the candidate list in your head fails the moment you backtrack, and Sudoku punishes mistakes harshly.",
      "Look for hidden singles in boxes. A digit that fits in only one cell of a box is forced, even if that cell technically has multiple candidates.",
      "When you hit a wall, re-scan the digit you've placed least often. The grid is solved when each digit appears nine times — chasing the rare ones first usually unlocks chains.",
    ],
    faqs: [
      {
        q: "Are all puzzles solvable without guessing?",
        a: "Yes. The generator runs a constraint-propagation solver before publishing and rejects any board that requires guessing or has multiple solutions.",
      },
      {
        q: "How is the difficulty calibrated?",
        a: "Difficulty correlates with the number of pre-filled clues and the depth of logical chains required. Easy boards solve with naked + hidden singles; Hard boards require pointing pairs, X-wings, and similar techniques.",
      },
      {
        q: "What do the hints reveal?",
        a: "Each hint reveals one correct cell. You get three hints per game; using them doesn't disqualify you from the leaderboard, but a clean solve usually finishes faster.",
      },
      {
        q: "Why is my time the score?",
        a: "Sudoku's challenge is execution speed once you can read the board. Faster solves mean tighter pattern recognition, which is what we rank.",
      },
    ],
  },
  boggle: {
    intro:
      "Boggle is a 4×4 letter grid in which you trace adjacent tiles (orthogonal or diagonal) to spell words. Three minutes per board, a curated dictionary, and exponential scoring for longer words. The deeper the word, the bigger the leverage — a single seven-letter find can outscore ten three-letter words.",
    tips: [
      "Sweep prefixes first. Spot every cluster of common starts (UN-, RE-, ST-, OUT-) and trace outward. You'll rack up volume fast.",
      "Plurals are gold. Once you find a word, look for an adjacent S to extend it. Same for verb endings (-ED, -ING).",
      "Watch for diagonal traversal. Most beginners only move orthogonally and miss half the dictionary. Diagonal hops unlock long, snaking words.",
      "Don't waste time on a hunch. If you can't trace it in 5 seconds, move on. Three minutes is short and time spent staring is points lost.",
    ],
    faqs: [
      {
        q: "What words count?",
        a: "Standard dictionary words, three letters or longer. No proper nouns, no abbreviations, no hyphenated forms. The dictionary updates over time but additions are conservative.",
      },
      {
        q: "How is scoring calculated?",
        a: "3 letters = 1 pt, 4 = 2, 5 = 4, 6 = 7, 7 letters or more = 11 pts. Every word counts independently — finding a long word doesn't invalidate the shorter ones inside it.",
      },
      {
        q: "Can I reuse a tile in the same word?",
        a: "No. Each tile may be used at most once per word. You can use the same tile in different words across the same board, of course.",
      },
      {
        q: "Why does my path turn green?",
        a: "Visual feedback — the current selected tile highlights green, and tapping it again backtracks one step. Esc or the Clear button resets the path entirely.",
      },
    ],
  },
  tiledrop: {
    intro:
      "TileDrop is a falling-block puzzle in the spirit of classic stackers. Pieces drop from the top of the field; you rotate, slide, and place them to clear horizontal lines. Speed scales with cleared rows, and topping out (filling the field) ends the run. The hold slot lets you stash one piece for later, which is the difference between novice and expert play once the speed climbs.",
    tips: [
      "Build for tetrises (four-line clears) on Easy. Keep the rightmost column open and feed the long piece into it. The 800-point line clear scales with level — late-game tetrises dwarf single clears.",
      "Use the hold slot strategically. Don't dump pieces into hold reactively; reserve it for the long bar when your stack is uneven, or for an S/Z when you can't fit it cleanly right now.",
      "On Hard, soft-drop everything. Hard-dropping is faster but commits you to the column; soft-drop lets you slide piece into a tucked position at the last moment.",
      "Watch ghost-piece position before each drop. If the ghost looks wrong, you've already mis-rotated — abort and reset before the lock timer expires.",
    ],
    faqs: [
      {
        q: "How does difficulty change between Easy / Medium / Hard?",
        a: "Easy starts at low gravity and adds preview pieces. Medium starts faster and shows a shorter preview. Hard starts at high gravity, locks pieces sooner, and adds garbage rows on milestone clears.",
      },
      {
        q: "Does line-clear count carry between days?",
        a: "Your daily best does. The leaderboard records highest score per session; play history is on /achievements.",
      },
      {
        q: "What controls work on mobile?",
        a: "Swipe left/right to move, tap to rotate, swipe down to soft-drop, swipe down hard for hard-drop. Pinch the field to pause.",
      },
      {
        q: "Why did I top out so suddenly?",
        a: "Garbage rows on Hard difficulty can shift your stack up unexpectedly. Always leave at least two rows of headroom on Hard, even if your build looks clean.",
      },
    ],
  },
  kronen: {
    intro:
      "Crowns (Kronen in Dutch) is an N×N logic puzzle: place exactly one crown in each row, each column, and each coloured region, with no two crowns touching even diagonally. It's a constraint satisfaction problem dressed up as a chessboard — N-queens with king-move adjacency and an extra region partition. The solver verifies a unique solution before publishing, so deduction always wins.",
    tips: [
      "Start with the smallest region. A region of two cells forces deduction immediately: place an X in any cell adjacent to either, and one of the two must hold the crown.",
      "Watch row + column intersections. If a row has only two open cells and they share a column with placed crowns, the row is forced.",
      "Mark forbidden cells aggressively (the X mark). On bigger boards (10×10) the Xs do most of the work — every crown placement bans up to 8 neighbours.",
      "When two regions both restrict to the same row or column, you can often place an X across an entire other region in one move.",
    ],
    faqs: [
      {
        q: "How are the colour regions decided?",
        a: "The generator picks a valid crown placement first, then grows regions outward via random BFS until each region contains exactly one crown. The shape varies every day.",
      },
      {
        q: "Can two crowns share a diagonal across regions?",
        a: "No. Crowns may not be adjacent in any of the eight king-move directions, regardless of region. Diagonal adjacency is the rule that catches most beginners.",
      },
      {
        q: "What does the X mark do?",
        a: "It's a self-imposed reminder that this cell cannot hold a crown. The solver doesn't read it — it exists purely so you can keep deductions visible while solving.",
      },
      {
        q: "Why do hints reveal a crown instead of an X?",
        a: "Hints reveal the next correct crown placement. We considered hint-as-X but a single crown reveal cascades into many forced Xs on its own.",
      },
    ],
  },
  zonmaan: {
    intro:
      "Sun & Moon (Zon & Maan) is a binary logic grid: every cell holds either a sun or a moon, no three identical symbols may appear consecutively in a row or column, and each row and column must contain equal numbers of suns and moons. Some pairs of cells are also marked '=' (must match) or '×' (must oppose). Easy boards (4×4) feel like Sudoku-light; Hard boards (8×8) require chains of two or three deductions per move.",
    tips: [
      "Look for forced 'no third' moves. Any row with two suns next to each other already constrains the next cell — it must be a moon. Same horizontally and vertically.",
      "Count balance frequently. If a 6×6 row already has 3 suns placed, the rest must all be moons. The faster you spot a balance trigger, the more cascades you unlock.",
      "Edge constraints aren't optional information — treat '=' and '×' as solid placements once the partner cell is known. They often turn an undecidable cell into a forced one.",
      "When stuck, scan for the 'sandwich' pattern: an empty cell between two equal symbols must be the opposite. Sun-empty-Sun → empty must be Moon.",
    ],
    faqs: [
      {
        q: "Why must the grid size be even?",
        a: "Each row and column must contain equal counts of sun and moon. That's only possible on even-sized grids — 4×4, 6×6, 8×8 in our difficulty tiers.",
      },
      {
        q: "What does '×' between cells mean?",
        a: "The two adjacent cells hold opposite symbols — one sun, one moon. It's the inverse of '=' which means matching symbols.",
      },
      {
        q: "Are puzzles guaranteed to have one solution?",
        a: "Yes. The generator runs a constraint-propagation solver and only publishes boards with exactly one valid solution. No guessing required.",
      },
      {
        q: "Can I overwrite a clue cell?",
        a: "No. Pre-filled cells are fixed givens, like Sudoku starting numbers. They appear with a slightly different background to mark them as untouchable.",
      },
    ],
  },
};
