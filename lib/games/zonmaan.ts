// Zon & Maan — sun/moon binary-grid logic puzzle.
//
// Rules:
//   - Each cell holds either a sun (1) or a moon (0).
//   - No three identical symbols in a row horizontally or vertically.
//   - Each row and each column contains equal numbers of suns and moons
//     (so grid size must be even).
//   - "=" between two adjacent cells means they share the same symbol.
//   - "×" between two adjacent cells means they hold opposite symbols.
//
// Generator:
//   1. Build a complete valid grid via constraint-propagation backtracking.
//   2. Add a smattering of "=" / "×" edge constraints consistent with that
//      grid.
//   3. Sprinkle pre-filled clue cells.
//   4. Iteratively remove clues / edges as long as uniqueness holds.

export type EdgeKey = string; // "r,c-r2,c2" with row-major ordering

export type ZonMaanPuzzle = {
  size: number;
  // Pre-filled clue cells: idx -> 0 (moon) or 1 (sun). Empty cells aren't in
  // the map.
  clues: Record<number, 0 | 1>;
  // Edge constraints. Key is `min(idxA,idxB) + ":" + max(idxA,idxB)`.
  // Value is "=" or "x".
  edges: Record<EdgeKey, "=" | "x">;
  solution: (0 | 1)[]; // length size*size
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

export function edgeKey(a: number, b: number): EdgeKey {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// Validate: returns true if the placement at (cell -> value) is consistent
// with all rules given the current partially-filled grid.
function isLocallyValid(
  size: number,
  grid: (0 | 1 | -1)[],
  edges: Record<EdgeKey, "=" | "x">,
  cell: number,
  v: 0 | 1
): boolean {
  const r = Math.floor(cell / size);
  const c = cell % size;

  // Three-in-a-row check on the four windows containing this cell.
  // Horizontal triples: (r, c-2..c), (r, c-1..c+1), (r, c..c+2)
  for (let start = Math.max(0, c - 2); start <= Math.min(size - 3, c); start++) {
    const a = grid[r * size + start];
    const b = grid[r * size + start + 1];
    const cc = grid[r * size + start + 2];
    const triple = [a, b, cc].map((x, i) => (start + i === c ? v : x));
    if (triple[0] !== -1 && triple[0] === triple[1] && triple[1] === triple[2]) return false;
  }
  for (let start = Math.max(0, r - 2); start <= Math.min(size - 3, r); start++) {
    const a = grid[start * size + c];
    const b = grid[(start + 1) * size + c];
    const cc = grid[(start + 2) * size + c];
    const triple = [a, b, cc].map((x, i) => (start + i === r ? v : x));
    if (triple[0] !== -1 && triple[0] === triple[1] && triple[1] === triple[2]) return false;
  }

  // Row balance: count suns/moons in row r including this assignment.
  let rowSuns = 0, rowMoons = 0;
  for (let cc = 0; cc < size; cc++) {
    const idx = r * size + cc;
    const val = idx === cell ? v : grid[idx];
    if (val === 1) rowSuns++;
    else if (val === 0) rowMoons++;
  }
  if (rowSuns > size / 2 || rowMoons > size / 2) return false;

  // Column balance.
  let colSuns = 0, colMoons = 0;
  for (let rr = 0; rr < size; rr++) {
    const idx = rr * size + c;
    const val = idx === cell ? v : grid[idx];
    if (val === 1) colSuns++;
    else if (val === 0) colMoons++;
  }
  if (colSuns > size / 2 || colMoons > size / 2) return false;

  // Edge constraints involving this cell.
  for (const nb of orthoNeighbours(cell, size)) {
    const k = edgeKey(cell, nb);
    const constraint = edges[k];
    if (!constraint) continue;
    const other = grid[nb];
    if (other === -1) continue; // not yet placed
    if (constraint === "=" && other !== v) return false;
    if (constraint === "x" && other === v) return false;
  }
  return true;
}

function orthoNeighbours(idx: number, size: number): number[] {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const out: number[] = [];
  if (r > 0) out.push(idx - size);
  if (r < size - 1) out.push(idx + size);
  if (c > 0) out.push(idx - 1);
  if (c < size - 1) out.push(idx + 1);
  return out;
}

// Solver: returns up to `cap` solutions consistent with given clues + edges.
export function solveZonMaan(
  size: number,
  clues: Record<number, 0 | 1>,
  edges: Record<EdgeKey, "=" | "x">,
  cap = 2,
  stepBudget = 1_500_000
): (0 | 1)[][] {
  const N = size * size;
  const grid: (0 | 1 | -1)[] = new Array(N).fill(-1);
  for (const k of Object.keys(clues)) grid[Number(k)] = clues[Number(k)];
  // Validate clues + edges up front.
  for (let i = 0; i < N; i++) {
    if (grid[i] === -1) continue;
    if (!isLocallyValid(size, grid, edges, i, grid[i] as 0 | 1)) return [];
  }
  const found: (0 | 1)[][] = [];
  let steps = 0;
  let aborted = false;

  function recurse(idx: number) {
    if (aborted || found.length >= cap) return;
    if (++steps > stepBudget) { aborted = true; return; }
    if (idx === N) {
      found.push(grid.slice() as (0 | 1)[]);
      return;
    }
    if (grid[idx] !== -1) {
      recurse(idx + 1);
      return;
    }
    for (const v of [0, 1] as const) {
      if (isLocallyValid(size, grid, edges, idx, v)) {
        grid[idx] = v;
        recurse(idx + 1);
        grid[idx] = -1;
        if (found.length >= cap || aborted) return;
      }
    }
  }
  recurse(0);
  return found;
}

// Generate a complete valid grid by randomised backtracking.
function buildSolution(size: number, rng: () => number): (0 | 1)[] | null {
  const N = size * size;
  const grid: (0 | 1 | -1)[] = new Array(N).fill(-1);
  let aborted = false;
  let steps = 0;

  function recurse(idx: number): boolean {
    if (aborted) return false;
    if (++steps > 500_000) { aborted = true; return false; }
    if (idx === N) return true;
    const order = rng() < 0.5 ? [0, 1] : [1, 0];
    for (const v of order as (0 | 1)[]) {
      if (isLocallyValid(size, grid, {}, idx, v)) {
        grid[idx] = v;
        if (recurse(idx + 1)) return true;
        grid[idx] = -1;
      }
    }
    return false;
  }
  return recurse(0) ? (grid as (0 | 1)[]) : null;
}

export function generateZonMaan(size: number, seed: number, baseClueRatio = 0.35): ZonMaanPuzzle {
  if (size % 2 !== 0) throw new Error("Zon & Maan grid size must be even");
  let s = seed;
  for (let outer = 0; outer < 30; outer++) {
    const rng = mulberry32(s);
    const solution = buildSolution(size, rng);
    if (!solution) {
      s = (s + 0x9e3779b9) | 0;
      continue;
    }

    const N = size * size;
    // Step 1: build full clue set + a few edges, then peel away.
    const clues: Record<number, 0 | 1> = {};
    for (let i = 0; i < N; i++) clues[i] = solution[i];
    const edges: Record<EdgeKey, "=" | "x"> = {};
    // Sprinkle a few edge constraints (10-20% of edges) consistent with the
    // solution. Edges add deductive flavour.
    const allEdges: Array<{ a: number; b: number }> = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        if (c < size - 1) allEdges.push({ a: idx, b: idx + 1 });
        if (r < size - 1) allEdges.push({ a: idx, b: idx + size });
      }
    }
    shuffleInPlace(allEdges, rng);
    const edgeBudget = Math.floor(allEdges.length * 0.18);
    for (let i = 0; i < edgeBudget; i++) {
      const { a, b } = allEdges[i];
      const sa = solution[a], sb = solution[b];
      edges[edgeKey(a, b)] = sa === sb ? "=" : "x";
    }

    // Target a clue density in line with baseClueRatio so peel produces
    // playable rather than minimal puzzles. The target is a lower bound:
    // peel stops once we hit it, even if more cells could be removed.
    const targetClues = Math.max(2, Math.floor(N * baseClueRatio));

    // Step 2: peel clues. Multiple passes — removing one cell can free up
    // others by tightening row/col balance reasoning.
    let progress = true;
    while (progress && Object.keys(clues).length > targetClues) {
      progress = false;
      const cellOrder = Array.from({ length: N }, (_, i) => i);
      shuffleInPlace(cellOrder, rng);
      for (const cell of cellOrder) {
        if (Object.keys(clues).length <= targetClues) break;
        if (!(cell in clues)) continue;
        const saved = clues[cell];
        delete clues[cell];
        const sols = solveZonMaan(size, clues, edges, 2);
        if (sols.length !== 1) {
          clues[cell] = saved;
        } else {
          progress = true;
        }
      }
    }

    // Step 3: peel edges similarly — these add deductive flavour but too
    // many makes the puzzle feel cluttered, so we always peel as far as
    // uniqueness allows.
    progress = true;
    while (progress) {
      progress = false;
      const edgeKeys = Object.keys(edges);
      shuffleInPlace(edgeKeys, rng);
      for (const k of edgeKeys) {
        if (!(k in edges)) continue;
        const saved = edges[k];
        delete edges[k];
        const sols = solveZonMaan(size, clues, edges, 2);
        if (sols.length !== 1) {
          edges[k] = saved;
        } else {
          progress = true;
        }
      }
    }

    const sols = solveZonMaan(size, clues, edges, 2);
    if (sols.length === 1) {
      return { size, clues, edges, solution, seed };
    }
    s = (s + 0x9e3779b9) | 0;
  }
  // Fallback: full grid as clues.
  const rng = mulberry32(seed);
  const solution = buildSolution(size, rng) ?? new Array(size * size).fill(0) as (0 | 1)[];
  const clues: Record<number, 0 | 1> = {};
  for (let i = 0; i < size * size; i++) clues[i] = solution[i];
  return { size, clues, edges: {}, solution, seed };
}

export function verifyZonMaan(p: ZonMaanPuzzle): {
  ok: boolean;
  solutionCount: number;
  clueCount: number;
  edgeCount: number;
} {
  const sols = solveZonMaan(p.size, p.clues, p.edges, 5);
  return {
    ok: sols.length === 1,
    solutionCount: sols.length,
    clueCount: Object.keys(p.clues).length,
    edgeCount: Object.keys(p.edges).length,
  };
}
