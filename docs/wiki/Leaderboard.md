# Leaderboard

A global, cross-player leaderboard per game. Backed by Upstash Redis in
production with a local-JSON fallback for dev/tests.

## API — `app/api/leaderboard/`

`route.ts` exposes the board (Node runtime, `force-dynamic`):

- **GET** `?game=<game>&period=<today|month|alltime|...>`
  - `verifyOrigin` → reject foreign origins.
  - `apiLimit` rate limit (keyed by client IP).
  - Reads scores, filters by period, sorts via `sortFor(game)`.
  - `period=month` collapses to **best-per-player** (`bestPerPlayer`) so one player can't flood the prize board; other periods stay raw.
  - Returns top **50**.
- **POST** (submit a score)
  - `verifyOrigin` → `scoreLimit` rate limit.
  - Parse body, validate with a **zod** schema (`game` enum, `name` ≤24 chars, `score` 0–10M, optional `time`/`language`/`country`/`meta`).
  - `validateScore` (`lib/leaderboard/validate.ts`) proves the score is *plausible* and, where the score is a known function of verifiable evidence, **recomputes it server-side**. The persisted score/time are the verdict's, never the client's originals.
  - Rejected → `422 {error:"rejected", reason}` (logged via `pino`).
  - Accepted → append, sort, trim to `MAX_ENTRIES` (1000), persist, return `{ok:true, rank}` where `rank` is the player's position among **today's** entries.

`champion/route.ts` and `rename/route.ts` cover the headline champion and
name changes.

## Storage — `lib/leaderboard/store.ts`

Two backends, one API (`readScores` / `writeScores`):

- **Upstash Redis** (prod/preview) — auto-selected when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set. Key: `leaderboard:brainarena:scores:<game>`. The `:brainarena:` segment namespaces a **shared** Upstash instance (Renisual + the rate-limiter use the same instance).
- **Local JSON** (`public/scores/<game>.json`) — used when no Upstash env vars are present.

> History: the original fs-only backend silently failed on Vercel — its
> serverless filesystem is read-only outside `/tmp`, so every write returned
> EROFS and **no scores ever persisted in production**. The Redis backend
> fixed this. Don't reintroduce an fs write path for prod.

Writes are SET-overwrite of the whole list (last-write-wins). Fine at
one-POST-per-game-finish traffic; revisit with a sorted-set if contention
ever appears.

## Trust boundary

`lib/leaderboard/validate.ts` is where untrusted input becomes trusted data.
Zod proves *well-formed*; `validateScore` proves *plausible* + recomputes.
Names are filtered against `data/wordlists/slur-filter-<locale>.json`. **Never
write unvalidated input to Redis. Never persist the client's raw score when a
server recomputation exists.**

## Rendering

`components/ScoreEndLeaderboard`, `TimeEndLeaderboard`, `WordleEndLeaderboard`
render standings; `standings.ts` (`sortFor`, `withinPeriod`, `bestPerPlayer`,
`GAMES`, `isGame`) is isomorphic and safe to import client-side — unlike
`store.ts`, which is server-only.
