# BrainArena Wiki

Free daily brain & word games. Live at **https://brainarena.fun**.

This wiki is the human-readable map of the project. For binding edit rules
(what you must update when you touch a folder) see the `AGENTS.md` chain
starting at the repo root.

## Pages

| Page | What it covers |
|------|----------------|
| [Architecture](Architecture.md) | Stack, request flow, server/client split, folder map |
| [Games](Games.md) | The game catalogue and how a new game is added |
| [Leaderboard](Leaderboard.md) | Redis-backed global leaderboard, API, validation, anti-abuse |
| [SEO & i18n](SEO-and-i18n.md) | Locales, routing, metadata, sitemap, indexation |
| [Deployment](Deployment.md) | CI, build, hosting, environment |
| [Contributing](Contributing.md) | Local dev, conventions, DOX workflow |

## TL;DR

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4.
- **Persistence:** client `localStorage` for play state; Upstash Redis for the global leaderboard. No SQL database.
- **Locales:** `en nl de fr es hi pt-BR ja` (8). `hi` + `ja` are review-pending.
- **Daily puzzles:** deterministic from the date — every player gets the same puzzle on a given day.
- **Domain:** canonical everything points at `brainarena.fun`. `brainarena.games` is an unrelated third party.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3001
npm run build    # production build (also the main type/lint gate)
npm run lint
```
