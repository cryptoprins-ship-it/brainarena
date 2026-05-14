"use client";

// Daily board + per-locale stats persistence for Wordle. Lives next to the
// other per-game helpers in lib/games/. Browser-only — every export is a
// no-op under SSR.

// Anchor for the NYT-style "Wordle #N" share number. 2024-04-01 (UTC) maps
// to game #1; anything earlier would publish negative numbers in the share
// string, anything later would silently skip game numbers, so this is fixed.
export const WORDLE_EPOCH_DAY = Math.floor(Date.UTC(2024, 3, 1) / 86_400_000);

export function gameNumber(dayIdx: number): number {
  return dayIdx - WORDLE_EPOCH_DAY + 1;
}

// --- Daily board -----------------------------------------------------------

export type BoardState = {
  guesses: string[];
  done: "win" | "lose" | null;
  target: string;
  elapsed: number;
};

const boardKey = (dayIdx: number, locale: string) =>
  `brainarena-wordle-board-${dayIdx}-${locale}`;

export function loadBoard(dayIdx: number, locale: string): BoardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(boardKey(dayIdx, locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoardState>;
    if (
      !Array.isArray(parsed.guesses) ||
      typeof parsed.target !== "string" ||
      typeof parsed.elapsed !== "number"
    ) return null;
    return {
      guesses: parsed.guesses.filter((g): g is string => typeof g === "string"),
      done: parsed.done === "win" || parsed.done === "lose" ? parsed.done : null,
      target: parsed.target,
      elapsed: parsed.elapsed,
    };
  } catch {
    return null;
  }
}

export function saveBoard(
  dayIdx: number,
  locale: string,
  state: BoardState,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(boardKey(dayIdx, locale), JSON.stringify(state));
  } catch {
    // Quota / private mode — persistence is best-effort.
  }
}

// --- Stats -----------------------------------------------------------------

export type Stats = {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  // Index 0 = solved in 1 guess, index 5 = solved in 6 guesses.
  distribution: number[];
  // Last daily that produced a WIN — used to detect streak gaps.
  lastWinDayIdx: number;
};

const statsKey = (locale: string) => `brainarena-wordle-stats-${locale}`;
const completedKey = (locale: string, dayIdx: number) =>
  `brainarena-wordle-completed-${locale}-${dayIdx}`;

function emptyStats(): Stats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastWinDayIdx: -1,
  };
}

export function loadStats(locale: string): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(statsKey(locale));
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    const dist = Array.isArray(parsed.distribution) && parsed.distribution.length === 6
      ? parsed.distribution.map((n) => (typeof n === "number" && n >= 0 ? n : 0))
      : [0, 0, 0, 0, 0, 0];
    return {
      played: typeof parsed.played === "number" ? parsed.played : 0,
      won: typeof parsed.won === "number" ? parsed.won : 0,
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      maxStreak: typeof parsed.maxStreak === "number" ? parsed.maxStreak : 0,
      distribution: dist,
      lastWinDayIdx: typeof parsed.lastWinDayIdx === "number" ? parsed.lastWinDayIdx : -1,
    };
  } catch {
    return emptyStats();
  }
}

// Idempotent per (locale, dayIdx): calling twice for the same daily only
// counts the first time. Returns the post-update stats.
export function recordResult(args: {
  locale: string;
  dayIdx: number;
  won: boolean;
  guessCount: number;
}): Stats {
  const { locale, dayIdx, won, guessCount } = args;
  if (typeof window === "undefined") return loadStats(locale);
  if (localStorage.getItem(completedKey(locale, dayIdx)) === "1") {
    return loadStats(locale);
  }
  const cur = loadStats(locale);
  const distribution = [...cur.distribution];
  if (won && guessCount >= 1 && guessCount <= 6) distribution[guessCount - 1]++;
  const nextStreak = won
    ? (cur.lastWinDayIdx === dayIdx - 1 ? cur.currentStreak + 1 : 1)
    : 0;
  const next: Stats = {
    played: cur.played + 1,
    won: cur.won + (won ? 1 : 0),
    currentStreak: nextStreak,
    maxStreak: Math.max(cur.maxStreak, nextStreak),
    distribution,
    lastWinDayIdx: won ? dayIdx : cur.lastWinDayIdx,
  };
  try {
    localStorage.setItem(statsKey(locale), JSON.stringify(next));
    localStorage.setItem(completedKey(locale, dayIdx), "1");
  } catch {
    // Private mode: stats won't persist, but the play still resolves.
  }
  return next;
}

// --- Countdown -------------------------------------------------------------

export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(0, next - now.getTime());
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
