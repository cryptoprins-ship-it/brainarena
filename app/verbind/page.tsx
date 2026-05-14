"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import { generateVerbind, type VerbindPuzzle } from "@/lib/games/verbind";
import { dayIndex } from "@/lib/games/kronen";
import { getName, setName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";

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
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const dragPointerRef = useRef<number | null>(null);

  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("verbind", todayIdx, difficulty);
  useEffect(() => { setNameInput(getName()); }, []);

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
    setSubmitted(null);
    setEligibleToSubmit(false);
    recordedRef.current = false;
    startedAt.current = null;
  }, [difficulty, seed]);

  // Submit to leaderboard on win, gated by the 3-attempt daily cap (per
  // difficulty since each difficulty is a separate puzzle stream).
  useEffect(() => {
    if (!done) return;
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "verbind",
        name: getName() || "Anonymous",
        score: Math.max(1, 100000 - elapsed),
        time: elapsed,
        meta: { difficulty, hintsUsed: HINTS_FOR[difficulty] - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, elapsed, difficulty, hintsLeft, record, submitted]);

  const saveName = useCallback(() => {
    setName(nameInput);
    if (done && eligibleToSubmit && !submitted) {
      submitScore({
        game: "verbind",
        name: nameInput || "Anonymous",
        score: Math.max(1, 100000 - elapsed),
        time: elapsed,
        meta: { difficulty, hintsUsed: HINTS_FOR[difficulty] - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [nameInput, done, eligibleToSubmit, submitted, elapsed, difficulty, hintsLeft]);

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
        // Already on path — truncate back to that index (drag-back-to-shrink).
        const found = prev.indexOf(idx);
        if (found >= 0) {
          if (found === prev.length - 1) return prev; // already the head
          const next = prev.slice(0, found + 1);
          setHistory((h) => [...h, { type: "truncate", prevPath: prev }]);
          return next;
        }
        // Not on path — must be 4-adjacent to the current head.
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

  // Pointer-event drag: pointerdown on a cell starts drag, pointermove on the
  // document hit-tests the cell under the cursor and feeds it to onCellAction.
  // Handles mouse, touch, and stylus uniformly without the legacy fork the
  // file used before (mouseDown / mouseEnter / touchStart).
  const onCellPointerDown = useCallback(
    (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
      if (done) return;
      e.preventDefault();
      dragPointerRef.current = e.pointerId;
      onCellAction(idx);
    },
    [done, onCellAction]
  );

  const onCellActionRef = useRef(onCellAction);
  useEffect(() => { onCellActionRef.current = onCellAction; }, [onCellAction]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (dragPointerRef.current == null) return;
      if (dragPointerRef.current !== e.pointerId) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = target instanceof Element ? target.closest("[data-cell-idx]") : null;
      if (!cellEl) return;
      const raw = (cellEl as HTMLElement).dataset.cellIdx;
      const idx = raw ? Number(raw) : NaN;
      if (Number.isFinite(idx)) onCellActionRef.current(idx);
    };
    const handleUp = (e: PointerEvent) => {
      if (dragPointerRef.current === e.pointerId) dragPointerRef.current = null;
    };
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, []);

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
  const totalCheckpoints = puzzle.checkpoints.length - 1;
  const reachedCheckpoints = path.reduce((n, cell) => (checkpointAt[cell] ? n + 1 : n), 0);

  // SVG polyline points: cell centers in viewBox units (1 unit = 1 cell).
  const polyPoints = path
    .map((idx) => {
      const r = Math.floor(idx / size);
      const c = idx % size;
      return `${c + 0.5},${r + 0.5}`;
    })
    .join(" ");
  const headIdx = path[path.length - 1];
  const headR = Math.floor(headIdx / size);
  const headC = headIdx % size;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="verbind" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_verbind")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_verbind_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span> ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t("path_length")}: <span className="font-mono text-gray-300">{path.length}/{size * size}</span>
        <span className="mx-2">·</span>
        Checkpoints: <span className="font-mono text-gray-300">{reachedCheckpoints}/{totalCheckpoints}</span>
      </p>

      {/* Grid wrapper: cells are transparent drag-targets; path renders as a
          continuous SVG stripe across cells; checkpoints sit on top. */}
      <div className="relative mx-auto mt-4 aspect-square w-full overflow-hidden rounded-md border border-[#2a2a2a] bg-[#0e0e0e] touch-none select-none">
        <div
          className="grid h-full w-full"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap: 0 }}
        >
          {Array.from({ length: size * size }, (_, idx) => {
            const r = Math.floor(idx / size), c = idx % size;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`row ${r + 1} col ${c + 1}`}
                data-cell-idx={idx}
                onPointerDown={(e) => onCellPointerDown(idx, e)}
                disabled={done}
                className="bg-transparent"
                style={{
                  touchAction: "none",
                  borderRight: c < size - 1 ? "1px dashed #232323" : "none",
                  borderBottom: r < size - 1 ? "1px dashed #232323" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Path overlay — two-tone stripe in SVG so corners are continuous. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {path.length >= 2 ? (
            <>
              {/* Outer (darker, wider) */}
              <polyline
                points={polyPoints}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="0.72"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Inner (brighter, narrower) */}
              <polyline
                points={polyPoints}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          ) : null}
          {/* Head dot — emphasises the active end of the snake. Hidden on
              checkpoint cells since the checkpoint badge already marks them. */}
          {!checkpointAt[headIdx] ? (
            <circle
              cx={headC + 0.5}
              cy={headR + 0.5}
              r="0.18"
              fill="#60a5fa"
              stroke="#1e3a8a"
              strokeWidth="0.06"
            />
          ) : null}
          {/* Single-cell starting state: no polyline, just a faint marker so
              the player sees where checkpoint 1 sits. */}
          {path.length === 1 && !checkpointAt[headIdx] ? null : null}
        </svg>

        {/* Checkpoints layer — black circles with white numbers, on top of
            both the path stripe and the cell grid. */}
        <div className="pointer-events-none absolute inset-0">
          {puzzle.checkpoints.slice(1).map((cellIdx, i) => {
            const cpNum = i + 1;
            const r = Math.floor(cellIdx / size);
            const c = cellIdx % size;
            const cellPct = 100 / size;
            return (
              <div
                key={cpNum}
                className="absolute flex items-center justify-center"
                style={{
                  top: `${r * cellPct}%`,
                  left: `${c * cellPct}%`,
                  width: `${cellPct}%`,
                  height: `${cellPct}%`,
                }}
              >
                <span className="grid h-[60%] w-[60%] place-items-center rounded-full bg-[#0a0a0a] text-xs font-black text-white shadow-[0_0_0_2px_rgba(255,255,255,0.85)]">
                  {cpNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!history.length || done}
          className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-5 py-2 text-sm hover:bg-[#222] disabled:opacity-40"
        >
          {t("undo")}
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft <= 0 || done}
          className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-5 py-2 text-sm hover:bg-[#222] disabled:opacity-40"
        >
          {t("hint")} ({hintsLeft})
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-5 py-2 text-sm hover:bg-[#222]"
        >
          {t("reset")}
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold hover:opacity-90"
        >
          {t("new_game")}
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">
        {t("best_time")}: <span className="font-mono text-gray-300">{bestSeconds ? `${bestSeconds}s` : "—"}</span>
      </p>

      {done ? (
        <>
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="font-bold text-emerald-200">{t("solved")}</p>
            <p className="mt-1 text-emerald-100">
              {t("your_time")}: <span className="font-mono">{elapsed}s</span>
            </p>
            {!submitted && eligibleToSubmit ? (
              <div className="mt-3 flex gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t("name_gate_placeholder")}
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
                />
                <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">{t("submit")}</button>
              </div>
            ) : null}
            {submitted ? (
              <p className="mt-2 text-sm text-emerald-300">{t("you_ranked", { rank: submitted.rank })}</p>
            ) : null}
            {!eligibleToSubmit && !submitted ? (
              <p className="mt-3 text-xs text-amber-300">
                {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
              </p>
            ) : null}
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
          type="button"
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1.5 capitalize ${value === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"}`}
        >
          {t(d)}
        </button>
      ))}
    </div>
  );
}
