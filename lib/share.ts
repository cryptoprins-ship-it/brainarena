"use client";

// Shared share layer for all games. One place owns: the "BrainArena
// {Game} … — brainarena.fun" text format, the Web Share API → clipboard
// → prompt fallback chain, and the daily puzzle number. Per-game result
// shapes genuinely differ (Wordle has an emoji grid, the logic puzzles
// have a time, Connections has a mistake count) so buildShareText keeps
// a per-game formatter behind a uniform shell.

import type { GameKey } from "@/lib/scores";

// Anchor for the "#N" daily counter — same epoch as the Wordle game
// number so every daily game counts from a consistent day 1.
const SHARE_EPOCH_DAY = Math.floor(Date.UTC(2024, 3, 1) / 86_400_000);

export function dayNumber(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000) - SHARE_EPOCH_DAY + 1;
}

const SHARE_BASE_URL = "https://brainarena.fun";

const GAME_NAMES: Record<GameKey, string> = {
  wordle: "Wordle",
  boggle: "Boggle",
  sudoku: "Sudoku",
  typing: "Typing",
  tiledrop: "TileDrop",
  colormatch: "Color Match",
  letterstack: "Letter Stack",
  vlakken: "Patches",
  verbind: "Connect",
  zonmaan: "Sun & Moon",
  kronen: "Crowns",
  minesweeper: "Minesweeper",
  connections: "Connections",
};

export function gameUrl(game: GameKey): string {
  return `${SHARE_BASE_URL}/${game}`;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type SharePayload = {
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
  rank?: number;
  // The locale the game was played in — shown for per-locale games
  // (Wordle, Boggle, Typing, Letter Stack) so a shared NL result is
  // distinguishable from an EN one.
  locale?: string;
};

function num(meta: Record<string, unknown> | undefined, key: string): number | undefined {
  const v = meta?.[key];
  return typeof v === "number" ? v : undefined;
}
function str(meta: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === "string" ? v : undefined;
}
function bool(meta: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const v = meta?.[key];
  return typeof v === "boolean" ? v : undefined;
}

// Wordle: NYT-style header + spoiler-free emoji grid. `meta.states` is
// the per-row tile-state grid ("correct" | "present" | anything else).
function wordleGrid(meta: Record<string, unknown> | undefined): string {
  const states = meta?.states;
  if (!Array.isArray(states)) return "";
  return states
    .map((row) =>
      Array.isArray(row)
        ? row
            .map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"))
            .join("")
        : "",
    )
    .filter(Boolean)
    .join("\n");
}

// Per-game first line. The shell appends the URL.
const FORMATTERS: Record<GameKey, (p: SharePayload) => string> = {
  wordle: (p) => {
    const won = bool(p.meta, "won");
    const guesses = num(p.meta, "guesses") ?? 0;
    const loc = p.locale ? ` ${p.locale.toUpperCase()}` : "";
    const head = `BrainArena Wordle #${dayNumber()}${loc} ${won ? guesses : "X"}/6`;
    const grid = wordleGrid(p.meta);
    return grid ? `${head}\n${grid}` : head;
  },
  boggle: (p) => {
    const loc = p.locale ? ` ${p.locale.toUpperCase()}` : "";
    // boggle passes `meta.found` as the count of words found.
    const words = num(p.meta, "found");
    const tail = words != null ? ` — ${p.score} pts, ${words} words` : ` — ${p.score} pts`;
    return `BrainArena Boggle${loc} #${dayNumber()}${tail}`;
  },
  sudoku: (p) => {
    const diff = str(p.meta, "difficulty");
    const q = diff ? ` (${diff})` : "";
    return `BrainArena Sudoku${q} #${dayNumber()} — ${formatTime(p.time ?? 0)}`;
  },
  typing: (p) => {
    const loc = p.locale ? ` ${p.locale.toUpperCase()}` : "";
    const acc = num(p.meta, "accuracy");
    const tail = acc != null ? ` — ${p.score} WPM, ${acc}% acc` : ` — ${p.score} WPM`;
    return `BrainArena Typing${loc} #${dayNumber()}${tail}`;
  },
  tiledrop: (p) => `BrainArena TileDrop #${dayNumber()} — ${p.score} pts`,
  colormatch: (p) => `BrainArena Color Match #${dayNumber()} — ${p.score} pts`,
  letterstack: (p) => {
    const loc = p.locale ? ` ${p.locale.toUpperCase()}` : "";
    return `BrainArena Letter Stack${loc} #${dayNumber()} — ${p.score} pts`;
  },
  vlakken: (p) => timePuzzle("Patches", p),
  verbind: (p) => timePuzzle("Connect", p),
  zonmaan: (p) => timePuzzle("Sun & Moon", p),
  kronen: (p) => timePuzzle("Crowns", p),
  minesweeper: (p) => {
    const diff = str(p.meta, "difficulty");
    const q = diff ? ` (${diff})` : "";
    const won = bool(p.meta, "won");
    if (won === false) return `BrainArena Minesweeper${q} #${dayNumber()} — 💥`;
    return `BrainArena Minesweeper${q} #${dayNumber()} — ${formatTime(p.time ?? 0)}`;
  },
  connections: (p) => {
    const won = bool(p.meta, "won");
    const mistakes = num(p.meta, "mistakes") ?? 0;
    if (won === false) return `BrainArena Connections #${dayNumber()} — out of guesses`;
    return `BrainArena Connections #${dayNumber()} — solved, ${mistakes} mistake${mistakes === 1 ? "" : "s"}`;
  },
};

function timePuzzle(name: string, p: SharePayload): string {
  const diff = str(p.meta, "difficulty");
  const q = diff ? ` (${diff})` : "";
  return `BrainArena ${name}${q} #${dayNumber()} — ${formatTime(p.time ?? 0)}`;
}

// Full shareable text: per-game body + the game URL on its own line.
// Spoiler-free by construction — no formatter emits the answer.
export function buildShareText(game: GameKey, payload: SharePayload): string {
  const body = FORMATTERS[game]?.(payload) ?? `BrainArena ${GAME_NAMES[game]}`;
  return `${body}\n${gameUrl(game)}`;
}

export type ShareOutcome = "shared" | "copied" | "prompted" | "dismissed" | "failed";

// Web Share API (native sheet on mobile) → clipboard → prompt. Returns
// which path resolved so the caller can show the right toast. An
// AbortError from a dismissed share sheet resolves as "dismissed" so the
// caller doesn't fall through to a misleading "Copied!".
export async function shareResult(game: GameKey, payload: SharePayload): Promise<ShareOutcome> {
  const text = buildShareText(game, payload);
  const url = gameUrl(game);
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (!nav) return "failed";

  const canNativeShare =
    !!nav.share &&
    (typeof nav.canShare !== "function" || nav.canShare({ text, url }));
  if (canNativeShare) {
    try {
      await nav.share({ text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
      // fall through to clipboard
    }
  }
  try {
    await nav.clipboard.writeText(text);
    return "copied";
  } catch {
    if (typeof window !== "undefined") {
      window.prompt("Copy your result:", text);
      return "prompted";
    }
    return "failed";
  }
}
