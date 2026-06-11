# Games

Each game is a route under `app/` backed (where it has real logic) by a pure
engine in `lib/games/`. Pages are thin; the engine holds the rules.

## Catalogue

| Route | Engine (`lib/games/`) | Notes |
|-------|-----------------------|-------|
| `wordle` | `wordleState.ts` (+ `lib/wordle/guesses.ts`, `data/wordlists/`) | Daily word, per-locale lists |
| `connections` | `connections.ts` | Grouping puzzle |
| `verbind` | `verbind.ts` | Dutch connections variant |
| `kronen` | `kronen.ts` | |
| `vlakken` | `vlakken.ts` | |
| `zonmaan` | `zonmaan.ts` | |
| `minesweeper` | `minesweeper.ts` | |
| `sudoku` | `lib/sudoku.ts` | |
| `boggle` | — | |
| `colormatch` | — (uses `lib/ralColors.ts`) | |
| `letterstack` | — | |
| `tiledrop` | — | |
| `typing` | — (texts in `lib/typingTexts.ts`) | Time-based |

Localized copies live under `app/[locale]/<game>/`; legacy non-prefixed copies
under `app/<game>/`. Keep both in sync until the legacy set is retired.

## Scoring & leaderboards

- Per-game high scores: `lib/scores.ts` + snapshots in `public/scores/*.json`.
- Global online standings: `lib/leaderboard/` → Redis (see [Leaderboard](Leaderboard.md)).
- Three leaderboard render shapes exist in `components/`: `ScoreEndLeaderboard`, `TimeEndLeaderboard`, `WordleEndLeaderboard` — pick the one matching the game's metric (points / time / guesses).

## Adding a new game

1. **Logic:** `lib/games/<game>.ts` — pure, deterministic, no React / storage / fetch.
2. **Copy:** how-to text in `lib/howToPlay.ts`; user-facing strings via `lib/i18n.ts` (all locales).
3. **Routes:** `app/[locale]/<game>/{layout,page}.tsx` and (current pattern) `app/<game>/{layout,page}.tsx`. `layout.tsx` owns metadata.
4. **SEO:** add the route(s) to `app/sitemap.ts` with hreflang alternates, add `GameJsonLd`.
5. **Scoring:** wire through `lib/scores.ts`; choose a leaderboard component.
6. **Data:** if word-based, add per-locale lists under `data/wordlists/`.
7. Run `npm run build` + `npm run lint`.

See `lib/AGENTS.md` and `app/AGENTS.md` for the binding contracts.
