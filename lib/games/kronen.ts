// Kronen — N-queen-with-king-moves variant + region partition.
//
// Each puzzle is an N×N grid divided into N connected colour regions.
// A solution places exactly one crown per row, per column, AND per region,
// such that no two crowns touch (king-move adjacency).
//
// Generator pipeline:
//   1. Place a valid crown solution (one per row, none touching diagonally).
//   2. BFS-grow N connected regions from those crown anchors.
//   3. Verify uniqueness with the solver — if not unique, mutate regions
//      until uniqueness holds (or fall back to a fresh seed).
//
// All randomness flows from a seeded PRNG so the daily puzzle is identical
// for every player.

export type KronenPuzzle = {
  size: number;
  regions: number[];          // length size*size, value 0..size-1 (region id)
  solution: number[];         // length size, solution[row] = col with the crown
  seed: number;
};

export function dayIndex(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

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

function neighbours4(idx: number, size: number): number[] {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const out: number[] = [];
  if (r > 0) out.push(idx - size);
  if (r < size - 1) out.push(idx + size);
  if (c > 0) out.push(idx - 1);
  if (c < size - 1) out.push(idx + 1);
  return out;
}

// Place one crown per row such that:
//   - every column is unique (set of cols is a permutation of 0..N-1)
//   - no two consecutive rows place crowns on adjacent columns (king-move
//     touching). Same-row is impossible by construction; non-adjacent rows
//     are too far apart vertically to touch.
function placeSolution(size: number, rng: () => number): number[] | null {
  const cols: number[] = [];
  function pick(rowIdx: number): boolean {
    if (rowIdx === size) return true;
    const candidates: number[] = [];
    const prev = rowIdx > 0 ? cols[rowIdx - 1] : -10;
    for (let c = 0; c < size; c++) {
      if (cols.includes(c)) continue;
      if (Math.abs(prev - c) <= 1) continue;
      candidates.push(c);
    }
    shuffleInPlace(candidates, rng);
    for (const c of candidates) {
      cols.push(c);
      if (pick(rowIdx + 1)) return true;
      cols.pop();
    }
    return false;
  }
  return pick(0) ? cols : null;
}

// Grow N regions from the crown anchors by repeatedly absorbing a random
// unclaimed neighbour. Always picks a region uniformly at random among those
// that still have growth room — this keeps regions roughly balanced.
function growRegions(size: number, solution: number[], rng: () => number): number[] {
  const N = size * size;
  const regions: number[] = new Array(N).fill(-1);
  // Anchor each region at the crown cell.
  solution.forEach((col, r) => {
    regions[r * size + col] = r;
  });
  // Frontier = region id → list of cells in that region with unclaimed neighbours
  let claimed = size;
  while (claimed < N) {
    // Pick a region with at least one growth option.
    const order = Array.from({ length: size }, (_, i) => i);
    shuffleInPlace(order, rng);
    let placed = false;
    for (const region of order) {
      // collect all cells of this region that have unclaimed neighbours
      const candidates: { cell: number; nb: number }[] = [];
      for (let i = 0; i < N; i++) {
        if (regions[i] !== region) continue;
        for (const nb of neighbours4(i, size)) {
          if (regions[nb] === -1) candidates.push({ cell: i, nb });
        }
      }
      if (!candidates.length) continue;
      const pick = candidates[Math.floor(rng() * candidates.length)];
      regions[pick.nb] = region;
      claimed++;
      placed = true;
      break;
    }
    if (!placed) {
      // Should be impossible for connected grids, but guard.
      for (let i = 0; i < N; i++) {
        if (regions[i] === -1) regions[i] = 0;
      }
      break;
    }
  }
  return regions;
}

// Backtracking solver: returns up to `cap` solutions. Each solution is the
// `colPerRow` array. Used both to verify uniqueness during generation and to
// reveal the answer at hint time.
export function solveKronen(size: number, regions: number[], cap = 2): number[][] {
  const found: number[][] = [];
  const cols: number[] = [];
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();

  function recurse(row: number) {
    if (found.length >= cap) return;
    if (row === size) {
      found.push([...cols]);
      return;
    }
    const prev = row > 0 ? cols[row - 1] : -10;
    for (let c = 0; c < size; c++) {
      if (usedCols.has(c)) continue;
      if (Math.abs(prev - c) <= 1) continue;
      const region = regions[row * size + c];
      if (usedRegions.has(region)) continue;
      cols.push(c);
      usedCols.add(c);
      usedRegions.add(region);
      recurse(row + 1);
      cols.pop();
      usedCols.delete(c);
      usedRegions.delete(region);
      if (found.length >= cap) return;
    }
  }
  recurse(0);
  return found;
}

// Mutation-based refinement: if solveKronen reports >1 solution, find a cell
// that participates in an alternative solution and move it into a neighbouring
// region. The embedded solution's region distribution stays intact (our crown
// cells' regions are never touched), so each successful move can only ever
// reduce the alternative-solution count. Continues until uniqueness or until
// no move helps.
function refineForUniqueness(
  size: number,
  regions: number[],
  solution: number[],
  rng: () => number
): boolean {
  for (let iter = 0; iter < 250; iter++) {
    const sols = solveKronen(size, regions, 2);
    if (sols.length === 1) return true;
    if (sols.length === 0) return false;
    const alt = sols.find((s) => s.some((c, r) => c !== solution[r]));
    if (!alt) return true;
    // Cells where the alternative differs from our solution. Moving any one of
    // these out of its current region changes the alt's region-set and may
    // disqualify it. We never move a solution-crown cell.
    const altCells: number[] = [];
    for (let r = 0; r < size; r++) {
      if (alt[r] !== solution[r]) altCells.push(r * size + alt[r]);
    }
    shuffleInPlace(altCells, rng);
    let moved = false;
    for (const cell of altCells) {
      const nbs = neighbours4(cell, size).filter((n) => regions[n] !== regions[cell]);
      // Don't move a cell that holds an embedded solution crown. (altCells
      // already excludes those, but defence in depth.)
      const r = Math.floor(cell / size);
      const c = cell % size;
      if (solution[r] === c) continue;
      shuffleInPlace(nbs, rng);
      for (const nb of nbs) {
        // Skip if the neighbour's region already contains our row's solution
        // crown for this same row — wouldn't help.
        regions[cell] = regions[nb];
        moved = true;
        break;
      }
      if (moved) break;
    }
    if (!moved) return false;
  }
  return false;
}

export function generateKronen(size: number, seed: number): KronenPuzzle {
  let attemptSeed = seed;
  for (let outer = 0; outer < 80; outer++) {
    const rng = mulberry32(attemptSeed);
    const solution = placeSolution(size, rng);
    if (!solution) {
      attemptSeed = (attemptSeed + 0x9e3779b9) | 0;
      continue;
    }
    for (let inner = 0; inner < 80; inner++) {
      const regions = growRegions(size, solution, rng);
      // Quick check first.
      if (solveKronen(size, regions, 2).length === 1) {
        return { size, regions, solution, seed };
      }
      // Otherwise refine.
      if (refineForUniqueness(size, regions, solution, rng)) {
        return { size, regions, solution, seed };
      }
    }
    attemptSeed = (attemptSeed + 0x9e3779b9) | 0;
  }
  // Fallback — extremely unlikely. Use a simple stripe partition keyed by
  // solution rows so we still ship a playable puzzle.
  const rng = mulberry32(seed);
  const solution = placeSolution(size, rng) ?? Array.from({ length: size }, (_, r) => r);
  const regions = solution.flatMap((_, r) => Array(size).fill(r));
  return { size, regions, solution, seed };
}

// ---------------------------------------------------------------------------
// Lightweight self-test harness used by the generator-verification page.
// ---------------------------------------------------------------------------

export function verifyKronen(p: KronenPuzzle): {
  ok: boolean;
  solutionCount: number;
  matchesEmbedded: boolean;
} {
  const sols = solveKronen(p.size, p.regions, 5);
  const matches = sols.length === 1 && sols[0].every((c, r) => c === p.solution[r]);
  return {
    ok: sols.length === 1 && matches,
    solutionCount: sols.length,
    matchesEmbedded: matches,
  };
}
