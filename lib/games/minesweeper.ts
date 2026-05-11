// Minesweeper — classic mine-flag-and-uncover grid.
//
// Daily board layout is deterministic from `seed`, but the *first* click is
// guaranteed safe: when the player taps a cell, that cell's index goes into
// the seeded shuffle as a forbidden mine position. Two players who tap the
// same first cell on the same day get identical boards; players who tap a
// different first cell get a slightly different layout. The trade is
// strict leaderboard parity vs. never rage-losing on click #1 — given this
// is a casual puzzle site, the latter wins.

export type MinesweeperBoard = {
  rows: number;
  cols: number;
  mineCount: number;
  mines: Set<number>;   // cell index = r * cols + c
  adj: number[];        // length rows*cols; -1 if mine, otherwise 0..8
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

export function generateMinesweeper(
  rows: number,
  cols: number,
  mineCount: number,
  seed: number,
  firstClickIdx?: number
): MinesweeperBoard {
  const total = rows * cols;
  // Build the candidate pool minus the first-click cell (single-cell safety
  // is enough — the player can deal with a numbered cell at their start,
  // they just can't tolerate insta-losing).
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === firstClickIdx) continue;
    candidates.push(i);
  }
  const rng = mulberry32(seed);
  shuffleInPlace(candidates, rng);
  const mines = new Set<number>(candidates.slice(0, Math.min(mineCount, candidates.length)));

  const adj = new Array<number>(total).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (mines.has(idx)) {
        adj[idx] = -1;
        continue;
      }
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          if (mines.has(nr * cols + nc)) count++;
        }
      }
      adj[idx] = count;
    }
  }

  return { rows, cols, mineCount, mines, adj, seed };
}

// BFS flood reveal from startIdx. Numbered cells are revealed but stop the
// flood; zero cells propagate to all 8 neighbours. Mines are never included
// (caller's responsibility to handle mine-hit before invoking flood).
export function floodReveal(board: MinesweeperBoard, startIdx: number): number[] {
  const out: number[] = [];
  const visited = new Set<number>();
  const queue: number[] = [startIdx];
  while (queue.length) {
    const i = queue.shift()!;
    if (visited.has(i)) continue;
    visited.add(i);
    if (board.mines.has(i)) continue;
    out.push(i);
    if (board.adj[i] !== 0) continue;
    const r = Math.floor(i / board.cols);
    const c = i % board.cols;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= board.rows || nc >= board.cols) continue;
        const j = nr * board.cols + nc;
        if (!visited.has(j)) queue.push(j);
      }
    }
  }
  return out;
}

// "Chord" reveal — when the player double-clicks (or taps in chord mode) a
// numbered cell whose neighbouring flags count equals the cell's number,
// reveal all *unflagged* neighbours. Returns the indices to reveal; if any
// of them is a mine, the caller treats it as a loss.
export function chordTargets(
  board: MinesweeperBoard,
  idx: number,
  flagged: Set<number>
): number[] | null {
  const n = board.adj[idx];
  if (n <= 0) return null;
  const r = Math.floor(idx / board.cols);
  const c = idx % board.cols;
  const neighbours: number[] = [];
  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= board.rows || nc >= board.cols) continue;
      const j = nr * board.cols + nc;
      if (flagged.has(j)) flagCount++;
      else neighbours.push(j);
    }
  }
  return flagCount === n ? neighbours : null;
}
