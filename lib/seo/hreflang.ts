import { SUPPORTED, type Locale } from "@/lib/locales";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

// English is served from the flat URL (no /en/ prefix) — that URL is the
// historical canonical and the one already in Google's index. Other
// locales live under /<locale>/.
const DEFAULT_LOCALE: Locale = "en";

// Routes that currently have per-locale variants under app/[locale]/.
// A path appears here only after its locale subtree exists; emitting
// hreflang for a non-existent URL would point Google at a 404 and the
// whole hreflang cluster gets dropped.
const LOCALIZED_PATHS: ReadonlySet<string> = new Set<string>([
  "/sudoku",
]);

function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  return pathname;
}

function urlFor(locale: Locale, pathname: string): string {
  if (locale === DEFAULT_LOCALE) return `${BASE}${pathname}`;
  return `${BASE}/${locale}${pathname}`;
}

/**
 * Build the `alternates.languages` object Next.js expects in `metadata`.
 *
 * Behaviour:
 *  - English (the canonical locale) always points at the flat URL.
 *  - Other locales only appear if the route is registered in
 *    `LOCALIZED_PATHS` — i.e. the /<locale>/<path> route actually exists.
 *  - `x-default` always points at the English URL (the version we show
 *    to browsers whose Accept-Language we don't support).
 *
 * Pass the un-prefixed pathname — e.g. `/sudoku`, not `/en/sudoku`.
 */
export function generateHreflangAlternates(
  pathname: string,
): Record<string, string> {
  const path = normalizePath(pathname);
  const flat = `${BASE}${path}`;

  const alts: Record<string, string> = {
    [DEFAULT_LOCALE]: flat,
    "x-default": flat,
  };

  if (LOCALIZED_PATHS.has(path)) {
    for (const loc of SUPPORTED) {
      if (loc === DEFAULT_LOCALE) continue;
      alts[loc] = urlFor(loc, path);
    }
  }

  return alts;
}

/**
 * Canonical URL for a given page + locale. Each locale variant
 * self-canonicalizes — the Dutch page is its own canonical, not the
 * English one. Pointing all variants at the English canonical would
 * cancel out the hreflang signal.
 */
export function canonicalUrlFor(
  pathname: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return urlFor(locale, normalizePath(pathname));
}

export { LOCALIZED_PATHS, DEFAULT_LOCALE };
