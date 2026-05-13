"use client";

// Lazy loader for the per-locale GUESSES set used to validate Wordle
// input. Guesses lists are big (~50–100 kB JSON each) and only the
// active locale is ever needed, so we dynamic-import per locale and let
// Next.js code-split them out of the initial bundle.
//
// hi/ja share the en list (they have no Latin-script wordlist of their
// own — same fallback as lib/dailyWord.ts).

import type { Locale } from "@/lib/i18n";

const cache = new Map<Locale, Set<string>>();
const inflight = new Map<Locale, Promise<Set<string>>>();

function importFor(locale: Locale): Promise<{ default: string[] }> {
  switch (locale) {
    case "en":
    case "hi":
    case "ja":
      return import("@/data/wordlists/en/guesses.json");
    case "nl":
      return import("@/data/wordlists/nl/guesses.json");
    case "de":
      return import("@/data/wordlists/de/guesses.json");
    case "fr":
      return import("@/data/wordlists/fr/guesses.json");
    case "es":
      return import("@/data/wordlists/es/guesses.json");
    case "pt-BR":
      return import("@/data/wordlists/pt-BR/guesses.json");
  }
}

export function getCachedGuesses(locale: Locale): Set<string> | null {
  return cache.get(locale) ?? null;
}

export function loadGuesses(locale: Locale): Promise<Set<string>> {
  const cached = cache.get(locale);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(locale);
  if (existing) return existing;
  const promise = importFor(locale)
    .then((mod) => {
      const set = new Set(mod.default);
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
