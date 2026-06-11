# Deployment

## Hosting

`brainarena.fun` runs on **two hosts**, both auto-deployed from `main`:

- **Vercel** — test / preview environment (serverless; `envoy` edge). Used for previewing changes and as the Upstash-on-Vercel target the Redis backend comment refers to.
- **Hostinger** — production live host (server header `hcdn`). Auto-deploys via the GitHub webhook configured in hPanel — no manual deploy step.

Keep both green: a change that builds on Vercel can still trip the Hostinger
build (note the Node-version drift below).

> `brainarena.games` is a **separate, unrelated** site (different owner,
> served from a different stack). It is not part of this project.

## CI — `.github/workflows/ci.yml`

Runs on push + PR to `main`. Node **24**. Concurrency-guarded
(`ci-${{ github.ref }}`, cancel-in-progress).

Steps:
1. `npm ci`
2. `npx tsc --noEmit` — typecheck
3. `npm run lint` — ESLint
4. `npm run test:puzzles` — puzzle smoke tests (`scripts/test-vlakken.mjs`, `scripts/test-daily-puzzles.mjs`)
5. `npm run build` — production build (`NEXT_TELEMETRY_DISABLED=1`)

**Brand policy:** red CI on `main` → stop shipping features until green. A PR
with red CI is not merged without an explicit override + reason.

## Deploy workflow — `.github/workflows/deploy.yml`

"Deploy to Hostinger": on push to `main`, checks out, sets up Node 20,
`npm ci`, `npm run build`. The actual publish is Hostinger's webhook auto-deploy.

> Note: CI uses Node 24, the deploy workflow uses Node 20. Keep an eye on this
> drift if a build ever passes CI but fails deploy.

## Environment

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — enable the Redis leaderboard + rate limiter. Absent → leaderboard falls back to local JSON (dev only; do not rely on fs writes in prod). The Upstash instance is **shared** with Renisual and the rate-limiter; keys are namespaced `…:brainarena:…`.
- `NEXT_TELEMETRY_DISABLED=1` in CI build.
- No AI/API keys needed to build.

## Security headers (`next.config.ts`)

A strict CSP + security headers are applied to all routes:
- `script-src` allows AdSense (`googlesyndication`, `doubleclick`, `googletagmanager`) and Plausible; `'unsafe-inline'`/`'unsafe-eval'` retained for Next's inline runtime + AdSense.
- HSTS preload, `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (camera/mic/geo off, `interest-cohort=()`).
- `productionBrowserSourceMaps: false` — no source maps in prod (don't leak server paths).
- **If you add a third-party origin (Gemini/Anthropic/Supabase/analytics), extend `connect-src`/`script-src` here — not in component-level `<Script>` overrides.**
