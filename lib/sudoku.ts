// Lightweight daily Sudoku generator: derive a valid solution from a base
// pattern + seeded transformations, then mask cells based on difficulty.

export type Difficulty = "easy" | "medium" | "hard";

const N = 9;
const BASE = 3;

function pattern(r: number, c: number) {
  return (BASE * (r % BASE) + Math.floor(r / BASE) + c) % N;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSolution(seed: number): number[][] {
  const rng = mulberry32(seed);
  const rBase = [0, 1, 2];
  const rows = shuffle(rBase, rng).flatMap((g) =>
    shuffle(rBase, rng).map((r) => g * BASE + r)
  );
  const cols = shuffle(rBase, rng).flatMap((g) =>
    shuffle(rBase, rng).map((c) => g * BASE + c)
  );
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);

  return rows.map((r) => cols.map((c) => nums[pattern(r, c)]));
}

const HOLES: Record<Difficulty, number> = {
  easy: 36,    // ~45 clues remain
  medium: 48,  // ~33 clues
  hard: 56,    // ~25 clues
};

export type Cell = { value: number; given: boolean };

export function generateDaily(difficulty: Difficulty, seed: number): {
  puzzle: Cell[][];
  solution: number[][];
} {
  const solution = buildSolution(seed);
  const rng = mulberry32(seed * 17 + 9);
  const positions = shuffle(
    Array.from({ length: N * N }, (_, i) => i),
    rng
  );
  const holes = HOLES[difficulty];
  const grid: Cell[][] = solution.map((row) =>
    row.map((v) => ({ value: v, given: true }))
  );
  for (let i = 0; i < holes; i++) {
    const idx = positions[i];
    const r = Math.floor(idx / N);
    const c = idx % N;
    grid[r][c] = { value: 0, given: false };
  }
  return { puzzle: grid, solution };
}
