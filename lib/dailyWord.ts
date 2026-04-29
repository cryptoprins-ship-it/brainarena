import type { Locale } from "./i18n";
import { EN_WORDS } from "./words/en";
import { NL_WORDS } from "./words/nl";
import { DE_WORDS } from "./words/de";
import { FR_WORDS } from "./words/fr";
import { ES_WORDS } from "./words/es";

function clean(list: string[]): string[] {
  return list
    .map((w) => w.toLowerCase().trim())
    .filter((w) => [...w].length === 5);
}

const POOLS: Record<Locale, string[]> = {
  en: clean(EN_WORDS),
  nl: clean(NL_WORDS),
  de: clean(DE_WORDS),
  fr: clean(FR_WORDS),
  es: clean(ES_WORDS),
};

export function dayIndex(date: Date = new Date()): number {
  // UTC days since epoch — same value for everyone on the same calendar day in UTC.
  return Math.floor(date.getTime() / 86_400_000);
}

export function dailyWord(locale: Locale, date: Date = new Date()): string {
  const pool = POOLS[locale] ?? EN_WORDS;
  const idx = dayIndex(date) % pool.length;
  return pool[idx].toLowerCase();
}

export function randomWord(locale: Locale): string {
  const pool = POOLS[locale] ?? EN_WORDS;
  return pool[Math.floor(Math.random() * pool.length)].toLowerCase();
}

export function isInWordList(locale: Locale, word: string): boolean {
  const pool = POOLS[locale] ?? EN_WORDS;
  return pool.includes(word.toLowerCase());
}
