"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import CrossPromoCard from "@/components/CrossPromoCard";
import { useLocale } from "@/lib/i18n";
import { generateVlakken, type VlakkenPuzzle, type AnchorMode } from "@/lib/games/vlakken";
import { dayIndex } from "@/lib/games/kronen";
import { getName, setName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

type Difficulty = "easy" | "medium" | "hard";
const SIZE_FOR: Record<Difficulty, number> = { easy: 7, medium: 8, hard: 10 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
// Number of anchors hidden ("?"-style) per difficulty. The generator only
// applies a hide-set that keeps the puzzle uniquely solvable, so on rare
// hard puzzles you may end up with one hidden anchor instead of two.
const HIDE_FOR: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const BEST_KEY = (d: Difficulty) => `brainarena-vlakken-best-${d}`;

// Vivid, well-separated hues so adjacent shapes are easy to distinguish.
const VLAKKEN_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#a855f7",
  "#f59e0b", "#10b981",
];

type Rect = { topLeft: number; w: number; h: number };
type AnchorState = { rect: Rect; locked: boolean };
type DragState = { startCell: number; currentCell: number; pointerId: number };
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
  const [nameInput, setNameInput] = useState("");
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("vlakken", todayIdx, difficulty);
  useEffect(() => { setNameInput(getName()); }, []);

  const seed = useMemo(
    () => dayIndex() * 1303 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateVlakken(size, seed, 0.3, HIDE_FOR[difficulty]);
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
        game: "vlakken",
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
        game: "vlakken",
        name: nameInput || "Anonymous",
        score: Math.max(1, 100000 - elapsed),
        time: elapsed,
        meta: { difficulty, hintsUsed: HINTS_FOR[difficulty] - hintsLeft },
      }).then((r) => r && setSubmitted(r));
    }
  }, [nameInput, done, eligibleToSubmit, submitted, elapsed, difficulty, hintsLeft]);

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
    (start: number, end: number) => {
      if (!puzzle || done) return;
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

      // Overlap with locked rectangles?
      const lockedCells = new Set<number>();
      for (const st of Object.values(states)) {
        if (!st.locked) continue;
        const tt = Math.floor(st.rect.topLeft / size), ll = st.rect.topLeft % size;
        for (let r = 0; r < st.rect.h; r++) for (let c = 0; c < st.rect.w; c++) {
          lockedCells.add((tt + r) * size + ll + c);
        }
      }
      for (const c of cells) {
        if (lockedCells.has(c)) {
          showError(t("vlakken_err_overlap"));
          return;
        }
      }

      // Seeds in selection that aren't already locked.
      const seedsInBox = puzzle.anchors
        .map((a, i) => ({ ...a, anchorIdx: i }))
        .filter((a) => cellSet.has(a.idx))
        .filter((a) => !states[a.anchorIdx]?.locked);

      if (seedsInBox.length === 0) {
        showError(t("vlakken_err_no_seed"));
        return;
      }
      if (seedsInBox.length > 1) {
        showError(t("vlakken_err_multi_seed"));
        return;
      }

      const target = seedsInBox[0];
      if (!startedAt.current) startedAt.current = Date.now();

      // Snapshot for undo.
      setHistory((h) => [...h, states]);

      // Clear any other anchor's non-locked attempt that overlaps these cells.
      const newStates: Record<number, AnchorState> = { ...states };
      for (const k of Object.keys(newStates)) {
        const aIdx = Number(k);
        if (aIdx === target.anchorIdx) continue;
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
      setDrag({ startCell: idx, currentCell: idx, pointerId: e.pointerId });
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
      finishDragRef.current(cur.startCell, cur.currentCell);
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
  const dragValid = (() => {
    if (!dragRect) return true;
    const dragCells = rectCellSet(dragRect, size);
    for (const st of Object.values(states)) {
      if (!st.locked) continue;
      const tt = Math.floor(st.rect.topLeft / size), ll = st.rect.topLeft % size;
      for (let r = 0; r < st.rect.h; r++) for (let c = 0; c < st.rect.w; c++) {
        if (dragCells.has((tt + r) * size + ll + c)) return false;
      }
    }
    return true;
  })();

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

      {/* Legend card — explains the four mode glyphs that appear on anchor seeds */}
      <div className="mt-5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <p className="text-center text-sm font-bold text-gray-200">{t("vlakken_legend_title")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-300">
          <LegendItem mode="square" label={t("vlakken_mode_square")} />
          <LegendItem mode="tall" label={t("vlakken_mode_tall")} />
          <LegendItem mode="wide" label={t("vlakken_mode_wide")} />
          <LegendItem mode="any" label={t("vlakken_mode_any")} />
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">{t("vlakken_legend_help")}</p>
      </div>

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

// Anchor seed — small colored badge in the cell's top-left corner. Always
// visible (also under a locked overlay, since the overlay is translucent),
// so the player keeps the size/mode reference even after solving.
function AnchorSeed({
  anchor,
  colorIdx,
}: {
  anchor: { size: number; mode: AnchorMode; hidden?: boolean };
  colorIdx: number;
}) {
  const color = VLAKKEN_PALETTE[colorIdx % VLAKKEN_PALETTE.length];
  return (
    <span
      className="pointer-events-none absolute left-1 top-1 z-[1] flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-black text-white shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
      style={{ background: color }}
    >
      <span className="leading-none">{anchor.hidden ? "?" : anchor.size}</span>
      {!anchor.hidden && anchor.mode !== "any" ? (
        <ModeGlyph mode={anchor.mode} compact />
      ) : null}
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
}: {
  rect: Rect;
  size: number;
  color: string;
  locked: boolean;
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

function LegendItem({ mode, label }: { mode: AnchorMode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#2a2a2a] bg-[#0e0e0e]"
      >
        <ModeGlyph mode={mode} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function ModeGlyph({ mode, compact = false }: { mode: AnchorMode; compact?: boolean }) {
  // 16×16 viewBox, white-ish filled rectangle whose proportions clearly signal
  // orientation. Stroke uses a translucent white so the glyph reads on both
  // colored seed-backgrounds and the dark legend panel.
  const s = compact ? 12 : 14;
  const stroke = "rgba(255,255,255,0.55)";
  const fill = "rgba(255,255,255,0.95)";
  if (mode === "square") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden>
        <rect x="3" y="3" width="10" height="10" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (mode === "tall") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden>
        <rect x="5" y="1" width="6" height="14" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (mode === "wide") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden>
        <rect x="1" y="5" width="14" height="6" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  // "any": dashed square with crossed bars
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden>
      <rect
        x="2.5" y="2.5" width="11" height="11"
        fill="none" stroke={fill} strokeWidth="1.5" strokeDasharray="2 1.5"
      />
      <line x1="2.5" y1="8" x2="13.5" y2="8" stroke={fill} strokeWidth="1" />
      <line x1="8" y1="2.5" x2="8" y2="13.5" stroke={fill} strokeWidth="1" />
    </svg>
  );
}

function modeErrorFor(t: (k: TKey) => string, mode: AnchorMode): string {
  if (mode === "square") return t("vlakken_err_must_square");
  if (mode === "tall") return t("vlakken_err_must_tall");
  if (mode === "wide") return t("vlakken_err_must_wide");
  return "";
}

type TKey = Parameters<ReturnType<typeof useLocale>["t"]>[0];

function rectCellSet(rect: Rect, size: number): Set<number> {
  const set = new Set<number>();
  const top = Math.floor(rect.topLeft / size), left = rect.topLeft % size;
  for (let r = 0; r < rect.h; r++) for (let c = 0; c < rect.w; c++) set.add((top + r) * size + left + c);
  return set;
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
