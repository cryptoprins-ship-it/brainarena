// Vlakken — rectangle-tiling logic puzzle.
//
// Each puzzle is an N×N grid covered by non-overlapping rectangles. Each
// rectangle has one anchor cell with:
//   - a number (= the rectangle's area)
//   - a shape mode: "square" | "tall" | "wide" | "any"
//
// "any"-mode anchors (rendered with a dashed border) accept any rectangle of
// the right size. Squares (sizes 1, 4, 9) only fit one shape, so they are
// always "square" mode regardless.
//
// Sizes used: 4 (2×2), 6 (2×3 tall or 3×2 wide), 9 (3×3). For grids that
// can't be tiled cleanly with those alone, the generator falls back to size
// 3 (1×3 / 3×1) and 2 (1×2 / 2×1) and finally 1 (1×1) to guarantee coverage.

export type AnchorMode = "square" | "tall" | "wide" | "any";

export type VlakkenAnchor = {
  idx: number;        // cell index of the anchor
  size: number;       // area of its rectangle
  mode: AnchorMode;
};

export type VlakkenRect = {
  anchorIdx: number;  // anchor cell index
  topLeft: number;    // cell index of top-left corner
  width: number;
  height: number;
};

export type VlakkenPuzzle = {
  size: number;       // grid side length
  anchors: VlakkenAnchor[];
  // The intended solution: cellAssignment[cellIdx] = anchor index in
  // `anchors` whose rectangle contains the cell.
  solution: number[];
  rects: VlakkenRect[];
  seed: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Available rectangle dimensions, sorted largest area first so the tiler
// places big shapes first (greedy tends to leave fewer awkward leftovers).
const RECT_DIMS: Array<{ w: number; h: number; area: number; mode: AnchorMode }> = [
  { w: 3, h: 3, area: 9, mode: "square" },
  { w: 2, h: 3, area: 6, mode: "tall" },
  { w: 3, h: 2, area: 6, mode: "wide" },
  { w: 2, h: 2, area: 4, mode: "square" },
  { w: 1, h: 3, area: 3, mode: "tall" },
  { w: 3, h: 1, area: 3, mode: "wide" },
  { w: 1, h: 2, area: 2, mode: "tall" },
  { w: 2, h: 1, area: 2, mode: "wide" },
  { w: 1, h: 1, area: 1, mode: "square" },
];

function fits(size: number, claimed: number[], top: number, left: number, w: number, h: number): boolean {
  if (top + h > size || left + w > size) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (claimed[(top + r) * size + left + c] !== -1) return false;
    }
  }
  return true;
}

// Tile the grid with random rectangles. Returns the set of placed rectangles
// or null if greedy fails. Each cell ends up belonging to exactly one rect.
function tileGrid(
  size: number,
  rng: () => number
): { rects: VlakkenRect[]; assignment: number[] } | null {
  const claimed = new Array(size * size).fill(-1);
  const rects: VlakkenRect[] = [];
  for (let cell = 0; cell < size * size; cell++) {
    if (claimed[cell] !== -1) continue;
    const top = Math.floor(cell / size);
    const left = cell % size;
    const choices = [...RECT_DIMS];
    shuffleInPlace(choices, rng);
    // Bias slightly toward larger pieces to keep the puzzle interesting.
    choices.sort((a, b) => {
      const aw = rng() < 0.7 ? b.area - a.area : 0;
      return aw;
    });
    let placed: VlakkenRect | null = null;
    for (const dim of choices) {
      if (!fits(size, claimed, top, left, dim.w, dim.h)) continue;
      // Anchor: a random cell within the rectangle.
      const anchorRow = top + Math.floor(rng() * dim.h);
      const anchorCol = left + Math.floor(rng() * dim.w);
      const anchorIdx = anchorRow * size + anchorCol;
      placed = { anchorIdx, topLeft: top * size + left, width: dim.w, height: dim.h };
      const rectId = rects.length;
      for (let r = 0; r < dim.h; r++) {
        for (let c = 0; c < dim.w; c++) {
          claimed[(top + r) * size + left + c] = rectId;
        }
      }
      rects.push(placed);
      break;
    }
    if (!placed) return null;
  }
  return { rects, assignment: claimed };
}

// Enumerate every rectangle placement that:
//   - has the requested area
//   - matches the anchor mode
//   - covers the anchor cell
function placementsFor(size: number, anchor: VlakkenAnchor): Array<{ topLeft: number; w: number; h: number }> {
  const ar = Math.floor(anchor.idx / size);
  const ac = anchor.idx % size;
  const dims: Array<{ w: number; h: number }> = [];
  switch (anchor.size) {
    case 1: dims.push({ w: 1, h: 1 }); break;
    case 2:
      if (anchor.mode === "wide" || anchor.mode === "any") dims.push({ w: 2, h: 1 });
      if (anchor.mode === "tall" || anchor.mode === "any") dims.push({ w: 1, h: 2 });
      break;
    case 3:
      if (anchor.mode === "wide" || anchor.mode === "any") dims.push({ w: 3, h: 1 });
      if (anchor.mode === "tall" || anchor.mode === "any") dims.push({ w: 1, h: 3 });
      break;
    case 4: dims.push({ w: 2, h: 2 }); break;
    case 6:
      if (anchor.mode === "wide" || anchor.mode === "any") dims.push({ w: 3, h: 2 });
      if (anchor.mode === "tall" || anchor.mode === "any") dims.push({ w: 2, h: 3 });
      break;
    case 9: dims.push({ w: 3, h: 3 }); break;
    default: break;
  }
  const out: Array<{ topLeft: number; w: number; h: number }> = [];
  for (const { w, h } of dims) {
    // The anchor cell is somewhere inside this w×h rectangle; iterate over
    // every offset of the anchor within the rect.
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        const top = ar - dr;
        const left = ac - dc;
        if (top < 0 || left < 0) continue;
        if (top + h > size || left + w > size) continue;
        out.push({ topLeft: top * size + left, w, h });
      }
    }
  }
  return out;
}

// Backtracking solver: tries to assign every anchor a rectangle that covers
// it, with no two rectangles overlapping. Returns up to `cap` complete
// solutions, each as a cellAssignment array.
export function solveVlakken(
  size: number,
  anchors: VlakkenAnchor[],
  cap = 2
): number[][] {
  const N = size * size;
  // Pre-compute total covered area; if it doesn't equal N the puzzle is
  // unsolvable regardless.
  const total = anchors.reduce((s, a) => s + a.size, 0);
  if (total !== N) return [];

  const assignment = new Array(N).fill(-1);
  const found: number[][] = [];

  // Order anchors by candidate count ascending so we backtrack on the most
  // constrained ones first.
  const candidates: Array<Array<{ topLeft: number; w: number; h: number }>> = anchors.map((a) =>
    placementsFor(size, a)
  );
  const order = anchors.map((_, i) => i).sort((a, b) => candidates[a].length - candidates[b].length);

  function placed(rectIdx: number, p: { topLeft: number; w: number; h: number }): number[] | null {
    const top = Math.floor(p.topLeft / size);
    const left = p.topLeft % size;
    const cells: number[] = [];
    for (let r = 0; r < p.h; r++) {
      for (let c = 0; c < p.w; c++) {
        const idx = (top + r) * size + left + c;
        if (assignment[idx] !== -1) {
          for (const v of cells) assignment[v] = -1;
          return null;
        }
        assignment[idx] = rectIdx;
        cells.push(idx);
      }
    }
    return cells;
  }

  function recurse(slot: number) {
    if (found.length >= cap) return;
    if (slot === order.length) {
      // Verify all cells covered.
      for (let i = 0; i < N; i++) if (assignment[i] === -1) return;
      found.push([...assignment]);
      return;
    }
    const anchorIdx = order[slot];
    for (const p of candidates[anchorIdx]) {
      const cells = placed(anchorIdx, p);
      if (!cells) continue;
      recurse(slot + 1);
      for (const v of cells) assignment[v] = -1;
      if (found.length >= cap) return;
    }
  }
  recurse(0);
  return found;
}

export function generateVlakken(size: number, seed: number, flexProb = 0.3): VlakkenPuzzle {
  let s = seed;
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = mulberry32(s);
    const tiling = tileGrid(size, rng);
    if (!tiling) {
      s = (s + 0x9e3779b9) | 0;
      continue;
    }
    const { rects, assignment } = tiling;
    // Build anchors (one per rect).
    const anchors: VlakkenAnchor[] = rects.map((r) => {
      const baseMode: AnchorMode = (r.width === r.height ? "square" : r.height > r.width ? "tall" : "wide");
      // Squares stay strict (they only have one shape).
      let mode: AnchorMode = baseMode;
      if (baseMode !== "square" && rng() < flexProb) mode = "any";
      return { idx: r.anchorIdx, size: r.width * r.height, mode };
    });
    // Verify uniqueness. If not unique, downgrade some "any" anchors back to
    // strict; if still not unique, regenerate.
    let solutions = solveVlakken(size, anchors, 2);
    if (solutions.length !== 1) {
      // Downgrade flex anchors one at a time.
      for (let i = 0; i < anchors.length && solutions.length !== 1; i++) {
        if (anchors[i].mode === "any") {
          const orig = anchors[i].mode;
          const r = rects[i];
          anchors[i] = {
            ...anchors[i],
            mode: r.width === r.height ? "square" : r.height > r.width ? "tall" : "wide",
          };
          const s2 = solveVlakken(size, anchors, 2);
          if (s2.length === 1) {
            solutions = s2;
            break;
          } else if (s2.length === 0) {
            anchors[i] = { ...anchors[i], mode: orig };
          } else {
            solutions = s2;
          }
        }
      }
    }
    if (solutions.length === 1) {
      // assignment built by tileGrid encodes anchor-index -> rect; we need
      // cellAssignment[cellIdx] = anchorIndex. The tiler's assignment uses
      // the same rects[] order, so it directly matches.
      return { size, anchors, solution: assignment, rects, seed };
    }
    s = (s + 0x9e3779b9) | 0;
  }
  // Last-ditch fallback: tile then make all anchors strict.
  const rng = mulberry32(seed);
  const tiling = tileGrid(size, rng) ?? { rects: [], assignment: new Array(size * size).fill(-1) };
  const anchors: VlakkenAnchor[] = tiling.rects.map((r) => ({
    idx: r.anchorIdx,
    size: r.width * r.height,
    mode: (r.width === r.height ? "square" : r.height > r.width ? "tall" : "wide") as AnchorMode,
  }));
  return { size, anchors, solution: tiling.assignment, rects: tiling.rects, seed };
}

export function verifyVlakken(p: VlakkenPuzzle): {
  ok: boolean;
  solutionCount: number;
} {
  const sols = solveVlakken(p.size, p.anchors, 5);
  return { ok: sols.length === 1, solutionCount: sols.length };
}
