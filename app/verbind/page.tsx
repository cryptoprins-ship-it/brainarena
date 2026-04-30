"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import { generateVerbind, type VerbindPuzzle } from "@/lib/games/verbind";
import { dayIndex } from "@/lib/games/kronen";

type Difficulty = "easy" | "medium" | "hard";
const SIZE_FOR: Record<Difficulty, number> = { easy: 5, medium: 6, hard: 7 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
const BEST_KEY = (d: Difficulty) => `brainarena-verbind-best-${d}`;

type Move = { type: "extend" | "truncate"; prevPath: number[] };

export default function VerbindPage() {
  const { t, locale } = useLocale();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [puzzle, setPuzzle] = useState<VerbindPuzzle | null>(null);
  const [path, setPath] = useState<number[]>([]); // current player path, ordered
  const [history, setHistory] = useState<Move[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS_FOR.easy);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null);
  const dragging = useRef(false);

  const seed = useMemo(
    () => dayIndex() * 1601 + DIFF_INDEX[difficulty] * 23 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateVerbind(size, seed);
    setPuzzle(p);
    // Start path with checkpoint 1.
    setPath([p.checkpoints[1]]);
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
    (current: number[]) => {
      if (!puzzle) return false;
      const N = puzzle.size * puzzle.size;
      if (current.length !== N) return false;
      // Check checkpoints in order.
      const cps = puzzle.checkpoints.slice(1);
      let nextIdx = 0;
      for (const cell of current) {
        if (nextIdx < cps.length && cell === cps[nextIdx]) {
          nextIdx++;
        } else if (cps.includes(cell)) {
          return false; // out-of-order checkpoint
        }
      }
      return nextIdx === cps.length;
    },
    [puzzle]
  );

  function persistBest(t: number) {
    const prevBest = Number(localStorage.getItem(BEST_KEY(difficulty)) ?? "");
    if (!prevBest || t < prevBest) {
      localStorage.setItem(BEST_KEY(difficulty), String(t));
      setBestSeconds(t);
    }
  }

  const isAdjacent = useCallback(
    (a: number, b: number, size: number) => {
      const ar = Math.floor(a / size), ac = a % size;
      const br = Math.floor(b / size), bc = b % size;
      return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
    },
    []
  );

  const onCellAction = useCallback(
    (idx: number) => {
      if (done || !puzzle) return;
      if (!startedAt.current) startedAt.current = Date.now();
      const size = puzzle.size;
      setPath((prev) => {
        // Already on path — truncate back to that index.
        const found = prev.indexOf(idx);
        if (found >= 0) {
          if (found === prev.length - 1) return prev; // last cell, no-op
          const next = prev.slice(0, found + 1);
          setHistory((h) => [...h, { type: "truncate", prevPath: prev }]);
          return next;
        }
        // Not on path — must be adjacent to the current head.
        const head = prev[prev.length - 1];
        if (!isAdjacent(head, idx, size)) return prev;
        const next = [...prev, idx];
        setHistory((h) => [...h, { type: "extend", prevPath: prev }]);
        if (isWin(next)) {
          setDone(true);
          const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
          setElapsed(tt);
          persistBest(tt);
        }
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [done, elapsed, isAdjacent, isWin, puzzle]
  );

  const onUndo = useCallback(() => {
    if (done) return;
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setPath(last.prevPath);
      return h.slice(0, -1);
    });
  }, [done]);

  const onHint = useCallback(() => {
    if (done || !puzzle || hintsLeft <= 0) return;
    // Extend the player's path along the embedded solution by ONE cell.
    setPath((prev) => {
      const intendedNext = puzzle.pathOrder[prev.length];
      if (intendedNext == null) return prev;
      // If the player's path matches the embedded one so far, append the
      // next embedded cell. Otherwise truncate to the longest matching
      // prefix and append.
      let matchLen = 0;
      while (matchLen < prev.length && prev[matchLen] === puzzle.pathOrder[matchLen]) matchLen++;
      const trimmed = prev.slice(0, matchLen);
      const cellToReveal = puzzle.pathOrder[matchLen];
      if (cellToReveal == null) return prev;
      const next = [...trimmed, cellToReveal];
      setHistory((h) => [...h, { type: "extend", prevPath: prev }]);
      if (isWin(next)) {
        setDone(true);
        const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
        setElapsed(tt);
        persistBest(tt);
      }
      return next;
    });
    setHintsLeft((h) => h - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, elapsed, hintsLeft, isWin, puzzle]);

  const onReset = useCallback(() => {
    if (!puzzle) return;
    setPath([puzzle.checkpoints[1]]);
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
  // Map cell idx → checkpoint number (1-based) or 0 if not a checkpoint.
  const checkpointAt: number[] = new Array(size * size).fill(0);
  for (let i = 1; i < puzzle.checkpoints.length; i++) {
    checkpointAt[puzzle.checkpoints[i]] = i;
  }
  // Map cell idx → step in player's path (1-based) or 0 if not on path.
  const stepAt: number[] = new Array(size * size).fill(0);
  path.forEach((cell, i) => { stepAt[cell] = i + 1; });
  const head = path[path.length - 1];
  const totalCheckpoints = puzzle.checkpoints.length - 1;
  const reachedCheckpoints = path.reduce((n, cell) => (checkpointAt[cell] ? n + 1 : n), 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="verbind" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_verbind")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_verbind_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t("path_length")}: <span className="font-mono text-gray-300">{path.length}/{size * size}</span>
        <span className="mx-2">·</span>
        Checkpoints: <span className="font-mono text-gray-300">{reachedCheckpoints}/{totalCheckpoints}</span>
      </p>

      <div
        className="mx-auto mt-4 grid gap-[2px] rounded-md border-2 border-[#0a0a0a] bg-[#0a0a0a] p-[2px] select-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchEnd={() => { dragging.current = false; }}
      >
        {Array.from({ length: size * size }, (_, idx) => {
          const cp = checkpointAt[idx];
          const step = stepAt[idx];
          const isHead = idx === head;
          const onPath = step > 0;
          const bg = onPath
            ? isHead
              ? "bg-emerald-500"
              : "bg-cyan-500"
            : "bg-[#1a1a1a] hover:bg-[#262626]";
          return (
            <button
              key={idx}
              type="button"
              onMouseDown={() => { dragging.current = true; onCellAction(idx); }}
              onMouseEnter={() => { if (dragging.current) onCellAction(idx); }}
              onTouchStart={() => { dragging.current = true; onCellAction(idx); }}
              disabled={done}
              className={`aspect-square grid place-items-center text-sm font-bold transition-colors ${bg}`}
            >
              {cp ? (
                <span className={`grid place-items-center w-7 h-7 rounded-full text-xs font-black ${onPath ? "bg-[#0a0a0a] text-white" : "bg-amber-300 text-[#0a0a0a]"}`}>
                  {cp}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={onNewGame} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold hover:opacity-90">
            {t("new_game")}
          </button>
          <button onClick={onHint} disabled={hintsLeft <= 0 || done} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40">
            {t("hint")} ({hintsLeft})
          </button>
          <button onClick={onUndo} disabled={!history.length || done} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40">
            {t("undo")}
          </button>
          <button onClick={onReset} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm">
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
            </p>
          </div>
          <EndScreenAddon
            game="verbind"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, hintsUsed: HINTS_FOR[difficulty] - hintsLeft }}
          />
        </>
      ) : null}
    </div>
  );
}

function DifficultyToggle({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  const { t } = useLocale();
  const items: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-xs">
      {items.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1.5 capitalize ${value === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"}`}
        >
          {t(d)}
        </button>
      ))}
    </div>
  );
}
