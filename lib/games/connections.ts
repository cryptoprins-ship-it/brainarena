// Connections — NYT-style "find 4 groups of 4" word puzzle.
//
// MVP design: hand-curated pool of 10 puzzles per supported locale,
// cycled by daily index. The puzzle relies on category recognition and
// wordplay that doesn't machine-translate cleanly, so each locale gets
// its own native-word pool. Locales without a curated pool fall back to
// English (callers still receive a usable puzzle, just in the original
// language). Categories and the purple "___ X" pattern words live in
// the puzzle data so they're naturally localised together.
//
// Future: replace the pool with an LLM-generated daily once we have real
// traffic to amortise the per-day generation cost. The function surface
// (`pickPuzzle`, `allWords`, `shuffleSeeded`) is designed so the page can
// stay unchanged when that swap happens.

import type { Locale } from "@/lib/locales";

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

// Dutch puzzle pool. Each group keeps the same shape as English; the
// purple "___ X" group exploits Dutch's compound-word habit so the
// player can spot the pattern by reading the four candidates as a
// compound stem (e.g. KERST → kerstboom, STAM → stamboom).
const PUZZLES_NL: ConnectionsPuzzle[] = [
  {
    id: 1,
    groups: [
      { color: "yellow", category: "Edelmetalen", words: ["GOUD", "ZILVER", "KOPER", "BRONS"] },
      { color: "green",  category: "Vogels", words: ["UIL", "KRAAI", "MEES", "REIGER"] },
      { color: "blue",   category: "Fruit", words: ["KERS", "PEER", "BANAAN", "AARDBEI"] },
      { color: "purple", category: "___ boom", words: ["KERST", "STAM", "OLIJF", "APPEL"] },
    ],
  },
  {
    id: 2,
    groups: [
      { color: "yellow", category: "Citrusvruchten", words: ["CITROEN", "SINAASAPPEL", "LIMOEN", "MANDARIJN"] },
      { color: "green",  category: "Kookgerei", words: ["GARDE", "RASP", "POLLEPEL", "ZEEF"] },
      { color: "blue",   category: "Edelstenen", words: ["RUBIJN", "PAREL", "OPAAL", "JADE"] },
      { color: "purple", category: "___ bord", words: ["SCHAAK", "SCHOOL", "TOETSEN", "DART"] },
    ],
  },
  {
    id: 3,
    groups: [
      { color: "yellow", category: "Sporten", words: ["TENNIS", "VOETBAL", "RUGBY", "HOCKEY"] },
      { color: "green",  category: "Gereedschap", words: ["HAMER", "BOOR", "ZAAG", "TANG"] },
      { color: "blue",   category: "Lichaamsdelen", words: ["ARM", "BEEN", "OOG", "OOR"] },
      { color: "purple", category: "___ licht", words: ["DAG", "KAARS", "ZON", "MAAN"] },
    ],
  },
  {
    id: 4,
    groups: [
      { color: "yellow", category: "Continenten", words: ["AZIË", "EUROPA", "AFRIKA", "AUSTRALIË"] },
      { color: "green",  category: "Seizoenen", words: ["LENTE", "ZOMER", "HERFST", "WINTER"] },
      { color: "blue",   category: "Talen", words: ["NEDERLANDS", "DUITS", "FRANS", "ENGELS"] },
      { color: "purple", category: "___ dag", words: ["VRIJ", "MAAN", "WERK", "FEEST"] },
    ],
  },
  {
    id: 5,
    groups: [
      { color: "yellow", category: "Drank", words: ["KOFFIE", "THEE", "MELK", "SAP"] },
      { color: "green",  category: "Emoties", words: ["VREUGDE", "ANGST", "BOOSHEID", "VERDRIET"] },
      { color: "blue",   category: "Munten", words: ["EURO", "DOLLAR", "POND", "YEN"] },
      { color: "purple", category: "___ huis", words: ["BOOM", "POPPEN", "PAK", "ZIEKEN"] },
    ],
  },
  {
    id: 6,
    groups: [
      { color: "yellow", category: "Insecten", words: ["BIJ", "MIER", "VLIEG", "MOT"] },
      { color: "green",  category: "Kleding", words: ["HEMD", "BROEK", "SCHOEN", "SOK"] },
      { color: "blue",   category: "Bewegen", words: ["RENNEN", "SPRINGEN", "LOPEN", "KRUIPEN"] },
      { color: "purple", category: "___ stoel", words: ["ARM", "KINDER", "SCHOMMEL", "STRAND"] },
    ],
  },
  {
    id: 7,
    groups: [
      { color: "yellow", category: "Bloemen", words: ["ROOS", "TULP", "NARCIS", "ZONNEBLOEM"] },
      { color: "green",  category: "Schaakstukken", words: ["KONING", "KONINGIN", "TOREN", "LOPER"] },
      { color: "blue",   category: "Granen", words: ["TARWE", "RIJST", "HAVER", "GERST"] },
      { color: "purple", category: "___ papier", words: ["TOILET", "SCHUUR", "PAK", "BEHANG"] },
    ],
  },
  {
    id: 8,
    groups: [
      { color: "yellow", category: "Vissen", words: ["ZALM", "TONIJN", "KABELJAUW", "FOREL"] },
      { color: "green",  category: "Sterrenbeelden", words: ["STIER", "RAM", "LEEUW", "KREEFT"] },
      { color: "blue",   category: "Planeten", words: ["MARS", "VENUS", "JUPITER", "SATURNUS"] },
      { color: "purple", category: "___ bal", words: ["VOET", "KORF", "HAND", "SOFT"] },
    ],
  },
  {
    id: 9,
    groups: [
      { color: "yellow", category: "Familie", words: ["VADER", "MOEDER", "ZUS", "OOM"] },
      { color: "green",  category: "Maaltijden", words: ["LUNCH", "DINER", "BRUNCH", "ONTBIJT"] },
      { color: "blue",   category: "Beroepen", words: ["BAKKER", "SLAGER", "BOER", "VISSER"] },
      { color: "purple", category: "___ kaas", words: ["GEITEN", "BOEREN", "ROOM", "SCHIMMEL"] },
    ],
  },
  {
    id: 10,
    groups: [
      { color: "yellow", category: "Muziekinstrumenten", words: ["PIANO", "GITAAR", "VIOOL", "TROMMEL"] },
      { color: "green",  category: "Kruiden", words: ["BASILICUM", "OREGANO", "TIJM", "ROZEMARIJN"] },
      { color: "blue",   category: "Landen", words: ["SPANJE", "JAPAN", "BRAZILIË", "EGYPTE"] },
      { color: "purple", category: "___ park", words: ["WATER", "PRET", "THEMA", "DIEREN"] },
    ],
  },
];

// Per-locale puzzle pools. English is the canonical fallback for any
// locale we don't ship a native pool for yet — the page can still serve
// a daily puzzle, it just won't be in the player's language.
const PUZZLES_BY_LOCALE: Partial<Record<Locale, ConnectionsPuzzle[]>> = {
  en: PUZZLES,
  nl: PUZZLES_NL,
};

function poolFor(locale?: Locale): ConnectionsPuzzle[] {
  return (locale && PUZZLES_BY_LOCALE[locale]) || PUZZLES;
}

export function pickPuzzle(seed: number, locale?: Locale): ConnectionsPuzzle {
  const pool = poolFor(locale);
  const idx = ((seed % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

export function puzzleCount(locale?: Locale): number {
  return poolFor(locale).length;
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
