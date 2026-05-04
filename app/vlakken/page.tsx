"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import { generateVlakken, type VlakkenPuzzle, type AnchorMode } from "@/lib/games/vlakken";
import { dayIndex } from "@/lib/games/kronen";

type Difficulty = "easy" | "medium" | "hard";
const SIZE_FOR: Record<Difficulty, number> = { easy: 6, medium: 7, hard: 9 };
const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const HINTS_FOR: Record<Difficulty, number> = { easy: 3, medium: 3, hard: 5 };
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
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const startedAt = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const seed = useMemo(
    () => dayIndex() * 1303 + DIFF_INDEX[difficulty] * 19 + seedNonce,
    [difficulty, seedNonce]
  );

  useEffect(() => {
    const size = SIZE_FOR[difficulty];
    const p = generateVlakken(size, seed);
    setPuzzle(p);
    setStates({});
    setHistory([]);
    setHintsLeft(HINTS_FOR[difficulty]);
    setElapsed(0);
    setDone(false);
    setError(null);
    setDrag(null);
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

  useEffect(() => () => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), 4000);
  }, []);

  function persistBest(time: number) {
    const prevBest = Number(localStorage.getItem(BEST_KEY(difficulty)) ?? "");
    if (!prevBest || time < prevBest) {
      localStorage.setItem(BEST_KEY(difficulty), String(time));
      setBestSeconds(time);
    }
  }

  // Compute, for each cell index, the anchor index whose rect (locked or
  // attempt) covers it. Locked wins over attempt; if neither covers it, -1.
  const cellOwner = useMemo(() => {
    if (!puzzle) return new Map<number, number>();
    const m = new Map<number, number>();
    const size = puzzle.size;
    // Locked first so they can't be overwritten by a stale attempt.
    for (const [k, st] of Object.entries(states)) {
      if (!st.locked) continue;
      const aIdx = Number(k);
      const top = Math.floor(st.rect.topLeft / size), left = st.rect.topLeft % size;
      for (let r = 0; r < st.rect.h; r++) for (let c = 0; c < st.rect.w; c++) {
        m.set((top + r) * size + left + c, aIdx);
      }
    }
    for (const [k, st] of Object.entries(states)) {
      if (st.locked) continue;
      const aIdx = Number(k);
      const top = Math.floor(st.rect.topLeft / size), left = st.rect.topLeft % size;
      for (let r = 0; r < st.rect.h; r++) for (let c = 0; c < st.rect.w; c++) {
        const idx = (top + r) * size + left + c;
        if (!m.has(idx)) m.set(idx, aIdx);
      }
    }
    return m;
  }, [puzzle, states]);

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
      const sizeOk = placedSize === target.size;
      const modeOk = sizeOk && modeMatches(w, h, target.mode);

      newStates[target.anchorIdx] = {
        rect: { topLeft, w, h },
        locked: sizeOk && modeOk,
      };
      setStates(newStates);

      if (!sizeOk) {
        showError(`${t("vlakken_err_size")} ${placedSize}/${target.size}`);
        return;
      }
      if (!modeOk) {
        showError(modeErrorFor(t, target.mode));
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
  const dragCells = dragRect ? rectCellSet(dragRect, size) : null;
  const dragValid = (() => {
    if (!dragRect || !dragCells) return true;
    // Drag is "valid-looking" if it doesn't overlap any locked cell.
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
            {t("game_vlakken_desc")} · {locale.toUpperCase()} · ⏱ <span className="font-mono">{elapsed}s</span>
          </p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-3 text-xs text-gray-500">{t("vlakken_drag_hint")}</p>

      <div
        ref={gridRef}
        className="mx-auto mt-4 grid gap-[2px] rounded-md border-2 border-[#0a0a0a] bg-[#0a0a0a] p-[2px] touch-none select-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, idx) => {
          const owner = cellOwner.get(idx);
          const ownerState = owner !== undefined ? states[owner] : undefined;
          const isLocked = ownerState?.locked === true;
          const fillColour = owner !== undefined ? VLAKKEN_PALETTE[owner % VLAKKEN_PALETTE.length] : "#1a1a1a";
          const ownerOpacity = ownerState ? (isLocked ? 1 : 0.55) : 1;
          const anchorIdx = puzzle.anchors.findIndex((a) => a.idx === idx);
          const anchor = anchorIdx >= 0 ? puzzle.anchors[anchorIdx] : null;
          const showSeed = anchor && !states[anchorIdx]?.locked;
          const inDrag = dragCells?.has(idx);
          return (
            <button
              key={idx}
              type="button"
              data-cell-idx={idx}
              onPointerDown={(e) => onCellPointerDown(idx, e)}
              disabled={done}
              className="relative aspect-square grid place-items-center text-sm font-bold transition active:scale-[0.98]"
              style={{ background: fillColour, opacity: ownerOpacity, touchAction: "none" }}
            >
              {showSeed && anchor ? (
                <span className="pointer-events-none flex flex-col items-center gap-0.5 leading-none">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-base font-black text-[#0a0a0a]"
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      outline: anchor.mode === "any"
                        ? "2px dashed rgba(255,255,255,0.85)"
                        : "2px solid rgba(255,255,255,0.85)",
                      outlineOffset: 2,
                    }}
                  >
                    {anchor.size}
                  </span>
                  <ModeGlyph mode={anchor.mode} />
                </span>
              ) : null}
              {inDrag ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[2px]"
                  style={{
                    background: dragValid ? "rgba(250, 204, 21, 0.28)" : "rgba(248, 113, 113, 0.30)",
                    outline: dragValid ? "2px solid rgba(250, 204, 21, 0.9)" : "2px solid rgba(248, 113, 113, 0.9)",
                    outlineOffset: -2,
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

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

function modeMatches(w: number, h: number, mode: AnchorMode): boolean {
  if (mode === "any") return true;
  if (mode === "square") return w === h;
  if (mode === "tall") return h > w;
  if (mode === "wide") return w > h;
  return false;
}

function ModeGlyph({ mode }: { mode: AnchorMode }) {
  // 16×16 viewBox, white-filled rectangle whose proportions clearly signal
  // orientation. "any" overlays a horizontal + vertical bar to suggest
  // "either way works".
  const stroke = "rgba(0,0,0,0.55)";
  const fill = "rgba(255,255,255,0.95)";
  if (mode === "square") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect x="3" y="3" width="10" height="10" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (mode === "tall") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect x="5" y="1" width="6" height="14" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (mode === "wide") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect x="1" y="5" width="14" height="6" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  // "any": dashed square with crossed bars
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
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
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1.5 capitalize ${value === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"}`}
        >
          {t(d)}
        </button>
      ))}
    </div>
  );
}
