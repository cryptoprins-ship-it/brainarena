# app — App Router (routing, rendering, SEO metadata, API)

## Purpose

Next.js App Router surface. Maps URLs to pages, owns per-route SEO metadata
and JSON-LD, and hosts the leaderboard HTTP API under `app/api/`. Page
components are thin: game logic lives in `lib/`, shared UI in `components/`.

## Ownership

- Routing structure and the `[locale]` segment (8 locales) — see parent root AGENTS.md for the locale list.
- Two route shapes coexist:
  - `app/[locale]/<game>/` — localized routes (canonical going forward).
  - `app/<game>/` — legacy non-prefixed routes (default `en`). Keep both in sync until the legacy set is retired.
- `layout.tsx` per route owns `generateMetadata` (title, description, canonical, hreflang, OpenGraph). `page.tsx` owns rendering.
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` — generated SEO assets. Edits here change what Google sees.
- `app/api/leaderboard/` — `route.ts` (read/submit), `champion/`, `rename/`. Server-only; uses `lib/leaderboard/` + `lib/ratelimit.ts` + `lib/verifyOrigin.ts`.

## Local Contracts

- Every new game needs BOTH a `[locale]/<game>/` and (if following the current pattern) a legacy `<game>/` route, each with `layout.tsx` (metadata) + `page.tsx`.
- New routes MUST be added to `app/sitemap.ts` with hreflang alternates, or they will not be indexed.
- Canonical URLs point at `https://brainarena.fun`. Do not introduce links or canonicals to any other domain.
- API routes validate input with `zod` and enforce origin + rate limits before touching Redis. Never bypass `verifyOrigin` / `ratelimit` on write endpoints.

## Work Guidance

- Page metadata: use the helpers in `lib/seo/` and `lib/seoMeta.ts` rather than hand-writing tags, so hreflang stays consistent.
- Keep server/client boundaries clean: `lib/i18n.ts` is `"use client"`; import static locale data from `lib/locales.ts` in server components.

## Verification

- `npm run build` (catches metadata/type errors and route collisions) and `npm run lint`.

## Child DOX Index

- None. `app/api/` is owned by this doc; if it grows its own durable rules, split out `app/api/AGENTS.md`.
