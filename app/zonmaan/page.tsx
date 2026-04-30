"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import { generateZonMaan, edgeKey, type ZonMaanPuzzle } from "@/lib/games/zonmaan";
import { dayIndex } from "@/lib/games/kronen";

type Difficulty = "easy" | "medium" | "hard";
type CellState = -1 | 0 | 1; // -1 empty, 0 moon, 1 sun

// Standard Tango/Sun-and-Moon is always a 6×6 (36-cell) board; difficulty
// varies clue density, not grid size.
const SIZE_FOR: Record<Difficulty, number> = { easy: 6, medium: 6, hard: 6 };
const CLUE_RATIO_FOR: Record<Difficulty, number> = { easy: 0.45, medium: 0.30, hard: 0.18 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 4 };
const BEST_KEY = (d: Difficulty) => `brainarena-zonmaan-best-${d}`;

type Move = { idx: number; prev: CellState; next: CellState };

// Cycle empty → sun → moon → empty so a single tap stream covers all
// three states.
function nextState(s: CellState): CellState {
  if (s === -1) return 1;
  if (s === 1) return 0;
  return -1;
}

export default function ZonMaanPage() {
  const { t, locale } = useLocale();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [puzzle, setPuzzle] = useState<ZonMaanPuzzle | null>(null);
  const [cells, setCells] = useState<CellState[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS_FOR.easy);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null);

  // dayIndex × prime + difficulty offset + nonce gives a stable daily seed
  // per difficulty plus a fresh stream when the player taps "New game".
  const seed = useMemo(
    () => dayIndex() * 1013 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateZonMaan(size, seed, CLUE_RATIO_FOR[difficulty]);
    setPuzzle(p);
    // Pre-fill clue cells so the player can never overwrite them.
    const init: CellState[] = new Array(size * size).fill(-1);
    for (const k of Object.keys(p.clues)) {
      init[Number(k)] = p.clues[Number(k)];
    }
    setCells(init);
    setHistory([]);
    setHintsLeft(HINTS_FOR[difficulty]);
    setElapsed(0);
    setDone(false);
    setNewBest(false);
    startedAt.current = null;
  }, [difficulty, seed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(BEST_KEY(difficulty));
    setBestSeconds(raw ? Number(raw) : null);
  }, [difficulty]);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  // Win detection lives in a useEffect that watches `cells` so it runs on
  // every state change — including hint reveals and undos. The previous
  // version called the win-check inside the setCells updater, which is
  // unsafe under React 18 strict mode (updaters re-run) and missed any
  // path that mutated cells outside that callback.
  const [newBest, setNewBest] = useState(false);
  useEffect(() => {
    if (!puzzle || done) return;
    if (cells.length !== puzzle.solution.length) return;
    for (let i = 0; i < puzzle.solution.length; i++) {
      if (cells[i] !== puzzle.solution[i]) return;
    }
    const tt = startedAt.current
      ? Math.floor((Date.now() - startedAt.current) / 1000)
      : elapsed;
    setElapsed(tt);
    setDone(true);
    if (typeof window !== "undefined") {
      const prevBest = Number(localStorage.getItem(BEST_KEY(difficulty)) ?? "");
      if (!prevBest || tt < prevBest) {
        localStorage.setItem(BEST_KEY(difficulty), String(tt));
        setBestSeconds(tt);
        setNewBest(true);
      }
    }
  }, [cells, puzzle, done, difficulty, elapsed]);

  const onCellClick = useCallback(
    (idx: number) => {
      if (done || !puzzle) return;
      if (idx in puzzle.clues) return;
      if (!startedAt.current) startedAt.current = Date.now();
      const cur = cells[idx];
      const nxt = nextState(cur);
      setCells((prev) => {
        const next = [...prev];
        next[idx] = nxt;
        return next;
      });
      setHistory((h) => [...h, { idx, prev: cur, next: nxt }]);
    },
    [cells, done, puzzle]
  );

  const onUndo = useCallback(() => {
    if (done) return;
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setCells((prev) => {
        const next = [...prev];
        next[last.idx] = last.prev;
        return next;
      });
      return h.slice(0, -1);
    });
  }, [done]);

  const onHint = useCallback(() => {
    if (done || !puzzle || hintsLeft <= 0) return;
    // Reveal a random cell that's currently wrong/empty (and not a clue).
    const candidates: number[] = [];
    for (let i = 0; i < puzzle.solution.length; i++) {
      if (i in puzzle.clues) continue;
      if (cells[i] !== puzzle.solution[i]) candidates.push(i);
    }
    if (!candidates.length) return;
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    if (!startedAt.current) startedAt.current = Date.now();
    const cur = cells[idx];
    const nxt = puzzle.solution[idx];
    setCells((prev) => {
      const next = [...prev];
      next[idx] = nxt;
      return next;
    });
    setHistory((h) => [...h, { idx, prev: cur, next: nxt }]);
    setHintsLeft((h) => h - 1);
  }, [cells, done, hintsLeft, puzzle]);

  const onReset = useCallback(() => {
    if (!puzzle) return;
    const init: CellState[] = new Array(puzzle.size * puzzle.size).fill(-1);
    for (const k of Object.keys(puzzle.clues)) init[Number(k)] = puzzle.clues[Number(k)];
    setCells(init);
    setHistory([]);
    setDone(false);
    setElapsed(0);
    startedAt.current = null;
  }, [puzzle]);

  const onNewGame = useCallback(() => setSeedNonce((n) => n + 1), []);

  if (!puzzle) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const size = puzzle.size;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="zonmaan" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_zonmaan")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_zonmaan_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <ZonMaanGrid
        puzzle={puzzle}
        cells={cells}
        done={done}
        onClick={onCellClick}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onNewGame}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold hover:opacity-90"
          >
            {t("new_game")}
          </button>
          <button
            onClick={onHint}
            disabled={hintsLeft <= 0 || done}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40"
          >
            {t("hint")} ({hintsLeft})
          </button>
          <button
            onClick={onUndo}
            disabled={!history.length || done}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40"
          >
            {t("undo")}
          </button>
          <button
            onClick={onReset}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm"
          >
            {t("reset")}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {t("best_time")}: <span className="font-mono text-gray-300">{bestSeconds ? `${bestSeconds}s` : "—"}</span>
        </p>
      </div>

      {done && puzzle ? (
        <>
          <WinModal
            elapsed={elapsed}
            hintsUsed={HINTS_FOR[difficulty] - hintsLeft}
            bestSeconds={bestSeconds}
            isNewBest={newBest}
            onPlayAgain={onReset}
            onNewPuzzle={onNewGame}
          />
          <EndScreenAddon
            game="zonmaan"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, hintsUsed: HINTS_FOR[difficulty] - hintsLeft }}
          />
        </>
      ) : null}
    </div>
  );
}

function WinModal({
  elapsed,
  hintsUsed,
  bestSeconds,
  isNewBest,
  onPlayAgain,
  onNewPuzzle,
}: {
  elapsed: number;
  hintsUsed: number;
  bestSeconds: number | null;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onNewPuzzle: () => void;
}) {
  const { t } = useLocale();
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const onShare = useCallback(() => {
    const txt = `Zon & Maan 6×6 — ${fmt(elapsed)} — BrainArena`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(txt).catch(() => {});
    }
  }, [elapsed]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#13141c] p-5 shadow-2xl"
      >
        <h2 className="text-2xl font-black text-emerald-300">{t("win_title")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-gray-400">{t("win_your_time")}</dt>
          <dd className="text-right font-mono text-white">{fmt(elapsed)}</dd>
          <dt className="text-gray-400">{t("win_hints_used")}</dt>
          <dd className="text-right font-mono text-white">{hintsUsed}</dd>
          <dt className="text-gray-400">{t("win_best_time")}</dt>
          <dd className="text-right font-mono text-white">{bestSeconds != null ? fmt(bestSeconds) : "—"}</dd>
        </dl>
        {isNewBest ? (
          <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-sm font-bold text-amber-300">
            ★ {t("win_new_record")}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onPlayAgain}
            className="min-h-[44px] flex-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold"
          >
            {t("win_play_again")}
          </button>
          <button
            onClick={onNewPuzzle}
            className="min-h-[44px] flex-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-bold hover:opacity-90"
          >
            {t("win_new_puzzle")}
          </button>
          <button
            onClick={onShare}
            className="min-h-[44px] flex-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm"
          >
            {t("win_share")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ZonMaanGrid({
  puzzle,
  cells,
  done,
  onClick,
}: {
  puzzle: ZonMaanPuzzle;
  cells: CellState[];
  done: boolean;
  onClick: (idx: number) => void;
}) {
  const { size } = puzzle;
  // Render in a 2N-1 × 2N-1 mesh: cells at even/even, and edge slots on
  // the gaps so "=" / "×" markers sit between adjacent cells. Empty
  // edge slots collapse to a thin separator.
  const gridSize = size * 2 - 1;
  const slots: React.ReactNode[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isCellRow = row % 2 === 0;
      const isCellCol = col % 2 === 0;
      const r = row / 2;
      const c = col / 2;
      if (isCellRow && isCellCol) {
        const idx = r * size + c;
        const state = cells[idx];
        const isClue = idx in puzzle.clues;
        const stateLabel = state === 1 ? "sun" : state === 0 ? "moon" : "empty";
        slots.push(
          <button
            key={`c-${idx}`}
            type="button"
            disabled={done || isClue}
            onClick={() => onClick(idx)}
            aria-label={`row ${r + 1} col ${c + 1}, ${stateLabel}${isClue ? ", clue" : ""}`}
            className={`aspect-square grid place-items-center select-none transition active:scale-[0.97] ${
              isClue
                ? "bg-[#13141c] border border-[#2a2a2a]"
                : "bg-[#15151c] hover:bg-[#1c1c25] border border-[#2a2a2a]"
            }`}
          >
            {state === 1 ? <SunIcon /> : state === 0 ? <MoonIcon /> : null}
          </button>
        );
      } else if (isCellRow && !isCellCol) {
        // Horizontal gap — between (r, c) and (r, c+1).
        const a = r * size + c;
        const b = r * size + (c + 1);
        const k = edgeKey(a, b);
        const sym = puzzle.edges[k];
        slots.push(
          <div key={`h-${row}-${col}`} className="grid place-items-center">
            {sym ? <EdgeBadge sym={sym} /> : <span className="block h-1 w-1" />}
          </div>
        );
      } else if (!isCellRow && isCellCol) {
        // Vertical gap — between (r, c) and (r+1, c).
        const a = r * size + c;
        const b = (r + 1) * size + c;
        const k = edgeKey(a, b);
        const sym = puzzle.edges[k];
        slots.push(
          <div key={`v-${row}-${col}`} className="grid place-items-center">
            {sym ? <EdgeBadge sym={sym} /> : <span className="block h-1 w-1" />}
          </div>
        );
      } else {
        // Corner gap — never carries a symbol.
        slots.push(<div key={`x-${row}-${col}`} />);
      }
    }
  }

  // The cells take "1fr" each; the edge gutters take a fixed narrow band so
  // they don't squash the cells but stay readable.
  const cols = Array.from({ length: gridSize }, (_, i) => (i % 2 === 0 ? "1fr" : "16px")).join(" ");
  const rows = cols;

  return (
    <div
      className="mx-auto mt-5 grid"
      style={{ gridTemplateColumns: cols, gridTemplateRows: rows, gap: "0px" }}
    >
      {slots}
    </div>
  );
}

function EdgeBadge({ sym }: { sym: "=" | "x" }) {
  // Terracotta-on-cream for both = and × — color is for legibility, the
  // glyph itself carries the meaning.
  return (
    <span
      aria-label={sym === "=" ? "same symbol" : "opposite symbols"}
      className="inline-grid place-items-center text-[11px] font-black h-4 w-4 rounded-full bg-[#fef3e2] text-[#c2410c] ring-1 ring-[#fb923c]/40"
    >
      {sym === "=" ? "=" : "×"}
    </span>
  );
}

function SunIcon() {
  // Solid orange disc; rays kept subtle so it reads at small sizes too.
  return (
    <svg viewBox="0 0 32 32" width="60%" height="60%" aria-hidden="true">
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <line x1="16" y1="3"  x2="16" y2="7" />
        <line x1="16" y1="25" x2="16" y2="29" />
        <line x1="3"  y1="16" x2="7"  y2="16" />
        <line x1="25" y1="16" x2="29" y2="16" />
        <line x1="6.6"  y1="6.6"  x2="9.4"  y2="9.4" />
        <line x1="22.6" y1="22.6" x2="25.4" y2="25.4" />
        <line x1="6.6"  y1="25.4" x2="9.4"  y2="22.6" />
        <line x1="22.6" y1="9.4"  x2="25.4" y2="6.6" />
      </g>
      <circle cx="16" cy="16" r="6.5" fill="#f39c12" stroke="#d97706" strokeWidth="1" />
    </svg>
  );
}

function MoonIcon() {
  // Blue crescent built from two overlapping circles via mask.
  return (
    <svg viewBox="0 0 32 32" width="60%" height="60%" aria-hidden="true">
      <defs>
        <mask id="zm-moon-mask">
          <rect width="32" height="32" fill="white" />
          <circle cx="20" cy="13" r="8" fill="black" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="9" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" mask="url(#zm-moon-mask)" />
    </svg>
  );
}

function DifficultyToggle({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const { t } = useLocale();
  const items: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-xs">
      {items.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1.5 capitalize ${
            value === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          {t(d)}
        </button>
      ))}
    </div>
  );
}
