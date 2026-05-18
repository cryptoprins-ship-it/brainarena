// Boggle's letter bag is Latin A-Z, so only locales whose alphabet maps
// onto that set get their own wordlist. HI/JA fall back to "en" for
// everything except the user-facing notice that Boggle isn't available
// in those scripts.
import type { Locale } from "@/lib/i18n";

export const BOGGLE_LATIN_LOCALES = ["en", "nl", "de", "fr", "es", "pt-BR"] as const;
export type BoggleLocale = (typeof BOGGLE_LATIN_LOCALES)[number];

export function isBoggleSupported(locale: Locale): locale is BoggleLocale {
  return (BOGGLE_LATIN_LOCALES as readonly string[]).includes(locale);
}

const cache = new Map<BoggleLocale, Set<string>>();
const inflight = new Map<BoggleLocale, Promise<Set<string>>>();

export function getCachedDictionary(locale: BoggleLocale): Set<string> | null {
  return cache.get(locale) ?? null;
}

// Lazy-load a locale's wordlist from /dict/<locale>.txt. The file is
// served gzipped by Next.js and the result Set is kept in module memory
// so subsequent visits during the same session are instant.
export function loadDictionary(locale: BoggleLocale): Promise<Set<string>> {
  const cached = cache.get(locale);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(locale);
  if (existing) return existing;

  const promise = fetch(`/dict/${locale}.txt`)
    .then((r) => {
      if (!r.ok) throw new Error(`dict load failed: ${r.status}`);
      return r.text();
    })
    .then((text) => {
      // One word per line, already lowercased + a-z only by build script.
      // Split on \r?\n so files committed with CRLF line endings on
      // Windows don't end up with trailing \r on every word — that
      // poisoned every `set.has(w)` lookup and silently rejected valid
      // dictionary words like "heet" / "hel".
      const set = new Set(
        text.split(/\r?\n/).filter((w) => w.length >= 3),
      );
      cache.set(locale, set);
      inflight.delete(locale);
      return set;
    })
    .catch((err) => {
      inflight.delete(locale);
      throw err;
    });

  inflight.set(locale, promise);
  return promise;
}
