"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import TimeEndLeaderboard from "@/components/TimeEndLeaderboard";
import { useLocale } from "@/lib/i18n";
import { generateKronen, dayIndex, type KronenPuzzle } from "@/lib/games/kronen";
import { getName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

type Difficulty = "easy" | "medium" | "hard";
type CellMark = 0 | 1 | 2; // 0 empty, 1 X, 2 crown

const SIZE_FOR: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 10 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
const BEST_KEY = (d: Difficulty) => `brainarena-kronen-best-${d}`;

// LinkedIn-Queens-style vivid palette: high-contrast, mutually distinct
// hues so neighbouring regions never blur together.
const KRONEN_PALETTE = [
  "#60a5fa", // blue
  "#fb923c", // orange
  "#a855f7", // purple
  "#22c55e", // green
  "#f87171", // coral
  "#facc15", // yellow
  "#94a3b8", // slate
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
];

type Move = { idx: number; prev: CellMark; next: CellMark };

export default function KronenPage() {
  const { t, locale } = useLocale();

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [puzzle, setPuzzle] = useState<KronenPuzzle | null>(null);
  const [marks, setMarks] = useState<CellMark[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS_FOR.easy);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);

  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("kronen", todayIdx, difficulty);

  // Build a daily seed tied to UTC day + difficulty + nonce. The nonce lets
  // "New game" within the same day produce a fresh puzzle; nonce=0 is the
  // shared daily so leaderboard entries match across players.
  const seed = useMemo(
    () => dayIndex() * 1009 + DIFF_INDEX[difficulty] * 17 + seedNonce,
    [difficulty, seedNonce]
  );

  // Generate puzzle whenever seed/difficulty changes.
  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateKronen(size, seed);
    setPuzzle(p);
    setMarks(new Array(size * size).fill(0));
    setHistory([]);
    setHintsLeft(HINTS_FOR[difficulty]);
    setElapsed(0);
    setDone(false);
    setSubmitted(null);
    setEligibleToSubmit(false);
    startedAt.current = null;
  }, [difficulty, seed]);

  // Submit to leaderboard on win, gated by the 3-attempt daily cap (per
  // difficulty since each difficulty is a separate puzzle stream).
  useEffect(() => {
    if (!done) { recordedRef.current = false; return; }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "kronen",
        name: getName() || "Anonymous",
        score: Math.max(1, 100000 - elapsed),
        time: elapsed,
        language: locale,
        meta: { difficulty, hintsUsed: HINTS_FOR[difficulty] - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, elapsed, difficulty, hintsLeft, locale, record, submitted]);

  // Best-time per difficulty.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = safeGetItem(BEST_KEY(difficulty));
    setBestSeconds(raw ? Number(raw) : null);
  }, [difficulty]);

  // Timer.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  // Win detection: validate the rules directly instead of comparing against
  // the embedded solution. On hard (10x10) the uniqueness refiner sometimes
  // can't make a puzzle unique within budget, so a player who places a
  // valid placement that isn't the embedded one would otherwise never see
  // a win. Rule-based: exactly N crowns, one per row, one per column, one
  // per region, and no two crowns king-adjacent.
  const isWin = useCallback(
    (current: CellMark[]) => {
      if (!puzzle) return false;
      const { size, regions } = puzzle;
      const crownCells: number[] = [];
      for (let i = 0; i < size * size; i++) {
        if (current[i] === 2) crownCells.push(i);
      }
      if (crownCells.length !== size) return false;

      const rowsSeen = new Set<number>();
      const colsSeen = new Set<number>();
      const regionsSeen = new Set<number>();
      for (const idx of crownCells) {
        const r = Math.floor(idx / size);
        const c = idx % size;
        const reg = regions[idx];
        if (rowsSeen.has(r) || colsSeen.has(c) || regionsSeen.has(reg)) return false;
        rowsSeen.add(r);
        colsSeen.add(c);
        regionsSeen.add(reg);
      }

      for (let i = 0; i < crownCells.length; i++) {
        const r1 = Math.floor(crownCells[i] / size);
        const c1 = crownCells[i] % size;
        for (let j = i + 1; j < crownCells.length; j++) {
          const r2 = Math.floor(crownCells[j] / size);
          const c2 = crownCells[j] % size;
          if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return false;
        }
      }
      return true;
    },
    [puzzle]
  );

  const onCellClick = useCallback(
    (idx: number) => {
      if (done || !puzzle) return;
      if (!startedAt.current) startedAt.current = Date.now();
      setMarks((prev) => {
        const next: CellMark[] = [...prev];
        const cur = next[idx];
        const nxt: CellMark = (((cur + 1) % 3) as CellMark);
        next[idx] = nxt;
        setHistory((h) => [...h, { idx, prev: cur, next: nxt }]);
        if (isWin(next)) {
          setDone(true);
          const t = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
          setElapsed(t);
          // Persist best time.
          const prevBest = Number(safeGetItem(BEST_KEY(difficulty)) ?? "");
          if (!prevBest || t < prevBest) {
            safeSetItem(BEST_KEY(difficulty), String(t));
            setBestSeconds(t);
          }
        }
        return next;
      });
    },
    [difficulty, done, elapsed, isWin, puzzle]
  );

  const onUndo = useCallback(() => {
    if (done) return;
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setMarks((m) => {
        const next = [...m];
        next[last.idx] = last.prev;
        return next;
      });
      return h.slice(0, -1);
    });
  }, [done]);

  const onHint = useCallback(() => {
    if (done || !puzzle || hintsLeft <= 0) return;
    const { size, solution } = puzzle;
    // Pick a row whose crown isn't yet correctly placed.
    const candidates: number[] = [];
    for (let r = 0; r < size; r++) {
      const want = solution[r];
      const idx = r * size + want;
      if (marks[idx] !== 2) candidates.push(idx);
    }
    if (!candidates.length) return;
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    if (!startedAt.current) startedAt.current = Date.now();
    setMarks((prev) => {
      const next = [...prev];
      const cur = next[idx];
      next[idx] = 2;
      setHistory((h) => [...h, { idx, prev: cur, next: 2 }]);
      if (isWin(next)) {
        setDone(true);
        const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
        setElapsed(tt);
        const prevBest = Number(safeGetItem(BEST_KEY(difficulty)) ?? "");
        if (!prevBest || tt < prevBest) {
          safeSetItem(BEST_KEY(difficulty), String(tt));
          setBestSeconds(tt);
        }
      }
      return next;
    });
    setHintsLeft((h) => h - 1);
  }, [difficulty, done, elapsed, hintsLeft, isWin, marks, puzzle]);

  const onReset = useCallback(() => {
    if (!puzzle) return;
    setMarks(new Array(puzzle.size * puzzle.size).fill(0));
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
  const conflictKind = firstConflict(marks, puzzle);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="kronen" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_kronen")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_kronen_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span> ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <div
        className="mx-auto mt-5 grid rounded-md border-2 border-[#0a0a0a] bg-[#0a0a0a] overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap: 0 }}
      >
        {puzzle.regions.map((region, idx) => {
          const mark = marks[idx];
          const r = Math.floor(idx / size);
          const c = idx % size;
          const conflict = mark === 2 && hasConflict(idx, marks, puzzle);
          const fill = KRONEN_PALETTE[region % KRONEN_PALETTE.length];
          // LinkedIn-style region outlines: thick dark border between
          // different regions, thin same-fill border within a region (so
          // adjacent same-region cells still get a hairline cell separator).
          const sameRegion = (otherIdx: number | undefined) =>
            otherIdx !== undefined && puzzle.regions[otherIdx] === region;
          const top = r > 0 ? idx - size : undefined;
          const bottom = r < size - 1 ? idx + size : undefined;
          const left = c > 0 ? idx - 1 : undefined;
          const right = c < size - 1 ? idx + 1 : undefined;
          const lineColor = "#0a0a0a";
          const innerColor = "rgba(0,0,0,0.18)";
          const borderTopWidth = sameRegion(top) ? 1 : 3;
          const borderBottomWidth = sameRegion(bottom) ? 1 : 3;
          const borderLeftWidth = sameRegion(left) ? 1 : 3;
          const borderRightWidth = sameRegion(right) ? 1 : 3;
          return (
            <button
              key={idx}
              type="button"
              aria-label={`row ${r + 1} col ${c + 1}`}
              onClick={() => onCellClick(idx)}
              disabled={done}
              className={`aspect-square grid place-items-center text-lg font-bold transition active:scale-[0.97] ${
                conflict ? "ring-2 ring-red-500 ring-inset z-10" : ""
              }`}
              style={{
                background: fill,
                borderStyle: "solid",
                borderTopColor: sameRegion(top) ? innerColor : lineColor,
                borderBottomColor: sameRegion(bottom) ? innerColor : lineColor,
                borderLeftColor: sameRegion(left) ? innerColor : lineColor,
                borderRightColor: sameRegion(right) ? innerColor : lineColor,
                borderTopWidth,
                borderBottomWidth,
                borderLeftWidth,
                borderRightWidth,
              }}
            >
              {mark === 2 ? (
                <span className="text-2xl leading-none text-[#0a0a0a] drop-shadow">♛</span>
              ) : mark === 1 ? (
                <span className="text-base leading-none text-[#0a0a0a]/70">×</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Conflict banner — explains *why* the placement isn't a solution.
          The thin red ring on each conflicting crown is easy to miss, so we
          surface the first conflict kind found in plain text. */}
      {conflictKind && !done ? (
        <div
          role="status"
          className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {t(`kronen_conflict_${conflictKind}` as
            | "kronen_conflict_row" | "kronen_conflict_col"
            | "kronen_conflict_region" | "kronen_conflict_adjacent")}
        </div>
      ) : null}

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
            {submitted ? (
              <p className="mt-2 text-sm text-emerald-300">
                <span className="font-bold">{getName() || "Anonymous"}</span> · {t("you_ranked", { rank: submitted.rank })}
              </p>
            ) : null}
            {!eligibleToSubmit && !submitted ? (
              <p className="mt-3 text-xs text-amber-300">
                {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
              </p>
            ) : null}
            <TimeEndLeaderboard
              game="kronen"
              playerName={getName()}
              playerTime={elapsed}
              submittedRank={submitted?.rank}
              metaFilter={(e) =>
                (e.meta as { difficulty?: string } | undefined)?.difficulty === difficulty
              }
            />
          </div>
          <EndScreenAddon
            game="kronen"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, hintsUsed: HINTS_FOR[difficulty] - hintsLeft }}
          />
        </>
      ) : null}
    </div>
  );
}

function hasConflict(idx: number, marks: CellMark[], puzzle: KronenPuzzle): boolean {
  const { size, regions } = puzzle;
  if (marks[idx] !== 2) return false;
  const r = Math.floor(idx / size);
  const c = idx % size;
  // Same row / column / region duplicate?
  for (let i = 0; i < size * size; i++) {
    if (i === idx || marks[i] !== 2) continue;
    const ri = Math.floor(i / size);
    const ci = i % size;
    if (ri === r) return true;
    if (ci === c) return true;
    if (regions[i] === regions[idx]) return true;
    if (Math.abs(ri - r) <= 1 && Math.abs(ci - c) <= 1) return true;
  }
  return false;
}

type ConflictKind = "row" | "col" | "region" | "adjacent";

// Walk all placed crowns and return the first conflict kind found, or null.
// Priority: row → col → region → adjacent (row/col are the most obvious to a
// player so we surface those first). Used for the inline warning banner.
function firstConflict(marks: CellMark[], puzzle: KronenPuzzle): ConflictKind | null {
  const { size, regions } = puzzle;
  const crowns: number[] = [];
  for (let i = 0; i < size * size; i++) {
    if (marks[i] === 2) crowns.push(i);
  }
  for (let i = 0; i < crowns.length; i++) {
    const r1 = Math.floor(crowns[i] / size);
    const c1 = crowns[i] % size;
    for (let j = i + 1; j < crowns.length; j++) {
      const r2 = Math.floor(crowns[j] / size);
      const c2 = crowns[j] % size;
      if (r1 === r2) return "row";
      if (c1 === c2) return "col";
      if (regions[crowns[i]] === regions[crowns[j]]) return "region";
      if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return "adjacent";
    }
  }
  return null;
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
          type="button"
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
