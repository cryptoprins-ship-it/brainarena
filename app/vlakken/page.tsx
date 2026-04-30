"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import { generateVlakken, type VlakkenPuzzle } from "@/lib/games/vlakken";
import { dayIndex } from "@/lib/games/kronen";

type Difficulty = "easy" | "medium" | "hard";
const SIZE_FOR: Record<Difficulty, number> = { easy: 6, medium: 7, hard: 9 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
const BEST_KEY = (d: Difficulty) => `brainarena-vlakken-best-${d}`;

// Warm palette, distinct hues per anchor index. Loops back if more anchors
// than colours; picks a good cycle that keeps neighbours visually different.
const VLAKKEN_PALETTE = [
  "#c97b63", "#7a8d6c", "#bca06a", "#6b8aa6", "#a07a8a",
  "#d8b58a", "#8d6855", "#5e6f7a", "#a0764e", "#7d8b78",
  "#9c6f9b", "#a89070",
];

type Move = { idx: number; prev: number; next: number };

export default function VlakkenPage() {
  const { t, locale } = useLocale();

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [puzzle, setPuzzle] = useState<VlakkenPuzzle | null>(null);
  // assignment[cellIdx] = anchor index, or -1 if unassigned. Anchor cells are
  // pre-set to their own anchor index and not editable.
  const [assignment, setAssignment] = useState<number[]>([]);
  const [activeAnchor, setActiveAnchor] = useState<number>(0);
  const [history, setHistory] = useState<Move[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS_FOR.easy);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null);

  const seed = useMemo(
    () => dayIndex() * 1303 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateVlakken(size, seed);
    setPuzzle(p);
    const a = new Array(size * size).fill(-1);
    p.anchors.forEach((anchor, i) => { a[anchor.idx] = i; });
    setAssignment(a);
    setActiveAnchor(0);
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
      for (let i = 0; i < current.length; i++) {
        if (current[i] !== puzzle.solution[i]) return false;
      }
      return true;
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

  const onCellClick = useCallback(
    (idx: number) => {
      if (done || !puzzle) return;
      // Don't let the player overwrite the active anchor's own cell.
      const isAnchor = puzzle.anchors.some((a) => a.idx === idx);
      if (isAnchor) {
        // Tapping an anchor cell switches the active anchor instead.
        const i = puzzle.anchors.findIndex((a) => a.idx === idx);
        if (i >= 0) setActiveAnchor(i);
        return;
      }
      if (!startedAt.current) startedAt.current = Date.now();
      setAssignment((prev) => {
        const next = [...prev];
        const cur = next[idx];
        // Cycle: if not assigned → assign to active; if already assigned to
        // active → unassign; else reassign to active.
        let target: number;
        if (cur === activeAnchor) target = -1;
        else target = activeAnchor;
        next[idx] = target;
        setHistory((h) => [...h, { idx, prev: cur, next: target }]);
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
    [activeAnchor, done, elapsed, isWin, puzzle]
  );

  const onUndo = useCallback(() => {
    if (done) return;
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setAssignment((m) => {
        const next = [...m];
        next[last.idx] = last.prev;
        return next;
      });
      return h.slice(0, -1);
    });
  }, [done]);

  const onHint = useCallback(() => {
    if (done || !puzzle || hintsLeft <= 0) return;
    // Find any cell that's wrong (or unassigned) and reveal it.
    const candidates: number[] = [];
    for (let i = 0; i < puzzle.solution.length; i++) {
      const isAnchor = puzzle.anchors.some((a) => a.idx === i);
      if (isAnchor) continue;
      if (assignment[i] !== puzzle.solution[i]) candidates.push(i);
    }
    if (!candidates.length) return;
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    if (!startedAt.current) startedAt.current = Date.now();
    setAssignment((prev) => {
      const next = [...prev];
      const cur = next[idx];
      next[idx] = puzzle.solution[idx];
      setHistory((h) => [...h, { idx, prev: cur, next: puzzle.solution[idx] }]);
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
  }, [assignment, difficulty, done, elapsed, hintsLeft, isWin, puzzle]);

  const onReset = useCallback(() => {
    if (!puzzle) return;
    const a = new Array(puzzle.size * puzzle.size).fill(-1);
    puzzle.anchors.forEach((anchor, i) => { a[anchor.idx] = i; });
    setAssignment(a);
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
  const activeAnchorObj = puzzle.anchors[activeAnchor];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="vlakken" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_vlakken")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_vlakken_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t("active_anchor")}:{" "}
        {activeAnchorObj ? (
          <span
            className="ml-1 inline-block rounded px-2 py-0.5 text-xs font-bold text-[#0a0a0a]"
            style={{ background: VLAKKEN_PALETTE[activeAnchor % VLAKKEN_PALETTE.length] }}
          >
            {activeAnchorObj.size} ({modeLabel(activeAnchorObj.mode)})
          </span>
        ) : null}
      </p>

      <div
        className="mx-auto mt-4 grid gap-[2px] rounded-md border-2 border-[#0a0a0a] bg-[#0a0a0a] p-[2px]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {assignment.map((cellAnchor, idx) => {
          const anchorIdx = puzzle.anchors.findIndex((a) => a.idx === idx);
          const isAnchor = anchorIdx >= 0;
          const colour = cellAnchor >= 0 ? VLAKKEN_PALETTE[cellAnchor % VLAKKEN_PALETTE.length] : "#1a1a1a";
          const isActiveOwner = cellAnchor === activeAnchor;
          const anchor = isAnchor ? puzzle.anchors[anchorIdx] : null;
          const showActiveRing = isAnchor && anchorIdx === activeAnchor;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onCellClick(idx)}
              disabled={done}
              className={`aspect-square grid place-items-center text-sm font-bold transition active:scale-[0.97] ${
                showActiveRing ? "ring-2 ring-amber-300" : ""
              } ${isActiveOwner ? "" : ""}`}
              style={{
                background: colour,
                outline: anchor
                  ? anchor.mode === "any"
                    ? "2px dashed rgba(255,255,255,0.85)"
                    : "2px solid rgba(255,255,255,0.85)"
                  : undefined,
                outlineOffset: anchor ? "-4px" : undefined,
              }}
            >
              {anchor ? (
                <span className="text-base text-[#0a0a0a]">{anchor.size}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {puzzle.anchors.map((a, i) => (
          <button
            key={i}
            onClick={() => setActiveAnchor(i)}
            className={`rounded-md px-2 py-1 text-xs font-bold transition ${
              activeAnchor === i ? "ring-2 ring-amber-300" : "opacity-70 hover:opacity-100"
            }`}
            style={{ background: VLAKKEN_PALETTE[i % VLAKKEN_PALETTE.length], color: "#0a0a0a" }}
            title={`${a.size} (${a.mode})`}
          >
            {a.size}
            <span className="ml-1 text-[10px] opacity-70">{shortMode(a.mode)}</span>
          </button>
        ))}
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
            game="vlakken"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, hintsUsed: HINTS_FOR[difficulty] - hintsLeft }}
          />
        </>
      ) : null}
    </div>
  );
}

function modeLabel(mode: string): string {
  if (mode === "square") return "■";
  if (mode === "tall") return "▮";
  if (mode === "wide") return "▬";
  return "?";
}

function shortMode(mode: string): string {
  if (mode === "square") return "■";
  if (mode === "tall") return "▮";
  if (mode === "wide") return "▬";
  return "?";
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
