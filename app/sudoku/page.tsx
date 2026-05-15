"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateDaily, type Cell, type Difficulty } from "@/lib/sudoku";
import { dayIndex } from "@/lib/dailyWord";
import { getName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import { useLocale } from "@/lib/i18n";

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];
const N = 9;

export default function SudokuPage() {
  const { t } = useLocale();
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [hintsLeft, setHintsLeft] = useState(3);
  const [time, setTime] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const startedAt = useRef<number | null>(null);

  // Each difficulty has its own daily puzzle, so attempts are tracked
  // per (sudoku, dayIdx, difficulty).
  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("sudoku", todayIdx, diff);

  // Seed: dayIndex × difficulty index → unique daily puzzle per difficulty.
  useEffect(() => {
    const seed = dayIndex() * 7 + DIFFS.indexOf(diff);
    const { puzzle, solution } = generateDaily(diff, seed);
    setBoard(puzzle);
    setSolution(solution);
    setSelected(null);
    setErrors(new Set());
    setHintsLeft(3);
    setTime(0);
    setDone(false);
    setSubmitted(null);
    setEligibleToSubmit(false);
    startedAt.current = null;
  }, [diff]);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setTime(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const setVal = useCallback((r: number, c: number, v: number) => {
    setBoard((prev) => {
      const cell = prev[r]?.[c];
      if (!cell || cell.given) return prev;
      const next = prev.map((row) => row.map((x) => ({ ...x })));
      next[r][c].value = v;
      return next;
    });
    if (!startedAt.current) startedAt.current = Date.now();
    // Recalculate errors against solution.
    setErrors((prev) => {
      const out = new Set(prev);
      const key = `${r}-${c}`;
      if (v === 0) out.delete(key);
      else if (solution[r] && solution[r][c] !== v) out.add(key);
      else out.delete(key);
      return out;
    });
  }, [solution]);

  const giveHint = useCallback(() => {
    if (hintsLeft <= 0 || done) return;
    // Find a random empty (or wrong) cell.
    const candidates: [number, number][] = [];
    board.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell.given && (cell.value === 0 || cell.value !== solution[r]?.[c])) candidates.push([r, c]);
    }));
    if (!candidates.length) return;
    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    setBoard((prev) => {
      const next = prev.map((row) => row.map((x) => ({ ...x })));
      next[r][c] = { value: solution[r][c], given: true }; // lock as given hint
      return next;
    });
    setErrors((prev) => { const o = new Set(prev); o.delete(`${r}-${c}`); return o; });
    setHintsLeft((h) => h - 1);
  }, [board, done, hintsLeft, solution]);

  // Detect completion.
  useEffect(() => {
    if (done || !board.length || !solution.length) return;
    let complete = true;
    for (let r = 0; r < N && complete; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c].value !== solution[r][c]) { complete = false; break; }
      }
    }
    if (complete) {
      setDone(true);
      const elapsed = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : time;
      setTime(elapsed);
    }
  }, [board, done, solution, time]);

  // Submit on completion — but only if this play still qualifies for the
  // daily leaderboard (first MAX_LEADERBOARD_ATTEMPTS attempts per
  // difficulty). `record()` is single-shot per useEffect run, so we guard
  // with a ref-style early-return on `submitted` to avoid double-counting
  // under StrictMode's double-invoke.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!done) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "sudoku",
        name: getName() || "Anonymous",
        score: 1, // sortable by time anyway
        time,
        meta: { difficulty: diff, hintsUsed: 3 - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [diff, done, hintsLeft, record, submitted, time]);

  // Keyboard input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack keystrokes when focus is in a text input — most
      // importantly the post-win name field. Without this, digits typed
      // into the name field also fill whichever cell was last clicked,
      // and arrow keys move both the input caret and the selection.
      const tgt = e.target as Element | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          (tgt as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (!selected) return;
      if (/^[1-9]$/.test(e.key)) setVal(selected.r, selected.c, Number(e.key));
      if (e.key === "Backspace" || e.key === "0" || e.key === "Delete") setVal(selected.r, selected.c, 0);
      if (e.key === "ArrowUp") setSelected((s) => s && { ...s, r: Math.max(0, s.r - 1) });
      if (e.key === "ArrowDown") setSelected((s) => s && { ...s, r: Math.min(N - 1, s.r + 1) });
      if (e.key === "ArrowLeft") setSelected((s) => s && { ...s, c: Math.max(0, s.c - 1) });
      if (e.key === "ArrowRight") setSelected((s) => s && { ...s, c: Math.min(N - 1, s.c + 1) });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, setVal]);

  const sameNumber = useMemo(() => {
    if (!selected || !board.length) return null;
    return board[selected.r][selected.c].value || null;
  }, [board, selected]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="sudoku" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Sudoku</h1>
          <p className="text-xs text-gray-400">
            {t("sudoku_status", { time, hints: hintsLeft })} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} {t("ranked_label")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-xs">
          {DIFFS.map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`rounded-md px-3 py-1.5 ${diff === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"}`}
            >
              {t(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-9 overflow-hidden rounded-md border-2 border-[#3a3a3c] bg-[#1a1a1a]">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const sel = selected?.r === r && selected?.c === c;
            const peer =
              selected &&
              (selected.r === r ||
                selected.c === c ||
                (Math.floor(selected.r / 3) === Math.floor(r / 3) && Math.floor(selected.c / 3) === Math.floor(c / 3)));
            const sameNum = sameNumber && cell.value === sameNumber;
            const err = errors.has(`${r}-${c}`);
            const borderR = (c + 1) % 3 === 0 && c < 8 ? "border-r-2 border-r-[#3a3a3c]" : "border-r border-r-[#2a2a2a]";
            const borderB = (r + 1) % 3 === 0 && r < 8 ? "border-b-2 border-b-[#3a3a3c]" : "border-b border-b-[#2a2a2a]";
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected({ r, c })}
                className={`aspect-square text-lg font-bold tabular-nums ${borderR} ${borderB} ${
                  err ? "text-red-400" : cell.given ? "text-white" : "text-indigo-300"
                } ${sel ? "bg-indigo-500/30" : sameNum ? "bg-indigo-500/15" : peer ? "bg-[#222]" : ""}`}
              >
                {cell.value || ""}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 grid grid-cols-9 gap-1">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            onClick={() => selected && setVal(selected.r, selected.c, n)}
            className="rounded-md bg-[#1a1a1a] py-3 text-base font-bold border border-[#2a2a2a] hover:border-indigo-400/40"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => selected && setVal(selected.r, selected.c, 0)}
          className="flex-1 rounded-md bg-[#1a1a1a] py-2 text-sm border border-[#2a2a2a]"
        >
          {t("clear")}
        </button>
        <button
          onClick={giveHint}
          disabled={hintsLeft <= 0}
          className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-bold disabled:opacity-50"
        >
          {t("hint")} ({hintsLeft})
        </button>
      </div>

      {done ? (
        <EndScreenAddon
          game="sudoku"
          score={1}
          time={time}
          rank={submitted?.rank}
          meta={{ difficulty: diff, hintsUsed: 3 - hintsLeft }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <h2 className="text-xl font-black">{t("sudoku_solved_in", { time })}</h2>
          {submitted ? (
            <p className="mt-2 text-sm text-emerald-300">
              <span className="font-bold">{getName() || "Anonymous"}</span> · {t("sudoku_ranked_board", { rank: submitted.rank, diff: t(diff) })}
            </p>
          ) : null}
          {done && !eligibleToSubmit && !submitted ? (
            <p className="mt-3 text-xs text-amber-300">
              {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
