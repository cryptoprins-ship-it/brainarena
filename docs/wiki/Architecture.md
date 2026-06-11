# Architecture

## Stack

- **Framework:** Next.js 16.2.4, App Router.
- **UI:** React 19, Tailwind CSS 4.
- **Language:** TypeScript 5.
- **Data:** Upstash Redis (`@upstash/redis`) + Upstash rate limiting (`@upstash/ratelimit`) for the leaderboard. Everything else is static or client-local.
- **Validation:** `zod`.
- **Logging:** `pino`.

## Folder map

```
app/                 App Router
  [locale]/<game>/   Localized routes (canonical), layout.tsx = metadata, page.tsx = render
  <game>/            Legacy non-prefixed routes (default en)
  api/leaderboard/   Server API: route.ts, champion/, rename/
  sitemap.ts robots.ts opengraph-image.tsx   Generated SEO assets
components/          Shared presentational UI (nav, leaderboards, share, JSON-LD, consent)
lib/                 Core logic
  games/             Pure per-game engines
  leaderboard/       Redis store, standings, validation, flags
  seo/               hreflang + locale metadata helpers
  i18n.ts locales.ts LocaleProvider.tsx   Localization
  scores.ts achievements.ts share.ts dailyWord.ts ...   Cross-cutting
data/wordlists/      Per-locale Wordle lists + slur filters (static JSON)
public/              Static assets; scores/*.json snapshots; css-recovery.js
```

## Request flow

1. Browser hits a route (e.g. `/nl/wordle` or legacy `/wordle`).
2. The route `layout.tsx` runs `generateMetadata` → title, description, canonical, hreflang, OpenGraph (via `lib/seo/` + `lib/seoMeta.ts`).
3. `page.tsx` renders the game UI, pulling copy through `lib/i18n.ts` and logic from `lib/games/`.
4. Daily puzzle is seeded deterministically from today's date + locale (`lib/dailyWord.ts`, word lists in `data/`).
5. Play state persists client-side via `lib/safeStorage.ts` (`localStorage`).
6. On finish, scores can be submitted to `app/api/leaderboard` → validated (`lib/leaderboard/validate.ts`) → stored in Redis.

## Server vs client split (important)

`lib/i18n.ts` is a **client** module (`"use client"`): it owns the `useLocale`
hook and a module-level mutable `current` locale, so Turbopack proxies its
exports as client-reference stubs — unusable from server components.

Therefore all **static** locale data (the locale list, native labels, flag
emoji, review-pending set) lives in `lib/locales.ts`, which is server-safe and
re-exported by `lib/i18n.ts`. **Rule:** server components import locale data
from `lib/locales.ts`, never from `lib/i18n.ts`.

## Determinism

Daily puzzles must be reproducible: same date + locale → same puzzle for every
user. Seeding paths avoid `Math.random`; `data/wordlists/<locale>/solutions.json`
order is load-bearing (the date indexes into it). Append to solutions, never
reorder.
