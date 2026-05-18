// Connections — NYT-style "find 4 groups of 4" word puzzle.
//
// Per-locale puzzle pools. Wordplay-based puzzles don't machine-translate,
// so each locale carries its own hand-curated pool. Locales without a
// dedicated pool fall back to English so the game still works there until
// native content is authored.
//
// Future: replace the pools with LLM-generated dailies once we have real
// traffic to amortise the per-day generation cost. The function surface
// (`pickPuzzle`, `allWords`, `shuffleSeeded`) is designed so the page can
// stay unchanged when that swap happens.

import type { Locale } from "@/lib/i18n";

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
const EN_PUZZLES: ConnectionsPuzzle[] = [
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

const NL_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 101,
    groups: [
      { color: "yellow", category: "Vogels", words: ["UIL", "MEES", "EEND", "KIP"] },
      { color: "green",  category: "Bloemen", words: ["ROOS", "TULP", "IRIS", "LELIE"] },
      { color: "blue",   category: "Metalen", words: ["GOUD", "ZILVER", "KOPER", "TIN"] },
      { color: "purple", category: "Sporten", words: ["GOLF", "JUDO", "RUGBY", "SCHAKEN"] },
    ],
  },
  {
    id: 102,
    groups: [
      { color: "yellow", category: "Bomen", words: ["EIK", "BEUK", "BERK", "IEP"] },
      { color: "green",  category: "Fruit", words: ["APPEL", "PEER", "KERS", "DRUIF"] },
      { color: "blue",   category: "Drank", words: ["BIER", "WIJN", "MELK", "COLA"] },
      { color: "purple", category: "Kleuren", words: ["ROOD", "BLAUW", "GROEN", "GEEL"] },
    ],
  },
  {
    id: 103,
    groups: [
      { color: "yellow", category: "Maanden", words: ["MAART", "MEI", "JUNI", "JULI"] },
      { color: "green",  category: "Weer", words: ["REGEN", "SNEEUW", "MIST", "ZON"] },
      { color: "blue",   category: "Sterrenbeelden", words: ["LEEUW", "RAM", "STIER", "KREEFT"] },
      { color: "purple", category: "Lichaamsdelen", words: ["HOOFD", "ARM", "BEEN", "VOET"] },
    ],
  },
  {
    id: 104,
    groups: [
      { color: "yellow", category: "Gereedschap", words: ["HAMER", "ZAAG", "BOOR", "BEITEL"] },
      { color: "green",  category: "Instrumenten", words: ["PIANO", "GITAAR", "FLUIT", "VIOOL"] },
      { color: "blue",   category: "Voertuigen", words: ["AUTO", "FIETS", "BUS", "TREIN"] },
      { color: "purple", category: "Tijd", words: ["UUR", "MINUUT", "SECONDE", "DAG"] },
    ],
  },
  {
    id: 105,
    groups: [
      { color: "yellow", category: "Geld", words: ["EURO", "DOLLAR", "POND", "YEN"] },
      { color: "green",  category: "Beroepen", words: ["BAKKER", "KAPPER", "LERAAR", "BOER"] },
      { color: "blue",   category: "Stad", words: ["HUIS", "STRAAT", "PLEIN", "PARK"] },
      { color: "purple", category: "Familie", words: ["PAPA", "MAMA", "OOM", "TANTE"] },
    ],
  },
];

const DE_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 201,
    groups: [
      { color: "yellow", category: "Tiere", words: ["HUND", "KATZE", "MAUS", "PFERD"] },
      { color: "green",  category: "Farben", words: ["ROT", "BLAU", "GRÜN", "GELB"] },
      { color: "blue",   category: "Monate", words: ["MAI", "JUNI", "JULI", "MÄRZ"] },
      { color: "purple", category: "Sport", words: ["TENNIS", "GOLF", "RUGBY", "JUDO"] },
    ],
  },
  {
    id: 202,
    groups: [
      { color: "yellow", category: "Obst", words: ["APFEL", "BIRNE", "KIRSCHE", "TRAUBE"] },
      { color: "green",  category: "Bäume", words: ["EICHE", "BUCHE", "BIRKE", "AHORN"] },
      { color: "blue",   category: "Berufe", words: ["BÄCKER", "LEHRER", "ARZT", "KOCH"] },
      { color: "purple", category: "Getränke", words: ["BIER", "WEIN", "MILCH", "COLA"] },
    ],
  },
];

const FR_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 301,
    groups: [
      { color: "yellow", category: "Animaux", words: ["CHIEN", "CHAT", "CHEVAL", "SOURIS"] },
      { color: "green",  category: "Couleurs", words: ["ROUGE", "BLEU", "VERT", "JAUNE"] },
      { color: "blue",   category: "Mois", words: ["MAI", "JUIN", "JUILLET", "MARS"] },
      { color: "purple", category: "Fruits", words: ["POMME", "POIRE", "CERISE", "RAISIN"] },
    ],
  },
  {
    id: 302,
    groups: [
      { color: "yellow", category: "Sport", words: ["TENNIS", "GOLF", "RUGBY", "JUDO"] },
      { color: "green",  category: "Arbres", words: ["CHÊNE", "HÊTRE", "BOULEAU", "SAPIN"] },
      { color: "blue",   category: "Métiers", words: ["BOULANGER", "PROF", "MÉDECIN", "CHEF"] },
      { color: "purple", category: "Boissons", words: ["BIÈRE", "VIN", "LAIT", "EAU"] },
    ],
  },
];

const ES_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 401,
    groups: [
      { color: "yellow", category: "Animales", words: ["PERRO", "GATO", "RATÓN", "CABALLO"] },
      { color: "green",  category: "Colores", words: ["ROJO", "AZUL", "VERDE", "AMARILLO"] },
      { color: "blue",   category: "Meses", words: ["MAYO", "JUNIO", "JULIO", "MARZO"] },
      { color: "purple", category: "Frutas", words: ["MANZANA", "PERA", "CEREZA", "UVA"] },
    ],
  },
  {
    id: 402,
    groups: [
      { color: "yellow", category: "Deportes", words: ["TENIS", "GOLF", "RUGBY", "JUDO"] },
      { color: "green",  category: "Árboles", words: ["ROBLE", "HAYA", "PINO", "ABEDUL"] },
      { color: "blue",   category: "Oficios", words: ["PANADERO", "MAESTRO", "MÉDICO", "CHEF"] },
      { color: "purple", category: "Bebidas", words: ["CERVEZA", "VINO", "LECHE", "AGUA"] },
    ],
  },
];

const PT_BR_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 501,
    groups: [
      { color: "yellow", category: "Animais", words: ["CACHORRO", "GATO", "RATO", "CAVALO"] },
      { color: "green",  category: "Cores", words: ["VERMELHO", "AZUL", "VERDE", "AMARELO"] },
      { color: "blue",   category: "Meses", words: ["MAIO", "JUNHO", "JULHO", "MARÇO"] },
      { color: "purple", category: "Frutas", words: ["MAÇÃ", "PERA", "CEREJA", "UVA"] },
    ],
  },
  {
    id: 502,
    groups: [
      { color: "yellow", category: "Esportes", words: ["TÊNIS", "GOLFE", "RUGBY", "JUDÔ"] },
      { color: "green",  category: "Árvores", words: ["CARVALHO", "PINHEIRO", "IPÊ", "CEDRO"] },
      { color: "blue",   category: "Profissões", words: ["PADEIRO", "PROFESSOR", "MÉDICO", "CHEF"] },
      { color: "purple", category: "Bebidas", words: ["CERVEJA", "VINHO", "LEITE", "ÁGUA"] },
    ],
  },
];

// Locales without a dedicated pool fall back to English. Hindi and
// Japanese aren't curated here yet — their wordplay needs native authors
// to set categories that actually overlap.
const POOLS: Partial<Record<Locale, ConnectionsPuzzle[]>> = {
  en: EN_PUZZLES,
  nl: NL_PUZZLES,
  de: DE_PUZZLES,
  fr: FR_PUZZLES,
  es: ES_PUZZLES,
  "pt-BR": PT_BR_PUZZLES,
};

function poolFor(locale?: Locale): ConnectionsPuzzle[] {
  if (locale && POOLS[locale] && POOLS[locale]!.length > 0) return POOLS[locale]!;
  return EN_PUZZLES;
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
