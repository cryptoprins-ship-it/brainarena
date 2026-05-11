"use client";

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
      if (name) setName(name);
      resolve(name);
    };
    window.addEventListener("brainarena:name-submitted", handler);
    window.dispatchEvent(new CustomEvent("brainarena:request-name"));
  });
  return pendingNamePrompt;
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
