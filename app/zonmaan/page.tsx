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

const SIZE_FOR: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };
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
    const p = generateZonMaan(size, seed);
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

  const isWin = useCallback(
    (current: CellState[]) => {
      if (!puzzle) return false;
      for (let i = 0; i < puzzle.solution.length; i++) {
        if (current[i] !== puzzle.solution[i]) return false;
      }
      return true;
    },
    [puzzle]
  );

  const recordWin = useCallback(
    (next: CellState[]) => {
      if (!isWin(next)) return;
      setDone(true);
      const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
      setElapsed(tt);
      const prevBest = Number(localStorage.getItem(BEST_KEY(difficulty)) ?? "");
      if (!prevBest || tt < prevBest) {
        localStorage.setItem(BEST_KEY(difficulty), String(tt));
        setBestSeconds(tt);
      }
    },
    [difficulty, elapsed, isWin]
  );

  const onCellClick = useCallback(
    (idx: number) => {
      if (done || !puzzle) return;
      // Clue cells are immutable.
      if (idx in puzzle.clues) return;
      if (!startedAt.current) startedAt.current = Date.now();
      setCells((prev) => {
        const next = [...prev];
        const cur = next[idx];
        const nxt = nextState(cur);
        next[idx] = nxt;
        setHistory((h) => [...h, { idx, prev: cur, next: nxt }]);
        recordWin(next);
        return next;
      });
    },
    [done, puzzle, recordWin]
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
    setCells((prev) => {
      const next = [...prev];
      const cur = next[idx];
      const nxt = puzzle.solution[idx];
      next[idx] = nxt;
      setHistory((h) => [...h, { idx, prev: cur, next: nxt }]);
      recordWin(next);
      return next;
    });
    setHintsLeft((h) => h - 1);
  }, [cells, done, hintsLeft, puzzle, recordWin]);

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

      {done ? (
        <>
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="font-bold text-emerald-200">{t("solved")}</p>
            <p className="mt-1 text-emerald-100">
              {t("your_time")}: <span className="font-mono">{elapsed}s</span>
              {bestSeconds === elapsed ? <span className="ml-2 text-amber-300">★ {t("best_time").toLowerCase()}</span> : null}
            </p>
          </div>
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
        slots.push(
          <button
            key={`c-${idx}`}
            type="button"
            disabled={done || isClue}
            onClick={() => onClick(idx)}
            aria-label={`row ${r + 1} col ${c + 1}`}
            className={`aspect-square grid place-items-center text-2xl select-none transition active:scale-[0.97] ${
              isClue
                ? "bg-[#13141c] text-amber-200 border border-[#2a2a2a]"
                : "bg-[#15151c] hover:bg-[#1c1c25] border border-[#2a2a2a]"
            }`}
          >
            {state === 1 ? <span title="sun">☀</span> : state === 0 ? <span title="moon" className="text-indigo-300">☾</span> : null}
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
  return (
    <span
      aria-label={sym === "=" ? "same symbol" : "opposite symbols"}
      className={`inline-grid place-items-center text-[10px] font-black h-4 w-4 rounded-full ${
        sym === "=" ? "bg-emerald-500 text-[#0a0a0a]" : "bg-rose-500 text-[#0a0a0a]"
      }`}
    >
      {sym === "=" ? "=" : "×"}
    </span>
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
