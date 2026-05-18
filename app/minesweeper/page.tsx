"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import TimeEndLeaderboard from "@/components/TimeEndLeaderboard";
import ShareButton from "@/components/ShareButton";
import { useLocale } from "@/lib/i18n";
import {
  chordTargets,
  floodReveal,
  generateMinesweeper,
  type MinesweeperBoard,
} from "@/lib/games/minesweeper";
import { dayIndex } from "@/lib/games/kronen";
import { getName, submitScore } from "@/lib/scores";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";

type Difficulty = "easy" | "medium" | "hard";

// All three difficulties use the same grid on every device so the daily
// leaderboard is fair. Hard caps at 14×14 (not the classic 16×30) because
// a 30-column board does not fit a 360px portrait phone.
const GRID_FOR: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 12, cols: 12, mines: 25 },
  hard:   { rows: 14, cols: 14, mines: 40 },
};
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const BEST_KEY = (d: Difficulty) => `brainarena-minesweeper-best-${d}`;
const LONG_PRESS_MS = 400;

type GameState = "idle" | "playing" | "won" | "lost";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MinesweeperPage() {
  const { t, locale } = useLocale();

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [board, setBoard] = useState<MinesweeperBoard | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set());
  const [state, setState] = useState<GameState>("idle");
  const [explodedAt, setExplodedAt] = useState<number | null>(null);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("minesweeper", todayIdx, difficulty);

  // Pointer-mode detection. `pointer: coarse` matches devices whose primary
  // input is a finger or stylus (phones, tablets). We use this to choose
  // between long-press-to-flag (touch) and right-click-to-flag (mouse),
  // following each platform's native paradigm.
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const seed = useMemo(
    () => dayIndex() * 2017 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  // Reset everything on difficulty / new-game. Board itself is *not*
  // generated yet — we delay generation until the player's first click so
  // we can guarantee that click lands on a safe cell.
  useEffect(() => {
    setBoard(null);
    setRevealed(new Set());
    setFlagged(new Set());
    setState("idle");
    setExplodedAt(null);
    setElapsed(0);
    setNewBest(false);
    setSubmitted(null);
    setEligibleToSubmit(false);
    startedAt.current = null;
  }, [difficulty, seed]);

  // Submit to leaderboard on win, gated by the 3-attempt daily cap (per
  // difficulty since each difficulty is a separate puzzle stream). Losses
  // do not count toward ranked but still increment the attempt counter
  // below — otherwise a player could blow up 100 boards then hand-pick
  // their best win.
  useEffect(() => {
    if (state !== "won" && state !== "lost") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    if (state === "won") {
      setEligibleToSubmit(shouldSubmit);
      if (shouldSubmit && !submitted) {
        submitScore({
          game: "minesweeper",
          name: getName() || "Anonymous",
          score: Math.max(1, 100000 - elapsed),
          time: elapsed,
          language: locale,
          meta: { difficulty, won: true, flagsPlaced: flagged.size, mineCount: GRID_FOR[difficulty].mines },
        }).then((r) => r && setSubmitted(r));
      }
    }
  }, [state, elapsed, difficulty, flagged.size, locale, record, submitted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = safeGetItem(BEST_KEY(difficulty));
    setBestSeconds(raw ? Number(raw) : null);
  }, [difficulty]);

  useEffect(() => {
    if (state !== "playing") return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const total = GRID_FOR[difficulty].rows * GRID_FOR[difficulty].cols;
  const safeTarget = total - GRID_FOR[difficulty].mines;

  const revealCells = useCallback((b: MinesweeperBoard, idx: number) => {
    if (b.mines.has(idx)) {
      // Direct mine click — game over, reveal all mines.
      setRevealed(() => new Set(b.mines));
      setExplodedAt(idx);
      setState("lost");
      return;
    }
    const flood = floodReveal(b, idx);
    setRevealed((prev) => {
      const next = new Set(prev);
      for (const i of flood) next.add(i);
      // Win check: all non-mine cells revealed.
      if (next.size >= safeTarget) {
        const tt = startedAt.current
          ? Math.floor((Date.now() - startedAt.current) / 1000)
          : elapsed;
        setElapsed(tt);
        setState("won");
        {
          const prevBest = Number(safeGetItem(BEST_KEY(difficulty)) ?? "");
          if (!prevBest || tt < prevBest) {
            safeSetItem(BEST_KEY(difficulty), String(tt));
            setBestSeconds(tt);
            setNewBest(true);
          }
        }
      }
      return next;
    });
  }, [difficulty, elapsed, safeTarget]);

  const reveal = useCallback((idx: number) => {
    if (state === "won" || state === "lost") return;
    if (flagged.has(idx)) return;
    // First-click: generate the board now, with this cell forced safe.
    let b = board;
    if (!b) {
      const { rows, cols, mines } = GRID_FOR[difficulty];
      b = generateMinesweeper(rows, cols, mines, seed, idx);
      setBoard(b);
      startedAt.current = Date.now();
      setState("playing");
    }
    if (revealed.has(idx)) {
      // Chord-click on a revealed numbered cell.
      const targets = chordTargets(b, idx, flagged);
      if (!targets || targets.length === 0) return;
      // If any target is a mine, the player loses (they flagged wrong).
      for (const tgt of targets) {
        if (b.mines.has(tgt)) {
          setRevealed(() => new Set(b!.mines));
          setExplodedAt(tgt);
          setState("lost");
          return;
        }
      }
      const newReveal = new Set(revealed);
      for (const tgt of targets) {
        if (newReveal.has(tgt)) continue;
        const flood = floodReveal(b, tgt);
        for (const i of flood) newReveal.add(i);
      }
      setRevealed(newReveal);
      if (newReveal.size >= safeTarget) {
        const tt = startedAt.current
          ? Math.floor((Date.now() - startedAt.current) / 1000)
          : elapsed;
        setElapsed(tt);
        setState("won");
        {
          const prevBest = Number(safeGetItem(BEST_KEY(difficulty)) ?? "");
          if (!prevBest || tt < prevBest) {
            safeSetItem(BEST_KEY(difficulty), String(tt));
            setBestSeconds(tt);
            setNewBest(true);
          }
        }
      }
      return;
    }
    revealCells(b, idx);
  }, [board, difficulty, elapsed, flagged, revealCells, revealed, safeTarget, seed, state]);

  const toggleFlag = useCallback((idx: number) => {
    if (state === "won" || state === "lost") return;
    if (revealed.has(idx)) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, [revealed, state]);

  // Touch handlers — long-press flags, short tap reveals.
  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onCellPointerDown = useCallback((idx: number) => {
    if (!isTouch) return;
    longPressFired.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      longPressTimer.current = null;
      toggleFlag(idx);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(40); } catch { /* ignore */ }
      }
    }, LONG_PRESS_MS);
  }, [clearLongPress, isTouch, toggleFlag]);

  const onCellPointerUp = useCallback((idx: number) => {
    if (!isTouch) return;
    if (longPressTimer.current) {
      clearLongPress();
      reveal(idx);
    }
    // else long-press already fired — nothing more to do
  }, [clearLongPress, isTouch, reveal]);

  const onCellPointerLeave = useCallback(() => {
    if (!isTouch) return;
    clearLongPress();
  }, [clearLongPress, isTouch]);

  const onCellClick = useCallback((idx: number) => {
    if (isTouch) return; // handled via pointer events
    reveal(idx);
  }, [isTouch, reveal]);

  const onCellContextMenu = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (isTouch) return;
    toggleFlag(idx);
  }, [isTouch, toggleFlag]);

  const onNewGame = useCallback(() => setSeedNonce((n) => n + 1), []);
  const onReset = useCallback(() => {
    setBoard(null);
    setRevealed(new Set());
    setFlagged(new Set());
    setState("idle");
    setExplodedAt(null);
    setElapsed(0);
    startedAt.current = null;
  }, []);

  const { rows, cols, mines: mineCount } = GRID_FOR[difficulty];
  const flagsLeft = mineCount - flagged.size;
  const done = state === "won" || state === "lost";
  const hintControl = isTouch ? t("minesweeper_hint_touch") : t("minesweeper_hint_mouse");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="minesweeper" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_minesweeper")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_minesweeper_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span> ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
        <span>
          🚩 <span className="font-mono">{flagsLeft}</span> / {mineCount}
        </span>
        <span className="text-gray-500">{hintControl}</span>
      </div>

      {state === "won" ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-center text-sm font-bold text-emerald-200">
          ✓ {t("solved")}
          <p className="mt-1 text-sm font-normal text-white">
            {t("minesweeper_solved_in", { time: formatDuration(elapsed) })}
          </p>
        </div>
      ) : state === "lost" ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-rose-500/60 bg-rose-500/15 px-3 py-2 text-center text-sm font-bold text-rose-100">
          💥 {t("minesweeper_lost")}
        </div>
      ) : null}

      <MinesweeperGrid
        rows={rows}
        cols={cols}
        board={board}
        revealed={revealed}
        flagged={flagged}
        explodedAt={explodedAt}
        done={done}
        onCellPointerDown={onCellPointerDown}
        onCellPointerUp={onCellPointerUp}
        onCellPointerLeave={onCellPointerLeave}
        onCellClick={onCellClick}
        onCellContextMenu={onCellContextMenu}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold hover:opacity-90"
          >
            {t("new_game")}
          </button>
          <button
            type="button"
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

      {state === "won" ? (
        <>
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="font-bold text-emerald-200">{t("solved")}</p>
            <p className="mt-1 text-emerald-100">
              {t("your_time")}: <span className="font-mono">{formatDuration(elapsed)}</span>
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
              game="minesweeper"
              playerName={getName()}
              playerTime={elapsed}
              submittedRank={submitted?.rank}
              playerEligible={eligibleToSubmit}
              metaFilter={(e) =>
                (e.meta as { difficulty?: string } | undefined)?.difficulty === difficulty
              }
            />
          </div>
          <EndScreenAddon
            game="minesweeper"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, flagsPlaced: flagged.size, mineCount }}
          />
        </>
      ) : null}

      {state === "won" ? (
        <WinModal
          elapsed={elapsed}
          flagsPlaced={flagged.size}
          mineCount={mineCount}
          difficulty={difficulty}
          bestSeconds={bestSeconds}
          isNewBest={newBest}
          onPlayAgain={onReset}
          onNewPuzzle={onNewGame}
        />
      ) : null}
    </div>
  );
}

function WinModal({
  elapsed,
  flagsPlaced,
  mineCount,
  difficulty,
  bestSeconds,
  isNewBest,
  onPlayAgain,
  onNewPuzzle,
}: {
  elapsed: number;
  flagsPlaced: number;
  mineCount: number;
  difficulty: string;
  bestSeconds: number | null;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onNewPuzzle: () => void;
}) {
  const { t } = useLocale();

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
          <dd className="text-right font-mono text-white">{formatDuration(elapsed)}</dd>
          <dt className="text-gray-400">{t("minesweeper_flags_placed")}</dt>
          <dd className="text-right font-mono text-white">{flagsPlaced} / {mineCount}</dd>
          <dt className="text-gray-400">{t("win_best_time")}</dt>
          <dd className="text-right font-mono text-white">{bestSeconds != null ? formatDuration(bestSeconds) : "—"}</dd>
        </dl>
        {isNewBest ? (
          <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-sm font-bold text-amber-300">
            ★ {t("win_new_record")}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="min-h-[44px] flex-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold"
          >
            {t("win_play_again")}
          </button>
          <button
            type="button"
            onClick={onNewPuzzle}
            className="min-h-[44px] flex-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-bold hover:opacity-90"
          >
            {t("win_new_puzzle")}
          </button>
          <ShareButton
            game="minesweeper"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, flagsPlaced, mineCount }}
            label={t("win_share")}
            className="min-h-[44px] flex-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

const NUMBER_COLOUR = [
  "",            // 0 — no text
  "text-sky-400",
  "text-emerald-400",
  "text-rose-400",
  "text-indigo-400",
  "text-amber-500",
  "text-cyan-300",
  "text-pink-300",
  "text-gray-300",
];

function MinesweeperGrid({
  rows,
  cols,
  board,
  revealed,
  flagged,
  explodedAt,
  done,
  onCellPointerDown,
  onCellPointerUp,
  onCellPointerLeave,
  onCellClick,
  onCellContextMenu,
}: {
  rows: number;
  cols: number;
  board: MinesweeperBoard | null;
  revealed: Set<number>;
  flagged: Set<number>;
  explodedAt: number | null;
  done: boolean;
  onCellPointerDown: (idx: number) => void;
  onCellPointerUp: (idx: number) => void;
  onCellPointerLeave: () => void;
  onCellClick: (idx: number) => void;
  onCellContextMenu: (e: React.MouseEvent, idx: number) => void;
}) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const isRevealed = revealed.has(idx);
      const isFlagged = flagged.has(idx);
      const adjValue = board ? board.adj[idx] : 0;
      const isMine = board ? board.mines.has(idx) : false;
      const isExploded = explodedAt === idx;

      let label = "";
      if (isRevealed && isMine) label = "mine";
      else if (isRevealed && adjValue > 0) label = String(adjValue);

      cells.push(
        <button
          key={idx}
          type="button"
          aria-label={`row ${r + 1} col ${c + 1}${isFlagged ? ", flagged" : ""}${isRevealed ? ", " + (isMine ? "mine" : `${adjValue}`) : ""}`}
          disabled={done && !isRevealed && !isFlagged && !isMine}
          onPointerDown={() => onCellPointerDown(idx)}
          onPointerUp={() => onCellPointerUp(idx)}
          onPointerLeave={onCellPointerLeave}
          onPointerCancel={onCellPointerLeave}
          onClick={() => onCellClick(idx)}
          onContextMenu={(e) => onCellContextMenu(e, idx)}
          className={`relative aspect-square select-none touch-none transition active:scale-[0.97] flex items-center justify-center text-xs sm:text-sm font-bold ${
            isRevealed
              ? isMine
                ? isExploded
                  ? "bg-rose-600/70 border border-rose-400/80"
                  : "bg-rose-500/30 border border-rose-500/50"
                : "bg-[#0e0e15] border border-[#1f1f28]"
              : "bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222]"
          } ${NUMBER_COLOUR[Math.max(0, adjValue)] ?? ""}`}
          style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
        >
          {isRevealed && isMine ? (
            <MineIcon />
          ) : isRevealed && adjValue > 0 ? (
            label
          ) : isFlagged ? (
            <FlagIcon />
          ) : null}
        </button>
      );
    }
  }

  return (
    <div
      className="mx-auto mt-4 grid gap-px rounded-md bg-[#2a2a2a] p-px"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
      <path d="M6 21V4h12l-2 4 2 4H8v9z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" strokeLinejoin="round" />
      <rect x="5" y="3" width="2" height="19" fill="#3f3f46" />
    </svg>
  );
}

function MineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden="true">
      <g stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
        <line x1="5.6" y1="18.4" x2="18.4" y2="5.6" />
      </g>
      <circle cx="12" cy="12" r="5.5" fill="#0a0a0a" stroke="#1f2937" strokeWidth="1" />
      <circle cx="10" cy="10" r="1.2" fill="#9ca3af" />
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
