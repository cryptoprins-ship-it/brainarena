// Verbind — Hamiltonian path puzzle.
//
// Given an N×N grid with K numbered checkpoints (1, 2, ..., K), the player
// traces ONE continuous path through orthogonally adjacent cells that:
//   - visits every cell exactly once (Hamiltonian);
//   - passes through the checkpoints in numerical order.
//
// Generator pipeline:
//   1. Build a random Hamiltonian path on the grid via Warnsdorff-flavoured
//      random walk with backtracking.
//   2. Place K checkpoints at positions along that path (start, end, and a
//      few intermediate).
//   3. Verify uniqueness: solver counts paths consistent with the
//      checkpoints (cap at 2). If multiple, add another checkpoint at a
//      cell where the alternative path differs.

export type VerbindPuzzle = {
  size: number;
  // checkpoints: indexed by checkpoint number 1..K, value = cell index.
  // checkpoints[0] is unused (we use 1-based for clarity in printable form).
  checkpoints: number[];
  // The intended Hamiltonian path; pathOrder[stepIdx] = cell index.
  // pathOrder[0] is checkpoint 1, pathOrder[N*N - 1] is checkpoint K.
  pathOrder: number[];
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

// Build a Hamiltonian path covering every cell, starting at `start`. Uses a
// Warnsdorff heuristic (move to the neighbour with fewest onward options)
// with random tie-breaking, plus shallow backtracking. Bails out after a
// step budget so a bad seed cannot hang the generator.
function buildPath(size: number, start: number, rng: () => number, budget = 250_000): number[] | null {
  const N = size * size;
  const visited = new Array<boolean>(N).fill(false);
  const path: number[] = [];
  let steps = 0;
  let aborted = false;

  function options(cell: number): number[] {
    return neighbours4(cell, size).filter((n) => !visited[n]);
  }

  function recurse(cell: number, depth: number): boolean {
    if (aborted) return false;
    if (++steps > budget) { aborted = true; return false; }
    visited[cell] = true;
    path.push(cell);
    if (depth === N) return true;
    const opts = options(cell);
    opts.sort((a, b) => {
      const da = options(a).length - options(b).length;
      if (da !== 0) return da;
      return rng() < 0.5 ? -1 : 1;
    });
    for (const next of opts) {
      if (recurse(next, depth + 1)) return true;
      if (aborted) break;
    }
    path.pop();
    visited[cell] = false;
    return false;
  }

  const ok = recurse(start, 1);
  return ok ? path : null;
}

// Solver — counts Hamiltonian paths in the grid that pass through the listed
// checkpoints in order. Returns up to `cap` complete paths. Bails out after
// `stepBudget` recursion steps so the generator never hangs on a hard board.
export function solveVerbind(
  size: number,
  checkpoints: number[],
  cap = 2,
  stepBudget = 4_000_000
): number[][] {
  const N = size * size;
  if (checkpoints.length < 2) return [];
  const cells = checkpoints.slice(1);
  const start = cells[0];
  const checkpointSet = new Set(cells);
  const totalCheckpoints = cells.length;

  const visited = new Array<boolean>(N).fill(false);
  const found: number[][] = [];
  const path: number[] = [];
  let steps = 0;
  let aborted = false;

  function recurse(cell: number, nextCheckpointIdx: number) {
    if (aborted || found.length >= cap) return;
    if (++steps > stepBudget) { aborted = true; return; }
    visited[cell] = true;
    path.push(cell);
    let nextIdx = nextCheckpointIdx;
    if (nextIdx < totalCheckpoints && cell === cells[nextIdx]) {
      nextIdx++;
    } else if (checkpointSet.has(cell)) {
      visited[cell] = false;
      path.pop();
      return;
    }
    if (path.length === N) {
      if (nextIdx === totalCheckpoints) found.push([...path]);
    } else {
      const nbs = neighbours4(cell, size).filter((n) => !visited[n]);
      nbs.sort(
        (a, b) =>
          neighbours4(a, size).filter((n) => !visited[n]).length -
          neighbours4(b, size).filter((n) => !visited[n]).length
      );
      for (const nb of nbs) {
        recurse(nb, nextIdx);
        if (found.length >= cap || aborted) break;
      }
    }
    visited[cell] = false;
    path.pop();
  }

  // nextCheckpointIdx starts at 0: we have not yet "consumed" any checkpoint.
  // The first recursion step (which places `start`) will advance it to 1
  // because start is the first checkpoint by construction.
  recurse(start, 0);
  return found;
}

export function generateVerbind(size: number, seed: number, numCheckpoints?: number): VerbindPuzzle {
  const N = size * size;
  // Default checkpoint count scales superlinearly with grid size so the
  // solver's search space stays bounded. Below ~size*1.5 the solver explodes
  // for 7×7+; ~size*2 keeps generation in tens of milliseconds while still
  // leaving the player meaningful path-deduction work.
  const K =
    numCheckpoints ??
    (size <= 5 ? Math.max(4, Math.round(size * 1.4)) :
     size === 6 ? Math.round(size * 1.7) :
                  Math.round(size * 2.2));
  let s = seed;
  for (let outer = 0; outer < 60; outer++) {
    const rng = mulberry32(s);
    // Pick a random start; bias toward corners which yield richer paths.
    const cornerStarts = [0, size - 1, (size - 1) * size, size * size - 1];
    const start = rng() < 0.6 ? cornerStarts[Math.floor(rng() * 4)] : Math.floor(rng() * N);
    const path = buildPath(size, start, rng);
    if (!path) {
      s = (s + 0x9e3779b9) | 0;
      continue;
    }
    // Place checkpoints: always include path[0] and path[N-1]; sprinkle the
    // rest at evenly-ish spaced positions with small jitter.
    const checkpoints: number[] = [0, path[0]]; // 1-based: checkpoints[1] is start
    for (let i = 1; i < K - 1; i++) {
      const ideal = Math.floor((i / (K - 1)) * (N - 1));
      const jitter = Math.floor((rng() - 0.5) * Math.max(2, Math.floor(N / (K * 2))));
      const pos = Math.max(1, Math.min(N - 2, ideal + jitter));
      // avoid duplicates
      if (!checkpoints.includes(path[pos])) checkpoints.push(path[pos]);
    }
    if (!checkpoints.includes(path[N - 1])) checkpoints.push(path[N - 1]);
    // Re-order checkpoints by their position along the path so the numbers
    // match the actual order of the embedded path.
    const positions = checkpoints.slice(1).map((cell) => path.indexOf(cell));
    const sorted = positions
      .map((p, i) => ({ p, cell: checkpoints[i + 1] }))
      .sort((a, b) => a.p - b.p);
    const orderedCheckpoints = [0, ...sorted.map((x) => x.cell)];
    // Verify uniqueness.
    let solutions = solveVerbind(size, orderedCheckpoints, 2);
    if (solutions.length === 1) {
      return { size, checkpoints: orderedCheckpoints, pathOrder: path, seed };
    }
    if (solutions.length === 0) {
      // shouldn't happen — the embedded path is a solution. Reseed.
      s = (s + 0x9e3779b9) | 0;
      continue;
    }
    // Try adding extra checkpoints on cells where the alternative path
    // disagrees with ours, until uniqueness is reached.
    for (let refine = 0; refine < 30 && solutions.length > 1; refine++) {
      const alt = solutions.find((p) => p.some((c, i) => c !== path[i]));
      if (!alt) break;
      // Find first position where they differ; pick a cell on the embedded
      // path at that step and add it as a checkpoint (preserving order).
      let diffIdx = -1;
      for (let i = 0; i < N; i++) {
        if (alt[i] !== path[i]) { diffIdx = i; break; }
      }
      if (diffIdx < 0) break;
      const newCheckpointCell = path[diffIdx];
      if (!orderedCheckpoints.includes(newCheckpointCell)) {
        orderedCheckpoints.splice(0); // rebuild
        const positions2 = [path[0], path[N - 1], newCheckpointCell, ...checkpoints.slice(1)];
        const uniq = Array.from(new Set(positions2));
        const sorted2 = uniq.map((cell) => ({ p: path.indexOf(cell), cell })).sort((a, b) => a.p - b.p);
        orderedCheckpoints.push(0, ...sorted2.map((x) => x.cell));
        // reflect into checkpoints for next refinement iteration
        checkpoints.length = 0;
        checkpoints.push(0, ...sorted2.map((x) => x.cell));
      } else {
        break; // no improvement possible
      }
      solutions = solveVerbind(size, orderedCheckpoints, 2);
    }
    if (solutions.length === 1) {
      return { size, checkpoints: orderedCheckpoints, pathOrder: path, seed };
    }
    s = (s + 0x9e3779b9) | 0;
  }
  // Fallback: every cell is a checkpoint along the embedded path → trivially
  // unique (and trivial to "solve", but at least playable).
  const rng = mulberry32(seed);
  const path = buildPath(size, 0, rng) ?? Array.from({ length: N }, (_, i) => i);
  const cps = [0, ...path];
  return { size, checkpoints: cps, pathOrder: path, seed };
}

export function verifyVerbind(p: VerbindPuzzle): {
  ok: boolean;
  solutionCount: number;
  matchesEmbedded: boolean;
} {
  const sols = solveVerbind(p.size, p.checkpoints, 5);
  const matches = sols.length === 1 && sols[0].every((c, i) => c === p.pathOrder[i]);
  return { ok: sols.length === 1 && matches, solutionCount: sols.length, matchesEmbedded: matches };
}
