"use client";

export type GameKey =
  | "wordle"
  | "boggle"
  | "sudoku"
  | "typing"
  | "tiledrop"
  | "wordbuild"
  | "colormatch"
  | "letterstack"
  | "vlakken"
  | "verbind"
  | "zonmaan"
  | "kronen";

const NAME_KEY = "brainarena-player-name";
const STREAK_KEY = (g: GameKey) => `brainarena-streak-${g}`;
const LAST_PLAY_KEY = (g: GameKey) => `brainarena-last-${g}`;
const COUNT_KEY = "brainarena-player-count";
const COUNT_DAY_KEY = "brainarena-player-count-day";

export function getName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}
export function setName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name.slice(0, 24));
}

export function getStreak(g: GameKey): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STREAK_KEY(g)) ?? "0") || 0;
}
export function bumpStreak(g: GameKey): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(LAST_PLAY_KEY(g));
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
  localStorage.setItem(STREAK_KEY(g), String(next));
  localStorage.setItem(LAST_PLAY_KEY(g), today);
  return next;
}
export function breakStreak(g: GameKey) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY(g), "0");
  localStorage.setItem(LAST_PLAY_KEY(g), new Date().toISOString().slice(0, 10));
}

export function livePlayerCount(): number {
  if (typeof window === "undefined") return 14_293;
  const today = new Date().toISOString().slice(0, 10);
  const day = localStorage.getItem(COUNT_DAY_KEY);
  let count = Number(localStorage.getItem(COUNT_KEY) ?? "");
  if (day !== today || !count) {
    // Seed a new realistic-looking baseline each day; deterministic per day.
    const seed = Number(today.replace(/-/g, "")) % 7919;
    count = 14_000 + (seed % 2500) + Math.floor(Math.random() * 80);
    localStorage.setItem(COUNT_DAY_KEY, today);
  } else {
    count += Math.floor(Math.random() * 4) + 1;
  }
  localStorage.setItem(COUNT_KEY, String(count));
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

export async function submitScore(body: SubmitBody): Promise<{ rank: number } | null> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
