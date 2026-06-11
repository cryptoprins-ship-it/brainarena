# Contributing

## Local dev

```bash
npm install
npm run dev          # http://localhost:3001
```

Before pushing, run the same gates CI runs:

```bash
npx tsc --noEmit     # typecheck
npm run lint
npm run test:puzzles # puzzle smoke tests
npm run build        # production build
```

`main` must stay green (see [Deployment](Deployment.md) brand policy).

## Conventions

- **TypeScript everywhere.** Game logic in `lib/games/` is pure — no React, no `localStorage`, no `fetch`.
- **i18n:** never hardcode user-facing English. Route copy through `lib/i18n.ts`; static locale data through `lib/locales.ts`.
- **Server/client:** server components import locale data from `lib/locales.ts`, never `lib/i18n.ts` (`"use client"`).
- **SEO:** new routes go in `app/sitemap.ts` with hreflang alternates, or they won't be indexed. Canonicals point at `brainarena.fun` only.
- **Security:** leaderboard writes pass `verifyOrigin` + rate limit + zod + `validateScore`. New third-party origins go in the CSP in `next.config.ts`.
- **Persisted client state** goes through `lib/safeStorage.ts`.

## DOX workflow (binding)

This repo uses the **DOX** AGENTS.md system. Before editing:

1. Read the root `AGENTS.md`.
2. Walk from the repo root to each file you'll touch, reading every `AGENTS.md` on the path.
3. Use the nearest `AGENTS.md` as the local contract.

After a meaningful change, do a **DOX pass**: update the closest owning
`AGENTS.md` (and affected parents/children) when purpose, structure,
contracts, workflows, inputs/outputs, or the child index change. Remove stale
text. The four child docs:

- `app/AGENTS.md` — routing, rendering, SEO metadata, leaderboard API
- `components/AGENTS.md` — shared UI
- `lib/AGENTS.md` — core logic (games, leaderboard, seo, i18n, scoring)
- `data/AGENTS.md` — static word lists + slur filters

Keep this wiki (`docs/wiki/`) in sync when behaviour changes — the wiki
explains *how it works*; AGENTS.md governs *how to change it*.

## Common tasks

- **Add a game** → [Games](Games.md#adding-a-new-game).
- **Add a locale** → [SEO & i18n](SEO-and-i18n.md#adding-a-locale).
- **Site not in Google** → [SEO & i18n](SEO-and-i18n.md#indexation-playbook).
