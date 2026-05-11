// Connections — NYT-style "find 4 groups of 4" word puzzle.
//
// MVP design: hand-curated pool of 10 puzzles, cycled by daily index. We
// deliberately ship English-only words even on non-English locales because
// the puzzle relies on category recognition and wordplay that doesn't
// machine-translate cleanly. UI strings *are* localised; the 16 tiles
// always show the same English words on every locale.
//
// Future: replace the pool with an LLM-generated daily once we have real
// traffic to amortise the per-day generation cost. The function surface
// (`pickPuzzle`, `allWords`, `shuffleSeeded`) is designed so the page can
// stay unchanged when that swap happens.

export type GroupColor = "yellow" | "green" | "blue" | "purple";

export type ConnectionsGroup = {
  category: string;
  color: GroupColor;
  words: [string, string, string, string];
};

export type ConnectionsPuzzle = {
  id: number;
  groups: [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup];
};

// Tip: when adding new puzzles, intentionally include words that *could*
// fit multiple categories — overlap is what makes Connections fun.
const PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 1,
    groups: [
      { color: "yellow", category: "Birds", words: ["OWL", "HAWK", "ROBIN", "FINCH"] },
      { color: "green",  category: "Cold things", words: ["ICE", "SNOW", "FROST", "CHILL"] },
      { color: "blue",   category: "Dances", words: ["SALSA", "TANGO", "WALTZ", "SWING"] },
      { color: "purple", category: "___ band", words: ["JAZZ", "ROCK", "RUBBER", "HEAD"] },
    ],
  },
  {
    id: 2,
    groups: [
      { color: "yellow", category: "Citrus", words: ["LEMON", "LIME", "ORANGE", "GRAPEFRUIT"] },
      { color: "green",  category: "Gems", words: ["RUBY", "PEARL", "OPAL", "JADE"] },
      { color: "blue",   category: "Kitchen tools", words: ["WHISK", "GRATER", "LADLE", "SIEVE"] },
      { color: "purple", category: "___ board", words: ["KEY", "SURF", "CHESS", "CARD"] },
    ],
  },
  {
    id: 3,
    groups: [
      { color: "yellow", category: "Sports", words: ["TENNIS", "SOCCER", "RUGBY", "HOCKEY"] },
      { color: "green",  category: "Tools", words: ["HAMMER", "WRENCH", "DRILL", "PLIERS"] },
      { color: "blue",   category: "Body parts", words: ["ARM", "LEG", "EYE", "EAR"] },
      { color: "purple", category: "___ light", words: ["SUN", "MOON", "SPOT", "FLASH"] },
    ],
  },
  {
    id: 4,
    groups: [
      { color: "yellow", category: "Trees", words: ["OAK", "PINE", "MAPLE", "BIRCH"] },
      { color: "green",  category: "Grains", words: ["WHEAT", "RICE", "OATS", "BARLEY"] },
      { color: "blue",   category: "Chess pieces", words: ["KING", "QUEEN", "ROOK", "BISHOP"] },
      { color: "purple", category: "___ paper", words: ["NEWS", "SAND", "WALL", "TOILET"] },
    ],
  },
  {
    id: 5,
    groups: [
      { color: "yellow", category: "Fish", words: ["SALMON", "TUNA", "COD", "TROUT"] },
      { color: "green",  category: "Metals", words: ["IRON", "GOLD", "SILVER", "COPPER"] },
      { color: "blue",   category: "Planets", words: ["MARS", "VENUS", "JUPITER", "SATURN"] },
      { color: "purple", category: "___ ball", words: ["BASE", "FOOT", "BASKET", "EYE"] },
    ],
  },
  {
    id: 6,
    groups: [
      { color: "yellow", category: "Drinks", words: ["COFFEE", "TEA", "JUICE", "MILK"] },
      { color: "green",  category: "Emotions", words: ["ANGER", "JOY", "FEAR", "LOVE"] },
      { color: "blue",   category: "Currencies", words: ["DOLLAR", "EURO", "POUND", "YEN"] },
      { color: "purple", category: "___ house", words: ["TREE", "LIGHT", "FARM", "BIRD"] },
    ],
  },
  {
    id: 7,
    groups: [
      { color: "yellow", category: "Insects", words: ["BEE", "ANT", "FLY", "MOTH"] },
      { color: "green",  category: "Clothing", words: ["SHIRT", "PANTS", "SHOES", "SOCKS"] },
      { color: "blue",   category: "Move", words: ["RUN", "JUMP", "WALK", "CRAWL"] },
      { color: "purple", category: "___ chair", words: ["ARM", "HIGH", "ROCKING", "BEACH"] },
    ],
  },
  {
    id: 8,
    groups: [
      { color: "yellow", category: "Continents", words: ["ASIA", "EUROPE", "AFRICA", "AUSTRALIA"] },
      { color: "green",  category: "Seasons", words: ["SPRING", "SUMMER", "AUTUMN", "WINTER"] },
      { color: "blue",   category: "Dances", words: ["BALLET", "RUMBA", "TWIST", "MAMBO"] },
      { color: "purple", category: "___ tree", words: ["PALM", "FIG", "FAMILY", "CHRISTMAS"] },
    ],
  },
  {
    id: 9,
    groups: [
      { color: "yellow", category: "Pirate things", words: ["PARROT", "TREASURE", "MAP", "SHIP"] },
      { color: "green",  category: "Space", words: ["ROCKET", "ORBIT", "STAR", "COMET"] },
      { color: "blue",   category: "Furniture", words: ["SOFA", "TABLE", "BED", "LAMP"] },
      { color: "purple", category: "___ shop", words: ["COFFEE", "BARBER", "GIFT", "WORK"] },
    ],
  },
  {
    id: 10,
    groups: [
      { color: "yellow", category: "Instruments", words: ["PIANO", "GUITAR", "DRUMS", "VIOLIN"] },
      { color: "green",  category: "Flowers", words: ["ROSE", "TULIP", "DAISY", "LILY"] },
      { color: "blue",   category: "Countries", words: ["SPAIN", "JAPAN", "BRAZIL", "EGYPT"] },
      { color: "purple", category: "___ park", words: ["WATER", "AMUSEMENT", "NATIONAL", "CAR"] },
    ],
  },
];

export function pickPuzzle(seed: number): ConnectionsPuzzle {
  const idx = ((seed % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  return PUZZLES[idx];
}

export function puzzleCount(): number {
  return PUZZLES.length;
}

export function allWords(puzzle: ConnectionsPuzzle): string[] {
  return puzzle.groups.flatMap((g) => g.words);
}

export function groupOf(puzzle: ConnectionsPuzzle, word: string): ConnectionsGroup | null {
  for (const g of puzzle.groups) {
    if (g.words.includes(word as (typeof g.words)[number])) return g;
  }
  return null;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Given a 4-tile selection, returns the group all four belong to (correct
// guess), or null. Also reports `oneAway` — true when exactly three of the
// four belong to the same group, which the NYT version surfaces as a hint.
export function checkSelection(
  puzzle: ConnectionsPuzzle,
  selection: string[]
): { group: ConnectionsGroup | null; oneAway: boolean } {
  if (selection.length !== 4) return { group: null, oneAway: false };
  for (const g of puzzle.groups) {
    const inGroup = selection.filter((w) => g.words.includes(w as (typeof g.words)[number])).length;
    if (inGroup === 4) return { group: g, oneAway: false };
  }
  for (const g of puzzle.groups) {
    const inGroup = selection.filter((w) => g.words.includes(w as (typeof g.words)[number])).length;
    if (inGroup === 3) return { group: null, oneAway: true };
  }
  return { group: null, oneAway: false };
}
