"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getName, submitScore } from "@/lib/scores";
import { dayIndex } from "@/lib/dailyWord";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import ScoreEndLeaderboard from "@/components/ScoreEndLeaderboard";
import HowToPlay from "@/components/HowToPlay";
import CrossPromoCard from "@/components/CrossPromoCard";
import GameWinModal, { WinActions } from "@/components/GameWinModal";
import { useLocale } from "@/lib/i18n";

const W = 10;
const H = 20;

type Shape = number[][]; // 0/1 grid
type Piece = { shape: Shape; color: string; name: string };

const PIECES: Piece[] = [
  { name: "I", color: "#22d3ee", shape: [[1,1,1,1]] },
  { name: "O", color: "#fbbf24", shape: [[1,1],[1,1]] },
  { name: "T", color: "#c084fc", shape: [[0,1,0],[1,1,1]] },
  { name: "S", color: "#34d399", shape: [[0,1,1],[1,1,0]] },
  { name: "Z", color: "#fb7185", shape: [[1,1,0],[0,1,1]] },
  { name: "J", color: "#60a5fa", shape: [[1,0,0],[1,1,1]] },
  { name: "L", color: "#fb923c", shape: [[0,0,1],[1,1,1]] },
];

type Cell = { color: string } | null;

function rotate(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const out: Shape = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}

function newBoard(): Cell[][] {
  return Array.from({ length: H }, () => Array<Cell>(W).fill(null));
}

function randomBag(): Piece[] {
  const order = [...PIECES];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function fits(board: Cell[][], shape: Shape, x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = y + r;
      const nc = x + c;
      if (nc < 0 || nc >= W || nr >= H) return false;
      if (nr >= 0 && board[nr][nc]) return false;
    }
  }
  return true;
}

function merge(board: Cell[][], piece: Piece, x: number, y: number): Cell[][] {
  const next = board.map((row) => row.slice());
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return;
      const nr = y + r;
      const nc = x + c;
      if (nr >= 0 && nr < H && nc >= 0 && nc < W) next[nr][nc] = { color: piece.color };
    })
  );
  return next;
}

function clearLines(board: Cell[][]): { board: Cell[][]; lines: number } {
  const kept = board.filter((row) => row.some((c) => c === null));
  const lines = H - kept.length;
  const empty: Cell[][] = Array.from({ length: lines }, () => Array<Cell>(W).fill(null));
  return { board: [...empty, ...kept], lines };
}

const LINE_POINTS = [0, 100, 300, 500, 800];

export default function TileDropPage() {
  const { t, locale } = useLocale();
  const [board, setBoard] = useState<Cell[][]>(newBoard);
  const [bag, setBag] = useState<Piece[]>(randomBag);
  const [piece, setPiece] = useState<{ p: Piece; x: number; y: number } | null>(null);
  const [hold, setHold] = useState<Piece | null>(null);
  const [didHold, setDidHold] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const [winModalDismissed, setWinModalDismissed] = useState(false);
  const recordedRef = useRef(false);
  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("tiledrop", todayIdx);

  const tickRef = useRef<number | null>(null);
  const dropMs = useMemo(() => Math.max(80, 800 - (level - 1) * 70), [level]);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem("tiledrop-hi") ?? "0") || 0);
  }, []);

  // Spawn helper.
  const spawn = useCallback((draw?: Piece) => {
    setBag((b) => {
      const queue = b.length < 4 ? [...b, ...randomBag()] : b;
      const next = draw ?? queue[0];
      const start = { p: next, x: Math.floor((W - next.shape[0].length) / 2), y: -1 };
      setPiece((cur) => {
        if (!fits(boardRef.current, next.shape, start.x, start.y)) {
          setOver(true);
          return cur;
        }
        return start;
      });
      setDidHold(false);
      return draw ? queue : queue.slice(1);
    });
  }, []);

  // Refs to avoid stale-closure inside intervals.
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);
  const pieceRef = useRef(piece);
  useEffect(() => { pieceRef.current = piece; }, [piece]);
  const overRef = useRef(over);
  useEffect(() => { overRef.current = over; }, [over]);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Initial spawn.
  useEffect(() => {
    if (!piece && !over) spawn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gravity tick.
  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      if (overRef.current || pausedRef.current) return;
      step(1);
    }, dropMs);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropMs]);

  const lockPiece = useCallback((p: { p: Piece; x: number; y: number }) => {
    // Standard Tetris top-out: if any filled cell of the piece would land
    // above row 0, the board is full for this shape. The vanilla `spawn`
    // check at y=-1 misses this for 1-row pieces (the I-piece) because
    // `fits` skips negative-row cells, so an I could "play" forever on a
    // full board without ever triggering game-over.
    for (let r = 0; r < p.p.shape.length; r++) {
      for (let c = 0; c < p.p.shape[r].length; c++) {
        if (p.p.shape[r][c] && p.y + r < 0) {
          setOver(true);
          setPiece(null);
          return;
        }
      }
    }
    const merged = merge(boardRef.current, p.p, p.x, p.y);
    const { board: cleared, lines: cleared_lines } = clearLines(merged);
    boardRef.current = cleared;
    setBoard(cleared);
    if (cleared_lines > 0) {
      setScore((s) => s + LINE_POINTS[cleared_lines] * Math.max(1, level));
      setLines((l) => {
        const total = l + cleared_lines;
        const lvl = 1 + Math.floor(total / 10);
        setLevel(lvl);
        return total;
      });
    }
    setPiece(null);
    spawn();
  }, [level, spawn]);

  const step = useCallback((dy: number) => {
    const cur = pieceRef.current;
    if (!cur || overRef.current) return false;
    if (fits(boardRef.current, cur.p.shape, cur.x, cur.y + dy)) {
      setPiece({ ...cur, y: cur.y + dy });
      return true;
    }
    if (dy > 0) lockPiece(cur);
    return false;
  }, [lockPiece]);

  const move = useCallback((dx: number) => {
    const cur = pieceRef.current;
    if (!cur || overRef.current) return;
    if (fits(boardRef.current, cur.p.shape, cur.x + dx, cur.y)) setPiece({ ...cur, x: cur.x + dx });
  }, []);

  const rotateNow = useCallback(() => {
    const cur = pieceRef.current;
    if (!cur || overRef.current) return;
    const shape = rotate(cur.p.shape);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (fits(boardRef.current, shape, cur.x + dx, cur.y)) {
        setPiece({ p: { ...cur.p, shape }, x: cur.x + dx, y: cur.y });
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    let cur = pieceRef.current;
    if (!cur || overRef.current) return;
    while (fits(boardRef.current, cur.p.shape, cur.x, cur.y + 1)) cur = { ...cur, y: cur.y + 1 };
    lockPiece(cur);
  }, [lockPiece]);

  const swapHold = useCallback(() => {
    if (didHold) return;
    const cur = pieceRef.current;
    if (!cur || overRef.current) return;
    setDidHold(true);
    setHold((h) => {
      if (!h) {
        setPiece(null);
        spawn();
      } else {
        const p = h;
        setPiece({ p, x: Math.floor((W - p.shape[0].length) / 2), y: -1 });
      }
      return cur.p;
    });
  }, [didHold, spawn]);

  // Keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (overRef.current) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); rotateNow(); }
      else if (e.code === "Space") { e.preventDefault(); hardDrop(); }
      else if (e.key === "c" || e.key === "C") { e.preventDefault(); swapHold(); }
      else if (e.key === "p" || e.key === "P") { setPaused((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hardDrop, move, rotateNow, step, swapHold]);

  // Auto-repeat for the on-screen arrow buttons — without this, the
  // player has to tap-tap-tap to walk a piece across the board. Initial
  // 200ms delay matches the OS-level key-repeat feel; subsequent ticks
  // at 60ms keep it fast enough for a 10-wide board.
  const repeatTimeout = useRef<number | null>(null);
  const repeatInterval = useRef<number | null>(null);

  const stopRepeat = useCallback(() => {
    if (repeatTimeout.current) {
      window.clearTimeout(repeatTimeout.current);
      repeatTimeout.current = null;
    }
    if (repeatInterval.current) {
      window.clearInterval(repeatInterval.current);
      repeatInterval.current = null;
    }
  }, []);

  const startRepeat = useCallback((action: () => void) => {
    stopRepeat();
    action();
    repeatTimeout.current = window.setTimeout(() => {
      repeatInterval.current = window.setInterval(action, 60);
    }, 200);
  }, [stopRepeat]);

  useEffect(() => () => stopRepeat(), [stopRepeat]);

  // Touch / swipe.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current; if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = Date.now() - start.t;
    if (adx < 12 && ady < 12 && dt < 300) { rotateNow(); return; }
    if (adx > ady) { move(dx > 0 ? 1 : -1); }
    else if (dy > 30) { hardDrop(); }
  };

  // High score + submit on game over, gated by the 3-attempt daily cap.
  useEffect(() => {
    if (!over) { recordedRef.current = false; return; }
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("tiledrop-hi", String(score));
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "tiledrop",
        name: getName() || "Anonymous",
        score,
        language: locale,
        meta: { lines, level },
      }).then((r) => r && setSubmitted(r));
    }
  }, [highScore, level, lines, locale, over, record, score, submitted]);

  // Compose render board with active piece + ghost.
  const renderBoard = useMemo(() => {
    const view: Cell[][] = boardRef.current.map((row) => row.slice());
    if (piece) {
      // Ghost.
      let gy = piece.y;
      while (fits(boardRef.current, piece.p.shape, piece.x, gy + 1)) gy++;
      piece.p.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return;
          const nr = gy + r; const nc = piece.x + c;
          if (nr >= 0 && nr < H && nc >= 0 && nc < W && !view[nr][nc]) view[nr][nc] = { color: `${piece.p.color}33` };
        })
      );
      // Active.
      piece.p.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return;
          const nr = piece.y + r; const nc = piece.x + c;
          if (nr >= 0 && nr < H && nc >= 0 && nc < W) view[nr][nc] = { color: piece.p.color };
        })
      );
    }
    return view;
  }, [board, piece]);

  const reset = () => {
    boardRef.current = newBoard();
    setBoard(newBoard());
    setBag(randomBag());
    setHold(null);
    setDidHold(false);
    setPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setOver(false);
    setSubmitted(null);
    setWinModalDismissed(false);
    setTimeout(() => spawn(), 0);
  };

  const next = bag[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 md:pb-6">
      <StreakBanner />
      <HowToPlay game="tiledrop" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">TileDrop</h1>
          <p className="text-xs text-gray-400">
            {t("td_controls")} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (over ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} {t("ranked_label")}
            </span>
          </p>
        </div>
        <div className="flex gap-2 text-sm font-mono">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">★ {score}</span>
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">{t("td_level", { n: level })}</span>
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">{t("td_lines", { n: lines })}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[auto_180px]">
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="mx-auto rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-2">
          <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${W}, 1.6rem)` }}>
            {renderBoard.map((row, r) => row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className="h-6 w-6 rounded-sm"
                style={{ background: cell ? cell.color : "#161616" }}
              />
            )))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">{t("next_number")}</p>
            <Mini shape={next?.shape ?? []} color={next?.color ?? "#fff"} />
          </div>
          <button
            type="button"
            onClick={swapHold}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3 text-left transition hover:border-indigo-400/40 active:scale-[0.99]"
          >
            <p className="text-xs uppercase tracking-wider text-gray-500">{t("td_hold")}</p>
            {hold ? <Mini shape={hold.shape} color={hold.color} /> : <p className="mt-2 text-xs text-gray-600">{t("label_empty")}</p>}
          </button>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3 text-xs text-gray-400">
            {t("td_high_score")}<br /><span className="text-lg font-bold text-white tabular-nums">{highScore}</span>
          </div>
          <button onClick={() => setPaused((p) => !p)} className="w-full rounded-md bg-[#1a1a1a] py-2 text-sm border border-[#2a2a2a]">
            {paused ? t("td_resume") : t("td_pause")}
          </button>
        </aside>
      </div>

      {/* Mobile-only control bar — pinned to the viewport bottom with
          safe-area inset so the iOS home indicator doesn't eat the
          tap target. Arrows auto-repeat on hold (200ms then 60ms);
          rotate fires once per tap. Hard-drop is still available via
          swipe-down over the board. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 gap-2 border-t border-[#2a2a2a] bg-[#0a0a0a]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <button
          type="button"
          aria-label={t("td_move_left")}
          onPointerDown={(e) => { e.preventDefault(); startRepeat(() => move(-1)); }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          className="h-14 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-3xl font-bold leading-none active:bg-[#222] select-none touch-none"
        >
          ←
        </button>
        <button
          type="button"
          aria-label={t("td_rotate")}
          onClick={rotateNow}
          className="h-14 rounded-xl border border-indigo-500/40 bg-indigo-600/20 text-3xl leading-none active:bg-indigo-600/40 select-none touch-none"
        >
          ⟳
        </button>
        <button
          type="button"
          aria-label={t("td_move_right")}
          onPointerDown={(e) => { e.preventDefault(); startRepeat(() => move(1)); }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          className="h-14 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-3xl font-bold leading-none active:bg-[#222] select-none touch-none"
        >
          →
        </button>
      </div>

      {over ? (
        <>
          <ScoreEndLeaderboard
            game="tiledrop"
            playerName={getName()}
            playerScore={score}
            submittedRank={submitted?.rank}
          />
          <EndScreenAddon
            game="tiledrop"
            score={score}
            rank={submitted?.rank}
            meta={{ lines, level }}
          />
          <CrossPromoCard game="tiledrop" />
        </>
      ) : null}

      <GameWinModal
        open={over && !winModalDismissed}
        onClose={() => setWinModalDismissed(true)}
        title={t("td_game_over", { score })}
        status="win"
      >
        <p className="mt-2 text-sm text-gray-300">
          {t("td_lines", { n: lines })} · {t("td_level", { n: level })}
        </p>
        {submitted ? (
          <p className="mt-3 text-sm text-emerald-300">
            <span className="font-bold">{getName() || "Anonymous"}</span> · {t("you_ranked", { rank: submitted.rank })}
          </p>
        ) : null}
        {!eligibleToSubmit && !submitted ? (
          <p className="mt-3 text-xs text-amber-300">
            {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
          </p>
        ) : null}
        <WinActions>
          <button
            onClick={() => { reset(); setWinModalDismissed(true); }}
            className="min-h-[44px] flex-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-bold hover:opacity-90"
          >
            {t("win_play_again")}
          </button>
        </WinActions>
      </GameWinModal>
    </div>
  );
}

function Mini({ shape, color }: { shape: number[][]; color: string }) {
  if (!shape.length) return null;
  const cols = shape[0].length;
  return (
    <div className="mt-2 grid w-fit gap-px" style={{ gridTemplateColumns: `repeat(${cols}, 1rem)` }}>
      {shape.flatMap((row, r) => row.map((v, c) => (
        <div key={`${r}-${c}`} className="h-4 w-4 rounded-sm" style={{ background: v ? color : "transparent" }} />
      )))}
    </div>
  );
}
