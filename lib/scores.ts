"use client";

import { safeGetItem, safeSetItem } from "./safeStorage";

export type GameKey =
  | "wordle"
  | "boggle"
  | "sudoku"
  | "typing"
  | "tiledrop"
  | "colormatch"
  | "letterstack"
  | "vlakken"
  | "verbind"
  | "zonmaan"
  | "kronen"
  | "minesweeper"
  | "connections";

const NAME_KEY = "brainarena-player-name";
const STREAK_KEY = (g: GameKey) => `brainarena-streak-${g}`;
const LAST_PLAY_KEY = (g: GameKey) => `brainarena-last-${g}`;
const COUNT_KEY = "brainarena-player-count";
const COUNT_DAY_KEY = "brainarena-player-count-day";

// All storage access goes through safeGetItem/safeSetItem — a bare
// localStorage call inside the name-submit / win-handler path can throw
// (Brave's Shields, Safari private mode, Chrome quota exceeded), and a
// throw inside the synchronous CustomEvent listener that runs when
// NameGate dispatches "brainarena:name-submitted" prevents NameGate's
// own setOpen(false) from running — the modal stays up and the screen
// looks frozen. Same root cause as the best-time fix in lib/safeStorage.
export function getName(): string {
  return safeGetItem(NAME_KEY) ?? "";
}
export function setName(name: string) {
  safeSetItem(NAME_KEY, name.slice(0, 24));
}

export function getStreak(g: GameKey): number {
  return Number(safeGetItem(STREAK_KEY(g)) ?? "0") || 0;
}
export function bumpStreak(g: GameKey): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().slice(0, 10);
  const last = safeGetItem(LAST_PLAY_KEY(g));
  const cur = getStreak(g);
  let next: number;
  if (last === today) {
    next = cur;
  } else if (last) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    next = last === yesterday ? cur + 1 : 1;
  } else {
    next = 1;
  }
  safeSetItem(STREAK_KEY(g), String(next));
  safeSetItem(LAST_PLAY_KEY(g), today);
  return next;
}
export function breakStreak(g: GameKey) {
  safeSetItem(STREAK_KEY(g), "0");
  safeSetItem(LAST_PLAY_KEY(g), new Date().toISOString().slice(0, 10));
}

export function livePlayerCount(): number {
  if (typeof window === "undefined") return 14_293;
  const today = new Date().toISOString().slice(0, 10);
  const day = safeGetItem(COUNT_DAY_KEY);
  let count = Number(safeGetItem(COUNT_KEY) ?? "");
  if (day !== today || !count) {
    // Seed a new realistic-looking baseline each day; deterministic per day.
    const seed = Number(today.replace(/-/g, "")) % 7919;
    count = 14_000 + (seed % 2500) + Math.floor(Math.random() * 80);
    safeSetItem(COUNT_DAY_KEY, today);
  } else {
    count += Math.floor(Math.random() * 4) + 1;
  }
  safeSetItem(COUNT_KEY, String(count));
  return count;
}

export type SubmitBody = {
  game: GameKey;
  name: string;
  score: number;
  time?: number;
  language?: string;
  country?: string;
  meta?: Record<string, unknown>;
};

// Prompts the player for a name via the global NameGate modal if none is
// stored yet. Resolves with the chosen (and now-persisted) name.  De-dupes
// concurrent calls so two simultaneous game-end submits share one prompt.
let pendingNamePrompt: Promise<string> | null = null;

export function ensurePlayerName(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("");
  const existing = getName().trim();
  if (existing && existing !== "Anonymous") return Promise.resolve(existing);
  if (pendingNamePrompt) return pendingNamePrompt;
  pendingNamePrompt = new Promise<string>((resolve) => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const name = (ce.detail ?? "").toString().trim().slice(0, 24);
      window.removeEventListener("brainarena:name-submitted", handler);
      pendingNamePrompt = null;
      // Resolve before persisting — if a future code change makes
      // setName throw again, the awaited submitScore still continues
      // and the UI doesn't hang on a never-resolved promise.
      resolve(name);
      if (name) setName(name);
    };
    window.addEventListener("brainarena:name-submitted", handler);
    window.dispatchEvent(new CustomEvent("brainarena:request-name"));
  });
  return pendingNamePrompt;
}

// Locale → home country fallback for `detectCountry`. Mirrors the
// supported i18n locales — anything outside this map (or `en`, which
// covers too many countries to pick a default for) returns undefined
// and renders as the 🌍 globe in the leaderboard.
const LOCALE_HOME_COUNTRY: Record<string, string> = {
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  "pt-BR": "BR",
  ja: "JP",
  hi: "IN",
};

function detectCountry(locale?: string): string | undefined {
  // Priority order matters: a Dutch player browsing on a system that
  // also lists "en-GB" as a secondary preference must not be flagged GB.
  //   1. Primary navigator.language with explicit region (nl-NL → NL).
  //   2. App locale's home country (locale=nl → NL) — trusts the user's
  //      explicit site-language choice over lower-preference OS tags.
  //   3. Remaining navigator.languages tags with an explicit region,
  //      so an English-locale visitor whose system reports en-CA still
  //      gets CA instead of the 🌍 fallback.
  const regionRegex = /^[A-Za-z]{2,3}-([A-Za-z]{2})(?:-|$)/;
  if (typeof navigator !== "undefined" && navigator.language) {
    const m = regionRegex.exec(navigator.language);
    if (m) return m[1].toUpperCase();
  }
  if (locale && LOCALE_HOME_COUNTRY[locale]) return LOCALE_HOME_COUNTRY[locale];
  if (typeof navigator !== "undefined" && Array.isArray(navigator.languages)) {
    for (const tag of navigator.languages) {
      const m = regionRegex.exec(tag);
      if (m) return m[1].toUpperCase();
    }
  }
  return undefined;
}

export async function submitScore(body: SubmitBody): Promise<{ rank: number } | null> {
  // Gate on having a real player name. If the call site passed an empty
  // string or the legacy "Anonymous" placeholder, prompt the player via
  // the NameGate modal before posting — otherwise every score lands as
  // "Anonymous" and the leaderboard becomes meaningless.
  let finalBody = body;
  const incoming = (body.name ?? "").trim();
  if (!incoming || incoming === "Anonymous") {
    const name = await ensurePlayerName();
    if (!name) return null; // player dismissed the prompt — skip submission
    finalBody = { ...body, name };
  }
  // Derive a country code if the call site didn't supply one — without
  // it every leaderboard row shows the 🌍 fallback instead of the
  // player's flag. Browser-reported locale wins (e.g. nl-NL → NL), and
  // we fall back to the app locale's home country so a player whose
  // browser only sends "nl" without a region still gets a flag.
  if (!finalBody.country) {
    const country = detectCountry(finalBody.language);
    if (country) finalBody = { ...finalBody, country };
  }
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalBody),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
