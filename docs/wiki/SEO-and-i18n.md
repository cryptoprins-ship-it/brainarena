# SEO & i18n

## Locales

Source of truth: `lib/locales.ts`.

| Code | Language | Status |
|------|----------|--------|
| `en` | English | live (x-default) |
| `nl` | Nederlands | live |
| `de` | Deutsch | live |
| `fr` | Français | live |
| `es` | Español | live |
| `pt-BR` | Português (BR) | live |
| `hi` | हिन्दी | **review-pending** |
| `ja` | 日本語 | **review-pending** |

`REVIEW_PENDING` (`hi`, `ja`) are selectable in dev/preview; in production the
`LanguageSwitcher` badges and (configurably) blocks them until a native review
signs off.

Static locale data is in `lib/locales.ts` (server-safe). The `useLocale` hook
and runtime locale live in `lib/i18n.ts` (`"use client"`). Server components
import from `lib/locales.ts`.

## Routing & canonical

- Localized: `/<locale>/<game>` (`app/[locale]/...`) — canonical going forward.
- Legacy: `/<game>` (`app/...`) — default `en`, kept in sync during migration.
- **Canonical + OpenGraph URLs point at `https://brainarena.fun`.** Never emit canonicals/links to another domain. (`brainarena.games` is an unrelated third party — do not reference it.)

## Metadata pipeline

- Per-route `layout.tsx` runs `generateMetadata`.
- Helpers: `lib/seo/hreflang.ts`, `lib/seo/localeMetadata.ts`, `lib/seoMeta.ts` — use these so hreflang/canonical/OG stay consistent. Don't hand-write tags.
- Structured data: `components/JsonLd.tsx`, `components/GameJsonLd.tsx` (schema.org). Keep output valid.
- `app/sitemap.ts` — generates `sitemap.xml` with per-URL hreflang alternates for all live locales. `app/robots.ts` → `robots.txt` (`Allow: /`, `Disallow: /api/`). `app/opengraph-image.tsx` → social card.

## Indexation playbook

The site is technically indexable (robots allow, self-canonical, valid
sitemap, no `noindex`). If pages aren't appearing in Google:

1. **Google Search Console** — verify the `brainarena.fun` property (DNS or HTML tag) and confirm ownership.
2. **Submit the sitemap** (`https://brainarena.fun/sitemap.xml`) in GSC.
3. **URL Inspection** on the homepage → *Request indexing*. Check the status:
   - *Discovered – currently not indexed* / *Crawled – not indexed* → usually low authority / no inbound links. Build backlinks; be patient.
   - *Excluded by canonical* → confirm the canonical resolves to a 200 on `brainarena.fun`.
4. **Backlinks** — a brand-new domain with no inbound links gets crawled late. Seed a few real links (socials, relevant directories).
5. Re-check `site:brainarena.fun` after Google recrawls.

There is a `GSC_SUBMIT_URLS.md` at the repo root with the URL list to submit.

## Adding a locale

1. Add the code to `Locale` / `SUPPORTED` / `LABEL` / `FLAG` in `lib/locales.ts` (and `REVIEW_PENDING` until reviewed).
2. Provide translations in `lib/i18n.ts`.
3. Add word lists + slur filter under `data/wordlists/<locale>/` if Wordle-eligible.
4. Confirm `app/sitemap.ts` emits hreflang alternates for it.
5. `npm run build`.
