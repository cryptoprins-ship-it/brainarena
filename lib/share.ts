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
// Spoiler-free by construction — no formatter emits the answer. Used by
// the native share sheet and clipboard copy.
export function buildShareText(game: GameKey, payload: SharePayload): string {
  return `${shareBody(game, payload)}\n${gameUrl(game)}`;
}

function shareBody(game: GameKey, payload: SharePayload): string {
  return FORMATTERS[game]?.(payload) ?? `BrainArena ${GAME_NAMES[game]}`;
}

// Text + URL as separate fields — platform share-intent URLs take them
// in distinct query params.
export type ShareParts = { text: string; url: string };
export function buildShareParts(game: GameKey, payload: SharePayload): ShareParts {
  return { text: shareBody(game, payload), url: gameUrl(game) };
}

// Explicit per-platform share links. The native share sheet (mobile,
// some desktop) already lists every app the user has installed — this
// is the fallback set for everywhere it isn't available, so "share" is
// never reduced to clipboard-only. All are public web intent endpoints,
// opened in a new tab; nothing here needs an SDK or app key.
export type ShareTarget = { id: string; label: string; href: (parts: ShareParts) => string };

export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "x",
    label: "X",
    href: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: ({ text, url }) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    href: ({ text, url }) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "reddit",
    label: "Reddit",
    href: ({ text, url }) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    label: "Email",
    href: ({ text, url }) =>
      `mailto:?subject=${encodeURIComponent("BrainArena")}&body=${encodeURIComponent(`${text}\n${url}`)}`,
  },
];

// Whether the browser exposes the native share sheet. When true, the
// sheet itself lists every app the user actually has installed — that's
// the real "share to whatever's present".
export function hasNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export type NativeShareOutcome = "shared" | "dismissed" | "unavailable" | "failed";

// Invoke the OS share sheet. "dismissed" if the user cancels (so the
// caller doesn't fall through to a misleading "copied" toast),
// "unavailable" if there's no Web Share API, "failed" on anything else.
export async function nativeShare(
  game: GameKey,
  payload: SharePayload,
): Promise<NativeShareOutcome> {
  if (!hasNativeShare()) return "unavailable";
  const text = buildShareText(game, payload);
  const url = gameUrl(game);
  try {
    await navigator.share({ text, url });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
    return "failed";
  }
}

export type CopyOutcome = "copied" | "prompted" | "failed";

// Clipboard copy, with a prompt() last resort for browsers that block
// clipboard access. Kept as one option in the share menu — not the
// whole share story.
export async function copyShareText(
  game: GameKey,
  payload: SharePayload,
): Promise<CopyOutcome> {
  const text = buildShareText(game, payload);
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    if (typeof window !== "undefined") {
      window.prompt("Copy your result:", text);
      return "prompted";
    }
    return "failed";
  }
}
