"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import TimeEndLeaderboard from "@/components/TimeEndLeaderboard";
import CrossPromoCard from "@/components/CrossPromoCard";
import { useLocale } from "@/lib/i18n";
import { generateVlakken, type VlakkenPuzzle, type AnchorMode } from "@/lib/games/vlakken";
import { dayIndex } from "@/lib/games/kronen";
import { getName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

type Difficulty = "easy" | "medium" | "hard";
// LinkedIn-Patches-sized grids: easy 5×5 matches LinkedIn directly, medium
// 6×6 scales up cleanly, hard 8×8 keeps challenge without dropping into
// the 7×7 trap where the {3,4,6,9} dim set always leaves a 1×2 corner
// remainder that greedy tiling can't fill — which surfaced as an empty
// hard board ("leeg") in production.
const SIZE_FOR: Record<Difficulty, number> = { easy: 5, medium: 6, hard: 8 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
// Number of anchors hidden ("?"-style) per difficulty. The generator only
// applies a hide-set that keeps the puzzle uniquely solvable, so on rare
// hard puzzles you may end up with one hidden anchor instead of two.
const HIDE_FOR: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
// Probability that a non-square anchor is downgraded to "any" mode, i.e.
// rendered as a dashed badge that hides its orientation. Higher = more
// anchors withhold the w:h hint, forcing the player to deduce direction
// from the rest of the board. easy keeps most anchors hinted; medium
// withholds half; hard hides nearly all so the puzzle reads like LinkedIn
// Patches where direction is never given away.
const FLEX_FOR: Record<Difficulty, number> = { easy: 0.3, medium: 0.6, hard: 0.85 };
const BEST_KEY = (d: Difficulty) => `brainarena-vlakken-best-${d}`;

// LinkedIn-Patches-style pastel palette: muted enough that filled rects sit
// behind the player's eye, vivid enough to distinguish adjacent shapes.
const VLAKKEN_PALETTE = [
  "#f4a8a8", // coral
  "#f7c08a", // peach
  "#f5d97a", // soft yellow
  "#a8d99b", // sage
  "#9bd1c8", // mint
  "#a8c8e8", // sky
  "#c4a8e0", // lavender
  "#e8a8c4", // rose
  "#c8c8c8", // warm grey
  "#d4c97a", // olive
  "#e8b87a", // terracotta
  "#9bbfd1", // dusty blue
];

type Rect = { topLeft: number; w: number; h: number };
type AnchorState = { rect: Rect; locked: boolean };
type DragState = { startCell: number; currentCell: number; pointerId: number; startedAt: number };

// An interaction that's BOTH a single cell (no movement) AND released
// within this many ms is treated as an accidental tap — we silently
// clear it without running validation, so the player doesn't get
// scolded by a "no seed" tooltip for what was really just a fumble
// touch. Any drag that moves between cells, OR a press held longer
// than this on a single cell, is treated as deliberate and gets full
// validation feedback. (Previously this was a flat 3-second window on
// ALL drags, which silently swallowed real adjustment attempts on
// mobile — typical mobile drags are 200-800ms, so the player would
// drag, miss the anchor seed hidden under the placed rect, and see
// nothing happen — reading as "locked, can't adjust".)
const ACCIDENTAL_TAP_MS = 250;
type ErrorState = { msg: string; anchorIdx: number | null };

export default function VlakkenPage() {
  const { t, locale } = useLocale();

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seedNonce, setSeedNonce] = useState(0);
  const [puzzle, setPuzzle] = useState<VlakkenPuzzle | null>(null);
  // States keyed by anchor index. Locked entries are correct & immutable; non-
  // locked entries are the player's most recent attempt (kept on screen so
  // they can see what was wrong before re-dragging).
  const [states, setStates] = useState<Record<number, AnchorState>>({});
  const [history, setHistory] = useState<Array<Record<number, AnchorState>>>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS_FOR.easy);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("vlakken", todayIdx, difficulty);

  const seed = useMemo(
    () => dayIndex() * 1303 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateVlakken(size, seed, FLEX_FOR[difficulty], HIDE_FOR[difficulty]);
    setPuzzle(p);
    setStates({});
    setHistory([]);
    setHintsLeft(HINTS_FOR[difficulty]);
    setElapsed(0);
    setDone(false);
    setError(null);
    setDrag(null);
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
        game: "vlakken",
        name: getName() || "Anonymous",
        score: Math.max(1, 100000 - elapsed),
        time: elapsed,
        language: locale,
        meta: { difficulty, hintsUsed: HINTS_FOR[difficulty] - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, elapsed, difficulty, hintsLeft, locale, record, submitted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = safeGetItem(BEST_KEY(difficulty));
    setBestSeconds(raw ? Number(raw) : null);
  }, [difficulty]);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => () => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
  }, []);

  const showError = useCallback((msg: string, anchorIdx: number | null = null) => {
    setError({ msg, anchorIdx });
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), 5000);
  }, []);

  function persistBest(time: number) {
    const prevBest = Number(safeGetItem(BEST_KEY(difficulty)) ?? "");
    if (!prevBest || time < prevBest) {
      safeSetItem(BEST_KEY(difficulty), String(time));
      setBestSeconds(time);
    }
  }

  const dragRect: Rect | null = useMemo(() => {
    if (!drag || !puzzle) return null;
    const size = puzzle.size;
    const r1 = Math.floor(drag.startCell / size), c1 = drag.startCell % size;
    const r2 = Math.floor(drag.currentCell / size), c2 = drag.currentCell % size;
    const top = Math.min(r1, r2), left = Math.min(c1, c2);
    return {
      topLeft: top * size + left,
      w: Math.abs(c2 - c1) + 1,
      h: Math.abs(r2 - r1) + 1,
    };
  }, [drag, puzzle]);

  const finishDrag = useCallback(
    (start: number, end: number, dragStartedAt: number) => {
      if (!puzzle || done) return;
      // Only true fumble-touches are silenced: single cell (finger
      // never moved between cells) AND released almost immediately.
      // Multi-cell drags and long holds are deliberate gestures and
      // always get validation feedback — critical on mobile, where a
      // typical adjustment drag is ~300ms and the player has no other
      // way to know whether their gesture registered.
      const accidentalTap =
        start === end && Date.now() - dragStartedAt < ACCIDENTAL_TAP_MS;
      const size = puzzle.size;
      const r1 = Math.floor(start / size), c1 = start % size;
      const r2 = Math.floor(end / size), c2 = end % size;
      const top = Math.min(r1, r2), left = Math.min(c1, c2);
      const w = Math.abs(c2 - c1) + 1;
      const h = Math.abs(r2 - r1) + 1;
      const topLeft = top * size + left;

      const cells: number[] = [];
      for (let r = top; r < top + h; r++) for (let c = left; c < left + w; c++) cells.push(r * size + c);
      const cellSet = new Set(cells);

      // LinkedIn-Patches flexibility: any drag can replace any existing
      // rect, even a locked one. Conflicting placements get cleared further
      // down. The player keeps full freedom to redraw at any time until the
      // whole tiling is valid.
      const seedsInBox = puzzle.anchors
        .map((a, i) => ({ ...a, anchorIdx: i }))
        .filter((a) => cellSet.has(a.idx));

      if (seedsInBox.length === 0) {
        if (accidentalTap) return;
        showError(t("vlakken_err_no_seed"));
        return;
      }
      if (seedsInBox.length > 1) {
        if (accidentalTap) return;
        showError(t("vlakken_err_multi_seed"));
        return;
      }

      const target = seedsInBox[0];
      if (!startedAt.current) startedAt.current = Date.now();

      // Snapshot for undo.
      setHistory((h) => [...h, states]);

      // Clear any other anchor's attempt that overlaps these cells, locked
      // or not. Replacing a locked rect is intentional — the player may
      // have "locked" a wrong-but-locally-valid placement that conflicts
      // with the final tiling.
      const newStates: Record<number, AnchorState> = { ...states };
      for (const k of Object.keys(newStates)) {
        const aIdx = Number(k);
        if (aIdx === target.anchorIdx) continue;
        const st = newStates[aIdx];
        const tt = Math.floor(st.rect.topLeft / size), ll = st.rect.topLeft % size;
        let overlaps = false;
        for (let r = 0; r < st.rect.h && !overlaps; r++) {
          for (let c = 0; c < st.rect.w && !overlaps; c++) {
            if (cellSet.has((tt + r) * size + ll + c)) overlaps = true;
          }
        }
        if (overlaps) delete newStates[aIdx];
      }

      const placedSize = w * h;
      let valid = false;
      let errMsg: string | null = null;
      if (target.hidden) {
        // Hidden anchors carry no size/mode info, so the only valid
        // placement is the one that matches the embedded solution.
        const truth = puzzle.rects[target.anchorIdx];
        valid = topLeft === truth.topLeft && w === truth.width && h === truth.height;
        if (!valid) errMsg = t("vlakken_err_hidden_wrong");
      } else {
        const sizeOk = placedSize === target.size;
        const modeOk = sizeOk && modeMatches(w, h, target.mode);
        valid = sizeOk && modeOk;
        if (!sizeOk) errMsg = `${t("vlakken_err_size")} ${placedSize}/${target.size}`;
        else if (!modeOk) errMsg = modeErrorFor(t, target.mode);
      }

      // Accidental taps that happen to hit a seed cell but don't match
      // the required size/mode are silenced too — otherwise a stray
      // poke on the puzzle leaves a ghost rect on screen.
      if (errMsg && accidentalTap) return;

      newStates[target.anchorIdx] = {
        rect: { topLeft, w, h },
        locked: valid,
      };
      setStates(newStates);

      if (errMsg) {
        showError(errMsg, target.anchorIdx);
        return;
      }

      // Correct lock: clear error, check win.
      setError(null);
      const lockedCount = Object.values(newStates).filter((s) => s.locked).length;
      if (lockedCount === puzzle.anchors.length) {
        setDone(true);
        const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
        setElapsed(tt);
        persistBest(tt);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puzzle, states, t, done, elapsed, showError]
  );

  // Refs let the document-level handlers always read the latest drag state
  // without needing to re-attach listeners on every move event.
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => { dragRef.current = drag; }, [drag]);
  const finishDragRef = useRef(finishDrag);
  useEffect(() => { finishDragRef.current = finishDrag; }, [finishDrag]);

  const onCellPointerDown = useCallback(
    (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
      if (done) return;
      e.preventDefault();
      // Clear any sticky error from a previous failed attempt the moment
      // the player starts a new drag — the tooltip + its dismiss button
      // hovering over the grid made re-dragging feel blocked, even though
      // the cells underneath were technically still interactive. The
      // 5s auto-dismiss timer also gets cancelled so it can't reopen
      // the tooltip mid-drag.
      setError(null);
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      setDrag({ startCell: idx, currentCell: idx, pointerId: e.pointerId, startedAt: Date.now() });
    },
    [done]
  );

  // Mount document-level listeners only while a drag is active. Using
  // document is more robust than pointer-capture when the cursor leaves the
  // grid (especially with mouse + button release outside the viewport).
  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = target instanceof Element ? target.closest("[data-cell-idx]") : null;
      if (!cellEl) return;
      const raw = (cellEl as HTMLElement).dataset.cellIdx;
      const idx = raw ? Number(raw) : NaN;
      if (Number.isFinite(idx) && idx !== cur.currentCell) {
        setDrag({ ...cur, currentCell: idx });
      }
    };
    const handleUp = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      setDrag(null);
      // Always run finishDrag — a valid placement locks immediately
      // regardless of how long the player held. Only true single-cell
      // fumble-taps are silenced on the invalid path (see
      // ACCIDENTAL_TAP_MS inside finishDrag); the player isn't
      // penalised for being fast when they got it right.
      finishDragRef.current(cur.startCell, cur.currentCell, cur.startedAt);
    };
    const handleCancel = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      setDrag(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleCancel);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleCancel);
    };
  }, [isDragging]);

  const onUndo = useCallback(() => {
    if (done) return;
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setStates(prev);
      return h.slice(0, -1);
    });
    setError(null);
  }, [done]);

  const onHint = useCallback(() => {
    if (done || !puzzle || hintsLeft <= 0) return;
    // Pick a not-yet-locked anchor and lock it with its solution rect.
    const candidates = puzzle.anchors
      .map((a, i) => ({ a, i }))
      .filter(({ i }) => !states[i]?.locked);
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const rect = puzzle.rects[pick.i];
    const newStates = { ...states };
    // Clear non-locked attempts that overlap the hint rect.
    const size = puzzle.size;
    const top = Math.floor(rect.topLeft / size), left = rect.topLeft % size;
    const cellSet = new Set<number>();
    for (let r = 0; r < rect.height; r++) for (let c = 0; c < rect.width; c++) cellSet.add((top + r) * size + left + c);
    for (const k of Object.keys(newStates)) {
      const aIdx = Number(k);
      const st = newStates[aIdx];
      if (st.locked) continue;
      const tt = Math.floor(st.rect.topLeft / size), ll = st.rect.topLeft % size;
      let overlaps = false;
      for (let r = 0; r < st.rect.h && !overlaps; r++) {
        for (let c = 0; c < st.rect.w && !overlaps; c++) {
          if (cellSet.has((tt + r) * size + ll + c)) overlaps = true;
        }
      }
      if (overlaps) delete newStates[aIdx];
    }
    newStates[pick.i] = {
      rect: { topLeft: rect.topLeft, w: rect.width, h: rect.height },
      locked: true,
    };
    if (!startedAt.current) startedAt.current = Date.now();
    setHistory((h) => [...h, states]);
    setStates(newStates);
    setHintsLeft((h) => h - 1);
    setError(null);

    const lockedCount = Object.values(newStates).filter((s) => s.locked).length;
    if (lockedCount === puzzle.anchors.length) {
      setDone(true);
      const tt = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsed;
      setElapsed(tt);
      persistBest(tt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, states, hintsLeft, done, elapsed]);

  const onReset = useCallback(() => {
    if (!puzzle) return;
    setStates({});
    setHistory([]);
    setDone(false);
    setElapsed(0);
    setError(null);
    setDrag(null);
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
  // Every drag is permitted — overlaps simply replace existing rects, so
  // the drag overlay is always rendered as a positive selection.
  const dragValid = true;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="vlakken" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_vlakken")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_vlakken_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span> ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-3 text-xs text-gray-500">{t("vlakken_drag_hint")}</p>

      {/* Grid wrapper — base cells render the empty/dashed look + anchor seeds.
          Rect overlays (locked + attempt + drag) layer on top. */}
      <div
        ref={gridRef}
        className="relative mx-auto mt-4 aspect-square w-full overflow-hidden rounded-md border border-[#2a2a2a] bg-[#0e0e0e] touch-none select-none"
      >
        <div
          className="grid h-full w-full"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap: 0 }}
        >
          {Array.from({ length: size * size }, (_, idx) => {
            const r = Math.floor(idx / size), c = idx % size;
            const anchorIdx = puzzle.anchors.findIndex((a) => a.idx === idx);
            const anchor = anchorIdx >= 0 ? puzzle.anchors[anchorIdx] : null;
            return (
              <button
                key={idx}
                type="button"
                data-cell-idx={idx}
                onPointerDown={(e) => onCellPointerDown(idx, e)}
                disabled={done}
                className="relative flex items-start justify-start"
                style={{
                  touchAction: "none",
                  borderRight: c < size - 1 ? "1px dashed #232323" : "none",
                  borderBottom: r < size - 1 ? "1px dashed #232323" : "none",
                }}
              >
                {anchor ? <AnchorSeed anchor={anchor} colorIdx={anchorIdx} /> : null}
              </button>
            );
          })}
        </div>

        {/* Overlay layer — pointer-events:none lets drag pass through to cells */}
        <div className="pointer-events-none absolute inset-0">
          {Object.entries(states).map(([k, st]) => {
            const aIdx = Number(k);
            return (
              <RectOverlay
                key={aIdx}
                rect={st.rect}
                size={size}
                color={VLAKKEN_PALETTE[aIdx % VLAKKEN_PALETTE.length]}
                locked={st.locked}
                won={done}
              />
            );
          })}
          {dragRect ? <DragOverlay rect={dragRect} valid={dragValid} size={size} /> : null}
          {error && error.anchorIdx != null && states[error.anchorIdx] ? (
            <ErrorTooltip
              msg={error.msg}
              rect={states[error.anchorIdx].rect}
              size={size}
              onClose={() => setError(null)}
            />
          ) : null}
        </div>
      </div>

      {/* Generic-error banner — shown when the error has no anchor to attach
          to (overlap / no-seed / multi-seed during drag, before commit). */}
      {error && error.anchorIdx == null ? (
        <div className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error.msg}
        </div>
      ) : null}

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
              game="vlakken"
              playerName={getName()}
              playerTime={elapsed}
              submittedRank={submitted?.rank}
              metaFilter={(e) =>
                (e.meta as { difficulty?: string } | undefined)?.difficulty === difficulty
              }
            />
          </div>
          <EndScreenAddon
            game="vlakken"
            score={Math.max(1, 100000 - elapsed)}
            time={elapsed}
            meta={{ difficulty, won: true, hintsUsed: HINTS_FOR[difficulty] - hintsLeft }}
          />
          <CrossPromoCard game="vlakken" />
        </>
      ) : null}
    </div>
  );
}

function modeMatches(w: number, h: number, mode: AnchorMode): boolean {
  if (mode === "any") return true;
  if (mode === "square") return w === h;
  if (mode === "tall") return h > w;
  if (mode === "wide") return w > h;
  return false;
}

// LinkedIn-Patches anchor: a proportional rectangle drawn inside the
// anchor's cell whose w:h ratio matches the intended rectangle, with the
// area number centered on top. The shape itself replaces the abstract
// mode glyph + legend pairing — players read orientation directly off the
// preview. "any" mode and hidden anchors use a dashed square instead since
// they carry no specific orientation.
function shapeFor(size: number, mode: AnchorMode): { w: number; h: number } | null {
  if (mode === "square") {
    if (size === 4) return { w: 2, h: 2 };
    if (size === 9) return { w: 3, h: 3 };
  }
  if (mode === "tall") {
    if (size === 3) return { w: 1, h: 3 };
    if (size === 6) return { w: 2, h: 3 };
  }
  if (mode === "wide") {
    if (size === 3) return { w: 3, h: 1 };
    if (size === 6) return { w: 3, h: 2 };
  }
  return null;
}

function AnchorSeed({
  anchor,
  colorIdx,
}: {
  anchor: { size: number; mode: AnchorMode; hidden?: boolean };
  colorIdx: number;
}) {
  const color = VLAKKEN_PALETTE[colorIdx % VLAKKEN_PALETTE.length];
  const shape = shapeFor(anchor.size, anchor.mode);
  const ambiguous = anchor.hidden || anchor.mode === "any" || !shape;
  if (ambiguous) {
    return (
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="grid place-items-center rounded-sm border-2 border-dashed font-black"
          style={{
            width: "68%",
            height: "68%",
            borderColor: color,
            color: "#0a0a0a",
            background: `${color}22`,
            fontSize: "min(60%, 1.2rem)",
          }}
        >
          {anchor.hidden ? "?" : anchor.size}
        </span>
      </span>
    );
  }
  // Scale shape to ~78% of cell, preserving the w:h aspect ratio.
  const maxDim = Math.max(shape.w, shape.h);
  const scale = 78;
  const widthPct = (shape.w / maxDim) * scale;
  const heightPct = (shape.h / maxDim) * scale;
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      <span
        className="grid place-items-center rounded-sm font-black"
        style={{
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          background: color,
          color: "#0a0a0a",
          boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
          fontSize: "min(60%, 1.2rem)",
        }}
      >
        {anchor.size}
      </span>
    </span>
  );
}

// Locked rect: pastel fill + colored border + size badge in corner.
// Attempt rect: pastel fill + diagonal hatching + red ring.
function RectOverlay({
  rect,
  size,
  color,
  locked,
  won,
}: {
  rect: Rect;
  size: number;
  color: string;
  locked: boolean;
  won?: boolean;
}) {
  const top = Math.floor(rect.topLeft / size);
  const left = rect.topLeft % size;
  const cellPct = 100 / size;
  const baseStyle: CSSProperties = {
    position: "absolute",
    top: `${top * cellPct}%`,
    left: `${left * cellPct}%`,
    width: `${rect.w * cellPct}%`,
    height: `${rect.h * cellPct}%`,
  };

  if (locked) {
    return (
      <div
        className={won ? "animate-pulse" : ""}
        style={{
          ...baseStyle,
          background: `${color}33`,
          border: `2px solid ${color}`,
          borderRadius: 2,
        }}
      >
        <span
          className="absolute right-1 bottom-1 rounded bg-black/55 px-1 text-[10px] font-bold leading-tight text-white"
        >
          {rect.w * rect.h}
        </span>
      </div>
    );
  }

  // Attempt — wrong placement awaiting feedback / re-drag
  const hatch = `repeating-linear-gradient(-45deg, ${color}66 0 6px, transparent 6px 12px), ${color}22`;
  return (
    <div
      style={{
        ...baseStyle,
        background: hatch,
        border: "2px solid #ef4444",
        borderRadius: 2,
      }}
    />
  );
}

function DragOverlay({ rect, valid, size }: { rect: Rect; valid: boolean; size: number }) {
  const top = Math.floor(rect.topLeft / size);
  const left = rect.topLeft % size;
  const cellPct = 100 / size;
  return (
    <div
      style={{
        position: "absolute",
        top: `${top * cellPct}%`,
        left: `${left * cellPct}%`,
        width: `${rect.w * cellPct}%`,
        height: `${rect.h * cellPct}%`,
        background: valid ? "rgba(250, 204, 21, 0.22)" : "rgba(248, 113, 113, 0.28)",
        outline: valid ? "2px solid rgba(250, 204, 21, 0.95)" : "2px solid rgba(248, 113, 113, 0.95)",
        outlineOffset: -2,
        borderRadius: 2,
      }}
    />
  );
}

// Inline tooltip anchored to the offending rect. Auto-flips above when the
// rect sits in the bottom third of the grid (so the tooltip stays in view).
function ErrorTooltip({
  msg,
  rect,
  size,
  onClose,
}: {
  msg: string;
  rect: Rect;
  size: number;
  onClose: () => void;
}) {
  const top = Math.floor(rect.topLeft / size);
  const left = rect.topLeft % size;
  const cellPct = 100 / size;
  const showAbove = top + rect.h > size * 0.6;
  const positionStyle: CSSProperties = showAbove
    ? {
        bottom: `${(size - top) * cellPct}%`,
        left: `${left * cellPct}%`,
        marginBottom: 4,
      }
    : {
        top: `${(top + rect.h) * cellPct}%`,
        left: `${left * cellPct}%`,
        marginTop: 4,
      };
  // The tooltip sits inside a pointer-events:none overlay layer so its body
  // does NOT swallow taps on the cells beneath it — otherwise the player
  // couldn't restart a drag from any cell the tooltip is covering after a
  // warning. Only the close button needs to receive clicks.
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 max-w-[14rem] rounded-md border border-red-500/70 bg-[#1a1010] px-3 py-2 text-xs text-red-200 shadow-lg"
      style={positionStyle}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1 leading-snug">{msg}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="pointer-events-auto -mr-1 -mt-1 cursor-pointer p-1 text-red-400 hover:text-red-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function modeErrorFor(t: (k: TKey) => string, mode: AnchorMode): string {
  if (mode === "square") return t("vlakken_err_must_square");
  if (mode === "tall") return t("vlakken_err_must_tall");
  if (mode === "wide") return t("vlakken_err_must_wide");
  return "";
}

type TKey = Parameters<ReturnType<typeof useLocale>["t"]>[0];

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
