// Daily attempt counter.
//
// To keep the leaderboard honest without killing engagement, each daily-
// seeded game allows up to `MAX_LEADERBOARD_ATTEMPTS` submissions per
// player per day. The player can keep replaying after that — they just
// stop counting for the public ranking. Without this cap, a player who
// already knows the answer could grind submission after submission to
// shave off seconds and game the top-10.
//
// Storage shape: `brainarena-attempts-${game}-${dayIdx}[-${variant}]`
// Variant is optional, used for games with per-difficulty daily puzzles.

import { useCallback, useEffect, useState } from "react";

export const MAX_LEADERBOARD_ATTEMPTS = 3;

function attemptsKey(game: string, dayIdx: number, variant?: string): string {
  return `brainarena-attempts-${game}-${dayIdx}${variant ? `-${variant}` : ""}`;
}

export function getAttemptCount(
  game: string,
  dayIdx: number,
  variant?: string
): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(attemptsKey(game, dayIdx, variant));
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// Increments the counter and returns the new total. Call this on every
// completed attempt regardless of whether it qualifies for leaderboard.
export function recordAttempt(
  game: string,
  dayIdx: number,
  variant?: string
): number {
  if (typeof window === "undefined") return 0;
  const next = getAttemptCount(game, dayIdx, variant) + 1;
  try {
    localStorage.setItem(attemptsKey(game, dayIdx, variant), String(next));
  } catch {
    // Quota / private mode — let the play go on; cap will just be unenforced.
  }
  return next;
}

// True if an attempt that's about to start would still qualify for the
// leaderboard. Use BEFORE recording the attempt so the boundary case
// (3rd play) still counts.
export function canSubmitLeaderboard(
  game: string,
  dayIdx: number,
  variant?: string
): boolean {
  return getAttemptCount(game, dayIdx, variant) < MAX_LEADERBOARD_ATTEMPTS;
}

// React hook. Tracks the attempt counter reactively and exposes a record()
// that returns whether THIS attempt should be submitted.
export function useDailyAttempts(
  game: string,
  dayIdx: number,
  variant?: string
): {
  attempts: number;
  remaining: number;
  canSubmit: boolean;
  // Record this attempt and tell the caller whether it should still
  // submit to the leaderboard. Returns the new total.
  record: () => { count: number; shouldSubmit: boolean };
} {
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setAttempts(getAttemptCount(game, dayIdx, variant));
  }, [game, dayIdx, variant]);

  const record = useCallback(() => {
    const before = getAttemptCount(game, dayIdx, variant);
    const shouldSubmit = before < MAX_LEADERBOARD_ATTEMPTS;
    const count = recordAttempt(game, dayIdx, variant);
    setAttempts(count);
    return { count, shouldSubmit };
  }, [game, dayIdx, variant]);

  return {
    attempts,
    remaining: Math.max(0, MAX_LEADERBOARD_ATTEMPTS - attempts),
    canSubmit: attempts < MAX_LEADERBOARD_ATTEMPTS,
    record,
  };
}
