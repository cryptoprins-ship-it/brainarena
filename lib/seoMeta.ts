// Localized SEO metadata + JSON-LD descriptors for the homepage and the
// four new logic puzzles. NL/EN are native; DE/FR/ES/PT-BR are
// machine-translated starting points (TBD: native review). HI/JA are
// high-risk machine translations and must NOT ship to production until
// reviewed — see REVIEW_PENDING in lib/i18n.ts.
//
// Wiring note: Next.js metadata is resolved server-side. To deliver these
// per-locale strings as <title>/<meta description>, the app needs a
// /[locale]/ route segment so generateMetadata can read params.locale.
// Until that refactor lands the data lives here as the single source of
// truth — components read from getSeoMeta() for client-side <head>
// fallbacks via next/head and for sharing-flow OG previews.

import type { Locale } from "./i18n";

export type SeoEntry = {
  title: string;
  description: string;
  /** Used inside JSON-LD VideoGame / Game schema entries. */
  jsonLd: {
    name: string;
    description: string;
  };
};

export type SeoPage =
  | "home"
  | "vlakken"
  | "verbind"
  | "zonmaan"
  | "kronen";

const SEO: Record<Locale, Record<SeoPage, SeoEntry>> = {
  en: {
    home: {
      title: "BrainArena — Free Daily Puzzles & Word Games",
      description:
        "Play free daily Wordle, Boggle, Sudoku, logic puzzles and typing games. Compete globally in 8 languages.",
      jsonLd: {
        name: "BrainArena",
        description: "Free daily browser puzzles and word games in 8 languages.",
      },
    },
    vlakken: {
      title: "Patches — Daily Shape Logic Puzzle",
      description:
        "Fill the grid by completing the rectangular shapes around each numbered anchor. New daily puzzles in Easy, Medium and Hard.",
      jsonLd: {
        name: "Patches",
        description: "Rectangle-tiling logic puzzle with one unique solution per day.",
      },
    },
    verbind: {
      title: "Connect — Daily Hamiltonian Path Puzzle",
      description:
        "Trace one path through every cell that visits the numbered checkpoints in order. Three difficulty levels updated daily.",
      jsonLd: {
        name: "Connect",
        description: "Hamiltonian path puzzle: one continuous path through every cell, hitting checkpoints in order.",
      },
    },
    zonmaan: {
      title: "Sun & Moon — Daily Binary Logic Grid",
      description:
        "Fill the grid with suns and moons. No three in a row, balanced rows and columns, plus = / × edge constraints.",
      jsonLd: {
        name: "Sun & Moon",
        description: "Binary logic grid: balanced rows/columns, no three-in-a-row, edge equality and opposition constraints.",
      },
    },
    kronen: {
      title: "Crowns — Daily Logic Puzzle",
      description:
        "Place one crown in each row, column and color region. Crowns may not touch — not even diagonally. Daily puzzles.",
      jsonLd: {
        name: "Crowns",
        description: "N-crowns logic puzzle: one per row, column and region, with no king-move adjacencies.",
      },
    },
  },
  nl: {
    home: {
      title: "BrainArena — Gratis dagelijkse puzzels & woordspellen",
      description:
        "Speel gratis dagelijkse Wordle, Boggle, Sudoku, logica-puzzels en typespellen. Wereldwijd in 8 talen.",
      jsonLd: {
        name: "BrainArena",
        description: "Gratis dagelijkse browserpuzzels en woordspellen in 8 talen.",
      },
    },
    vlakken: {
      title: "Vlakken — Dagelijkse vormpuzzel",
      description:
        "Vul het rooster door de rechthoekige vormen rond elke genummerde anker te voltooien. Nieuwe dagelijkse puzzels op Makkelijk, Gemiddeld en Moeilijk.",
      jsonLd: {
        name: "Vlakken",
        description: "Logica-puzzel met rechthoekige vormen — elke dag één unieke oplossing.",
      },
    },
    verbind: {
      title: "Verbind — Dagelijkse padpuzzel",
      description:
        "Trek één pad door elke cel dat de genummerde punten in volgorde bezoekt. Drie moeilijkheidsgraden, elke dag nieuw.",
      jsonLd: {
        name: "Verbind",
        description: "Hamiltoniaans pad: één doorlopend pad door elke cel, in volgorde langs de checkpoints.",
      },
    },
    zonmaan: {
      title: "Zon & Maan — Dagelijkse binaire puzzel",
      description:
        "Vul het rooster met zonnen en manen. Niet drie op een rij, gebalanceerde rijen en kolommen, plus = / × randregels.",
      jsonLd: {
        name: "Zon & Maan",
        description: "Binaire logica-puzzel: gebalanceerde rijen/kolommen, geen drie op een rij, gelijkheid- en tegenstellings-randregels.",
      },
    },
    kronen: {
      title: "Kronen — Dagelijkse logica-puzzel",
      description:
        "Plaats één kroon in elke rij, kolom en kleurgebied. Kronen mogen elkaar niet raken — ook niet diagonaal. Dagelijkse puzzels.",
      jsonLd: {
        name: "Kronen",
        description: "N-kronen logica-puzzel: één per rij, kolom en gebied, zonder koningszet-aanrakingen.",
      },
    },
  },
  // TBD: native review.
  de: {
    home: {
      title: "BrainArena — Kostenlose tägliche Rätsel & Wortspiele",
      description:
        "Spiele kostenlos tägliche Wordle, Boggle, Sudoku, Logikrätsel und Tippspiele. Weltweit in 8 Sprachen.",
      jsonLd: {
        name: "BrainArena",
        description: "Kostenlose tägliche Browser-Rätsel und Wortspiele in 8 Sprachen.",
      },
    },
    vlakken: {
      title: "Flächen — Tägliches Form-Logikrätsel",
      description:
        "Fülle das Raster, indem du die rechteckigen Formen um jeden nummerierten Anker vervollständigst. Neue Tagesrätsel in Einfach, Mittel und Schwer.",
      jsonLd: {
        name: "Flächen",
        description: "Logikrätsel mit Rechteckparkettierung — jeden Tag eine eindeutige Lösung.",
      },
    },
    verbind: {
      title: "Verbinden — Tägliches Pfadrätsel",
      description:
        "Ziehe einen Pfad durch jede Zelle, der die nummerierten Punkte der Reihe nach besucht. Drei Schwierigkeitsstufen, täglich neu.",
      jsonLd: {
        name: "Verbinden",
        description: "Hamiltonscher Pfad: ein durchgehender Weg durch jede Zelle, in der Reihenfolge der Checkpoints.",
      },
    },
    zonmaan: {
      title: "Sonne & Mond — Tägliches Binärrätsel",
      description:
        "Fülle das Raster mit Sonnen und Monden. Keine drei in einer Reihe, ausgeglichene Zeilen/Spalten, plus = / × Randregeln.",
      jsonLd: {
        name: "Sonne & Mond",
        description: "Binäres Logikrätsel: ausgeglichene Zeilen/Spalten, keine drei in einer Reihe, Gleichheits- und Gegensatzkanten.",
      },
    },
    kronen: {
      title: "Kronen — Tägliches Logikrätsel",
      description:
        "Platziere eine Krone in jeder Zeile, Spalte und Farbregion. Kronen dürfen sich nicht berühren — auch nicht diagonal. Tägliche Rätsel.",
      jsonLd: {
        name: "Kronen",
        description: "N-Kronen-Logikrätsel: eine pro Zeile, Spalte und Region, ohne Königszug-Berührungen.",
      },
    },
  },
  // TBD: native review.
  fr: {
    home: {
      title: "BrainArena — Puzzles quotidiens & jeux de mots gratuits",
      description:
        "Joue gratuitement à Wordle, Boggle, Sudoku, énigmes logiques et jeux de frappe quotidiens. Compétition mondiale en 8 langues.",
      jsonLd: {
        name: "BrainArena",
        description: "Puzzles quotidiens gratuits et jeux de mots dans le navigateur, en 8 langues.",
      },
    },
    vlakken: {
      title: "Pièces — Puzzle de formes quotidien",
      description:
        "Remplis la grille en complétant les formes rectangulaires autour de chaque ancre numérotée. Nouvelles grilles quotidiennes en Facile, Moyen et Difficile.",
      jsonLd: {
        name: "Pièces",
        description: "Puzzle de pavage rectangulaire avec une solution unique par jour.",
      },
    },
    verbind: {
      title: "Relier — Puzzle de chemin quotidien",
      description:
        "Trace un chemin par chaque cellule qui visite les points numérotés dans l'ordre. Trois niveaux, mis à jour chaque jour.",
      jsonLd: {
        name: "Relier",
        description: "Chemin hamiltonien : un trajet continu par chaque cellule, dans l'ordre des points de contrôle.",
      },
    },
    zonmaan: {
      title: "Soleil & Lune — Grille binaire quotidienne",
      description:
        "Remplis la grille avec soleils et lunes. Pas trois identiques d'affilée, lignes/colonnes équilibrées, contraintes de bord = / ×.",
      jsonLd: {
        name: "Soleil & Lune",
        description: "Grille de logique binaire : lignes/colonnes équilibrées, pas de trois d'affilée, contraintes d'égalité et d'opposition.",
      },
    },
    kronen: {
      title: "Couronnes — Puzzle de logique quotidien",
      description:
        "Place une couronne dans chaque ligne, colonne et région colorée. Les couronnes ne peuvent se toucher — diagonale incluse. Puzzles quotidiens.",
      jsonLd: {
        name: "Couronnes",
        description: "Puzzle des N couronnes : une par ligne, colonne et région, sans contact (mouvement de roi).",
      },
    },
  },
  // TBD: native review.
  es: {
    home: {
      title: "BrainArena — Puzzles diarios y juegos de palabras gratis",
      description:
        "Juega gratis a Wordle, Boggle, Sudoku, puzzles de lógica y juegos de tipeo diarios. Compite globalmente en 8 idiomas.",
      jsonLd: {
        name: "BrainArena",
        description: "Puzzles diarios gratis y juegos de palabras en el navegador, en 8 idiomas.",
      },
    },
    vlakken: {
      title: "Parches — Puzzle diario de formas",
      description:
        "Rellena la cuadrícula completando las formas rectangulares alrededor de cada ancla numerada. Nuevos puzzles diarios en Fácil, Medio y Difícil.",
      jsonLd: {
        name: "Parches",
        description: "Puzzle de teselado rectangular con una solución única cada día.",
      },
    },
    verbind: {
      title: "Conecta — Puzzle diario de camino",
      description:
        "Traza un camino por cada celda que visite los puntos numerados en orden. Tres niveles, actualizados a diario.",
      jsonLd: {
        name: "Conecta",
        description: "Camino hamiltoniano: un trayecto continuo por cada celda, en el orden de los puntos de control.",
      },
    },
    zonmaan: {
      title: "Sol y Luna — Cuadrícula binaria diaria",
      description:
        "Llena la cuadrícula con soles y lunas. Sin tres seguidos, filas/columnas equilibradas, restricciones de borde = / ×.",
      jsonLd: {
        name: "Sol y Luna",
        description: "Cuadrícula de lógica binaria: filas/columnas equilibradas, sin tres en raya, restricciones de igualdad y oposición.",
      },
    },
    kronen: {
      title: "Coronas — Puzzle de lógica diario",
      description:
        "Coloca una corona en cada fila, columna y región de color. Las coronas no pueden tocarse — ni en diagonal. Puzzles diarios.",
      jsonLd: {
        name: "Coronas",
        description: "Puzzle de N coronas: una por fila, columna y región, sin adyacencias de movimiento de rey.",
      },
    },
  },
  // High-risk machine translation — review pending.
  hi: {
    home: {
      title: "BrainArena — मुफ्त दैनिक पहेलियाँ और शब्द खेल",
      description:
        "Wordle, Boggle, Sudoku, तर्क पहेलियाँ और टाइपिंग खेल मुफ्त खेलें। 8 भाषाओं में वैश्विक प्रतिस्पर्धा।",
      jsonLd: {
        name: "BrainArena",
        description: "8 भाषाओं में मुफ्त दैनिक ब्राउज़र पहेलियाँ और शब्द खेल।",
      },
    },
    vlakken: {
      title: "टुकड़े — दैनिक आकार तर्क पहेली",
      description:
        "हर संख्या एंकर के चारों ओर आयताकार आकृतियाँ पूरी करके ग्रिड भरें। आसान, मध्यम और कठिन में नई दैनिक पहेलियाँ।",
      jsonLd: {
        name: "टुकड़े",
        description: "आयताकार टाइलिंग तर्क पहेली — रोज़ एक अनूठा हल।",
      },
    },
    verbind: {
      title: "जोड़ें — दैनिक पथ पहेली",
      description:
        "एक रास्ता खींचें जो हर सेल से होकर क्रम से नंबरों को जोड़े। तीन स्तर, रोज़ नई पहेली।",
      jsonLd: {
        name: "जोड़ें",
        description: "हैमिल्टनी पथ: हर सेल से होकर एक सतत रास्ता, क्रम में चेकपॉइंट छूते हुए।",
      },
    },
    zonmaan: {
      title: "सूर्य और चंद्र — दैनिक बाइनरी ग्रिड",
      description:
        "ग्रिड को सूर्यों और चंद्रमाओं से भरें। एक पंक्ति में तीन समान नहीं, संतुलित पंक्तियाँ/स्तंभ, = / × किनारे की बाधाएँ।",
      jsonLd: {
        name: "सूर्य और चंद्र",
        description: "बाइनरी तर्क ग्रिड: संतुलित पंक्तियाँ/स्तंभ, कोई तीन एक साथ नहीं, समानता और विरोध के किनारे।",
      },
    },
    kronen: {
      title: "मुकुट — दैनिक तर्क पहेली",
      description:
        "हर पंक्ति, स्तंभ और रंगीन क्षेत्र में एक मुकुट रखें। मुकुट एक-दूसरे को नहीं छू सकते — तिरछे भी नहीं। दैनिक पहेलियाँ।",
      jsonLd: {
        name: "मुकुट",
        description: "N-मुकुट तर्क पहेली: हर पंक्ति, स्तंभ और क्षेत्र में एक, बिना राजा-चाल आसन्नता।",
      },
    },
  },
  // TBD: native Brazilian Portuguese review.
  "pt-BR": {
    home: {
      title: "BrainArena — Quebra-cabeças diários e jogos de palavras grátis",
      description:
        "Jogue Wordle, Boggle, Sudoku, quebra-cabeças de lógica e jogos de digitação grátis. Competição global em 8 idiomas.",
      jsonLd: {
        name: "BrainArena",
        description: "Quebra-cabeças diários grátis e jogos de palavras no navegador, em 8 idiomas.",
      },
    },
    vlakken: {
      title: "Retalhos — Quebra-cabeça diário de formas",
      description:
        "Preencha a grade completando as formas retangulares ao redor de cada âncora numerada. Novos quebra-cabeças diários em Fácil, Médio e Difícil.",
      jsonLd: {
        name: "Retalhos",
        description: "Quebra-cabeça de pavimentação retangular com uma solução única por dia.",
      },
    },
    verbind: {
      title: "Conectar — Quebra-cabeça diário de caminho",
      description:
        "Trace um caminho por cada célula que visita os pontos numerados em ordem. Três níveis de dificuldade, atualizados diariamente.",
      jsonLd: {
        name: "Conectar",
        description: "Caminho hamiltoniano: um trajeto contínuo por cada célula, na ordem dos checkpoints.",
      },
    },
    zonmaan: {
      title: "Sol e Lua — Grade binária diária",
      description:
        "Preencha a grade com sóis e luas. Nada de três seguidos, linhas/colunas equilibradas, restrições de borda = / ×.",
      jsonLd: {
        name: "Sol e Lua",
        description: "Grade de lógica binária: linhas/colunas equilibradas, sem três em linha, restrições de igualdade e oposição.",
      },
    },
    kronen: {
      title: "Coroas — Quebra-cabeça de lógica diário",
      description:
        "Coloque uma coroa em cada linha, coluna e região colorida. Coroas não podem se tocar — nem na diagonal. Quebra-cabeças diários.",
      jsonLd: {
        name: "Coroas",
        description: "Quebra-cabeça de N coroas: uma por linha, coluna e região, sem adjacências de movimento de rei.",
      },
    },
  },
  // High-risk machine translation — review pending.
  ja: {
    home: {
      title: "BrainArena — 無料の日替わりパズル & 言葉遊び",
      description:
        "Wordle、Boggle、Sudoku、論理パズル、タイピングを毎日無料でプレイ。8 言語で世界中と競おう。",
      jsonLd: {
        name: "BrainArena",
        description: "8 言語で楽しめる、毎日更新の無料ブラウザパズル & ワードゲーム。",
      },
    },
    vlakken: {
      title: "パッチ — 日替わり形ロジックパズル",
      description:
        "番号付きアンカーの周りの長方形を完成させてグリッドを埋めよう。やさしい/ふつう/むずかしいの新しい日替わりパズル。",
      jsonLd: {
        name: "パッチ",
        description: "長方形タイル張りのロジックパズル — 毎日 1 つの一意解。",
      },
    },
    verbind: {
      title: "つなぐ — 日替わり経路パズル",
      description:
        "全マスを通る一本道で番号順にチェックポイントを訪れよう。3 段階の難易度、毎日更新。",
      jsonLd: {
        name: "つなぐ",
        description: "ハミルトン路: 全マスを通る連続した経路で、チェックポイントを順に訪れる。",
      },
    },
    zonmaan: {
      title: "太陽と月 — 日替わりバイナリグリッド",
      description:
        "グリッドを太陽と月で埋めよう。3 連続禁止、各行・列のバランス、= / × のエッジ制約。",
      jsonLd: {
        name: "太陽と月",
        description: "バイナリ論理グリッド: 行・列のバランス、3 連続禁止、同値・反値のエッジ制約。",
      },
    },
    kronen: {
      title: "クラウン — 日替わりロジックパズル",
      description:
        "各行・列・カラー領域にクラウンを 1 つずつ。斜めも含めて隣接禁止。毎日更新。",
      jsonLd: {
        name: "クラウン",
        description: "N クラウン論理パズル: 各行・列・領域に 1 つずつ、キング隣接なし。",
      },
    },
  },
};

export function getSeoMeta(locale: Locale, page: SeoPage): SeoEntry {
  return SEO[locale]?.[page] ?? SEO.en[page];
}

/**
 * JSON-LD descriptor for a puzzle page. Drop the result into a
 * <script type="application/ld+json"> element. Wired-up consumers should
 * compose this with site-level fields (publisher, url, etc.).
 */
export function gameJsonLd(locale: Locale, page: Exclude<SeoPage, "home">) {
  const entry = getSeoMeta(locale, page);
  return {
    "@context": "https://schema.org",
    "@type": "Game",
    name: entry.jsonLd.name,
    description: entry.jsonLd.description,
    inLanguage: locale,
    genre: "Logic puzzle",
  };
}
