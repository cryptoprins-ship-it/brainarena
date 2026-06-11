# data — Static game data

## Purpose

Static, code-free game data. Per-locale Wordle word lists and per-locale slur
filters consumed by the leaderboard name validator.

## Ownership

- `data/wordlists/<locale>/` (`en de es fr nl pt-BR`): `guesses.json` (accepted guesses), `solutions.json` (daily answers), `stats.json` (metadata).
- `data/wordlists/slur-filter-<locale>.json` — blocklists used by `lib/leaderboard/validate.ts` to reject offensive leaderboard names.

## Local Contracts

- `solutions.json` order is **significant**: daily answers are selected deterministically by date index. Re-ordering or removing entries shifts every future (and historical-by-date) puzzle. Append; do not reorder.
- Words must match the game's length/charset rules for that locale.
- Slur filters are a safety control. Only widen them; do not remove entries without a reason, and keep them in sync across locales.
- Files are large data blobs — keep them valid JSON, UTF-8, no trailing commas.

## Work Guidance

- Adding a locale's word list: provide all three files (`guesses`, `solutions`, `stats`) plus a `slur-filter-<locale>.json`, then confirm the locale is in `lib/locales.ts`.

## Verification

- JSON validity (`npm run build` will surface import errors). Spot-check that a known date still yields its expected solution after any edit.

## Child DOX Index

- None.
