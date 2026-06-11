# components — Shared UI

## Purpose

Reusable presentational React components shared across routes: navigation,
cookie/consent, language switching, leaderboards, share, achievement toasts,
JSON-LD injectors, error recovery.

## Ownership

- Cross-cutting UI only. No game rules, no scoring math, no data fetching logic beyond what a widget needs to render.
- Notable components:
  - `NavBar`, `FooterNav`, `LanguageSwitcher`, `Flag` — chrome + locale UX.
  - `CookieBanner`, `CookieSettingsLink` — consent (referenced by privacy flow).
  - `*Leaderboard.tsx` (`Score`, `Time`, `Wordle`), `ScoreEndLeaderboard` — render standings from `lib/leaderboard/` data.
  - `ShareButton`, `EndScreenAddon`, `NextPuzzleCountdown`, `StreakBanner`, `AchievementToast` — end-of-game UX.
  - `JsonLd`, `GameJsonLd` — structured data for SEO; keep schema.org output valid.
  - `ChunkErrorRecovery` — pairs with `public/css-recovery.js` for stale-bundle recovery.

## Local Contracts

- Components are locale-aware: pull copy through `lib/i18n.ts`, never hardcode user-facing English.
- Client components must declare `"use client"`. Keep them free of server-only imports.
- `JsonLd` / `GameJsonLd` output must stay valid schema.org — broken structured data hurts SEO.

## Work Guidance

- Prefer inline SVG flags (`Flag.tsx`) over emoji (Windows renders regional-indicator emoji as letters).
- New shared widget → add here; route-specific one-off → keep it in the route.

## Verification

- `npm run build` + `npm run lint`. Validate JSON-LD changes against schema.org / Google Rich Results.

## Child DOX Index

- None.
