import type { Metadata } from "next";
import { SUPPORTED, type Locale } from "@/lib/locales";
import { canonicalUrlFor, generateHreflangAlternates } from "./hreflang";

// Server-safe game-title table. Cannot import `translate` from
// `lib/i18n.ts` because that file is marked `"use client"`, which makes
// it return a client-reference proxy in this RSC context and throws at
// metadata-generation time. Mirror the relevant `game_<slug>` + `_desc`
// strings here for the six games we localize meta for.
type GameSlug =
  | "vlakken" | "verbind" | "zonmaan" | "kronen"
  | "minesweeper" | "connections";

const GAME_NAME: Record<GameSlug, Record<Locale, string>> = {
  vlakken:    { en: "Patches", nl: "Vlakken", de: "Flächen", fr: "Pièces", es: "Parches", hi: "टुकड़े", "pt-BR": "Retalhos", ja: "パッチ" },
  verbind:    { en: "Connect", nl: "Verbind", de: "Verbinde", fr: "Connecter", es: "Conectar", hi: "जोड़ें", "pt-BR": "Conectar", ja: "つなぐ" },
  zonmaan:    { en: "Sun & Moon", nl: "Zon & Maan", de: "Sonne & Mond", fr: "Soleil & Lune", es: "Sol y Luna", hi: "सूर्य और चंद्र", "pt-BR": "Sol e Lua", ja: "太陽と月" },
  kronen:     { en: "Crowns", nl: "Kronen", de: "Kronen", fr: "Couronnes", es: "Coronas", hi: "मुकुट", "pt-BR": "Coroas", ja: "クラウン" },
  minesweeper:{ en: "Minesweeper", nl: "Mijnenveger", de: "Minensucher", fr: "Démineur", es: "Buscaminas", hi: "माइनस्वीपर", "pt-BR": "Campo Minado", ja: "マインスイーパー" },
  connections:{ en: "Connections", nl: "Verbanden", de: "Verbindungen", fr: "Connexions", es: "Conexiones", hi: "संबंध", "pt-BR": "Conexões", ja: "コネクションズ" },
};

const GAME_DESC: Record<GameSlug, Record<Locale, string>> = {
  vlakken: {
    en: "Fill the grid with rectangles that cover every anchor",
    nl: "Vul het rooster met rechthoeken die elke zaadcel bedekken",
    de: "Fülle das Raster mit Rechtecken, die jeden Ankerwert abdecken",
    fr: "Remplissez la grille avec des rectangles couvrant chaque ancre",
    es: "Rellena la cuadrícula con rectángulos que cubran cada ancla",
    hi: "ग्रिड को आयतों से भरें जो प्रत्येक एंकर को कवर करें",
    "pt-BR": "Preencha a grade com retângulos que cobrem cada âncora",
    ja: "各アンカーを覆う長方形でグリッドを埋めよう",
  },
  verbind: {
    en: "Trace one continuous path through every cell in number order",
    nl: "Trek één doorlopend pad door elke cel in cijfervolgorde",
    de: "Zeichne einen durchgehenden Pfad in numerischer Reihenfolge",
    fr: "Tracez un chemin continu par chaque cellule dans l'ordre",
    es: "Traza un camino continuo por cada celda en orden numérico",
    hi: "हर कोशिका से होते हुए एक सतत पथ खींचें",
    "pt-BR": "Trace um caminho contínuo por cada célula em ordem numérica",
    ja: "すべてのマスを数字順に一筆書きでつなごう",
  },
  zonmaan: {
    en: "Fill the grid with suns and moons following the rules",
    nl: "Vul het rooster met zonnen en manen volgens de regels",
    de: "Fülle das Raster mit Sonnen und Monden nach den Regeln",
    fr: "Remplissez la grille avec soleils et lunes selon les règles",
    es: "Rellena la cuadrícula con soles y lunas según las reglas",
    hi: "नियमों के अनुसार ग्रिड को सूर्यों और चंद्रमाओं से भरें",
    "pt-BR": "Preencha a grade com sóis e luas seguindo as regras",
    ja: "ルールに従って太陽と月をグリッドに配置しよう",
  },
  kronen: {
    en: "Place one crown in each row, column, and color region",
    nl: "Plaats één kroon per rij, kolom en gekleurde regio",
    de: "Platziere eine Krone pro Reihe, Spalte und Farbregion",
    fr: "Placez une couronne par ligne, colonne et région colorée",
    es: "Coloca una corona en cada fila, columna y región de color",
    hi: "हर पंक्ति, स्तंभ और रंग क्षेत्र में एक मुकुट रखें",
    "pt-BR": "Coloque uma coroa em cada linha, coluna e região de cor",
    ja: "各行・列・色領域に冠を 1 つずつ配置しよう",
  },
  minesweeper: {
    en: "Clear the board without detonating any of the hidden mines",
    nl: "Maak het bord leeg zonder een mijn te triggeren",
    de: "Räume das Brett, ohne eine Mine auszulösen",
    fr: "Videz le plateau sans déclencher de mine",
    es: "Despeja el tablero sin activar minas",
    hi: "बिना खदान फटे पूरे बोर्ड को साफ करें",
    "pt-BR": "Limpe o tabuleiro sem detonar nenhuma mina",
    ja: "地雷を踏まずに盤面をすべて開けよう",
  },
  connections: {
    en: "Group 16 words into 4 hidden categories",
    nl: "Groepeer 16 woorden in 4 verborgen categorieën",
    de: "Gruppiere 16 Wörter in 4 versteckte Kategorien",
    fr: "Regroupez 16 mots dans 4 catégories cachées",
    es: "Agrupa 16 palabras en 4 categorías ocultas",
    hi: "16 शब्दों को 4 छिपी श्रेणियों में बाँटें",
    "pt-BR": "Agrupe 16 palavras em 4 categorias escondidas",
    ja: "16 個の言葉を 4 つのカテゴリーに分けよう",
  },
};

// Per-route layouts under app/[locale]/<route>/layout.tsx all need the
// same three things: validate the locale param, build a self-referencing
// canonical, and emit the full hreflang cluster for the path. Wrapping
// that in one helper keeps each route's layout to the metadata that's
// actually unique (title + description).
export async function buildLocaleMetadata({
  params,
  path,
  title,
  description,
}: {
  params: Promise<{ locale: string }>;
  path: string;
  title: string;
  description: string;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrlFor(path, safeLocale),
      languages: generateHreflangAlternates(path),
    },
  };
}

// Game-route variant: looks up per-locale title + description in the
// server-safe GAME_NAME / GAME_DESC tables above. We cannot import
// `translate` from `lib/i18n.ts` because that file is `"use client"`
// and would return a client-reference proxy here, throwing at metadata
// generation time.
export async function buildGameLocaleMetadata({
  params,
  path,
  slug,
}: {
  params: Promise<{ locale: string }>;
  path: string;
  slug: GameSlug;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  const name = GAME_NAME[slug][safeLocale] ?? GAME_NAME[slug].en;
  const desc = GAME_DESC[slug][safeLocale] ?? GAME_DESC[slug].en;
  return {
    title: `${name} — ${desc}`,
    description: desc,
    alternates: {
      canonical: canonicalUrlFor(path, safeLocale),
      languages: generateHreflangAlternates(path),
    },
  };
}
