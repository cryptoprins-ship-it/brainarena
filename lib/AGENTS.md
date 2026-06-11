# lib — Core domain logic

## Purpose

The brain of the app. Game engines, leaderboard persistence + validation,
SEO/i18n helpers, scoring, rate limiting, and deterministic daily-puzzle
seeding. Pages and components stay thin by delegating here.

## Ownership

- `lib/games/` — per-game pure logic: `wordleState`, `connections`, `verbind` (nl connections), `kronen`, `vlakken`, `zonmaan`, `minesweeper`. Deterministic; no React, no I/O.
- `lib/leaderboard/` — `store.ts` (Upstash Redis), `standings.ts`, `validate.ts`, `flag.ts`. Security-sensitive: all leaderboard writes flow through `validate.ts`.
- `lib/seo/` (`hreflang.ts`, `localeMetadata.ts`) + `lib/seoMeta.ts` — metadata + hreflang generation used by route layouts.
- i18n: `lib/i18n.ts` (`"use client"`; `useLocale` hook + mutable `current`), `lib/locales.ts` (static locale list/labels/flags — server-safe), `lib/LocaleProvider.tsx`.
- Daily puzzles: `lib/dailyWord.ts`, `lib/dailyLock.ts`, `lib/dictionary.ts`, `lib/gameContent.ts`, `lib/wordle/guesses.ts`.
- Cross-cutting: `lib/scores.ts`, `lib/achievements.ts`, `lib/benchmarks.ts`, `lib/share.ts`, `lib/ratelimit.ts`, `lib/verifyOrigin.ts`, `lib/safeStorage.ts`, `lib/logger.ts`, `lib/howToPlay.ts`, `lib/typingTexts.ts`, `lib/ralColors.ts`, `lib/sudoku.ts`.

## Local Contracts

- Daily puzzles are **deterministic from the date** — same date + locale must yield the same puzzle for every user. Do not introduce nondeterminism (no `Math.random` in seeding paths).
- `lib/leaderboard/validate.ts` is the trust boundary for user-submitted scores/names: validate with `zod`, apply the slur filter (`data/wordlists/slur-filter-*.json`), enforce bounds. Never write unvalidated input to Redis.
- Server/client split: anything imported by a server component must come from `lib/locales.ts` (or other non-`"use client"` modules), not `lib/i18n.ts`.
- Game engines stay pure: no `localStorage`, `window`, or fetch inside `lib/games/` — callers wire side effects.

## Work Guidance

- Adding a game: create `lib/games/<game>.ts` (pure logic), wire scoring via `lib/scores.ts`, register how-to copy in `lib/howToPlay.ts`, then add routes (see `app/AGENTS.md`) and sitemap entry.
- Persisted client state goes through `lib/safeStorage.ts` (guards SSR / disabled storage).

## Verification

- `npm run build` + `npm run lint`. Leaderboard/validation changes: exercise the `app/api/leaderboard` endpoints against valid and malicious payloads.

## Child DOX Index

- None yet. `lib/games/` and `lib/leaderboard/` are owned by this doc; promote either to its own AGENTS.md if its rules grow beyond the contracts above.
