// Trace generateZonMaan for size=6 to find why peel produces full-grid fallback.
import { solveZonMaan } from "../lib/games/zonmaan.ts";

// Inline the generator with logging.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function edgeKey(a, b) { return a < b ? `${a}:${b}` : `${b}:${a}`; }

function orthoNeighbours(idx, size) {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const out = [];
  if (r > 0) out.push(idx - size);
  if (r < size - 1) out.push(idx + size);
  if (c > 0) out.push(idx - 1);
  if (c < size - 1) out.push(idx + 1);
  return out;
}

function isLocallyValid(size, grid, edges, cell, v) {
  const r = Math.floor(cell / size);
  const c = cell % size;
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
  let rowSuns = 0, rowMoons = 0;
  for (let cc = 0; cc < size; cc++) {
    const idx = r * size + cc;
    const val = idx === cell ? v : grid[idx];
    if (val === 1) rowSuns++;
    else if (val === 0) rowMoons++;
  }
  if (rowSuns > size / 2 || rowMoons > size / 2) return false;
  let colSuns = 0, colMoons = 0;
  for (let rr = 0; rr < size; rr++) {
    const idx = rr * size + c;
    const val = idx === cell ? v : grid[idx];
    if (val === 1) colSuns++;
    else if (val === 0) colMoons++;
  }
  if (colSuns > size / 2 || colMoons > size / 2) return false;
  for (const nb of orthoNeighbours(cell, size)) {
    const k = edgeKey(cell, nb);
    const constraint = edges[k];
    if (!constraint) continue;
    const other = grid[nb];
    if (other === -1) continue;
    if (constraint === "=" && other !== v) return false;
    if (constraint === "x" && other === v) return false;
  }
  return true;
}

function buildSolution(size, rng) {
  const N = size * size;
  const grid = new Array(N).fill(-1);
  let aborted = false;
  let steps = 0;

  function recurse(idx) {
    if (aborted) return false;
    if (++steps > 500_000) { aborted = true; return false; }
    if (idx === N) return true;
    const order = rng() < 0.5 ? [0, 1] : [1, 0];
    for (const v of order) {
      if (isLocallyValid(size, grid, {}, idx, v)) {
        grid[idx] = v;
        if (recurse(idx + 1)) return true;
        grid[idx] = -1;
      }
    }
    return false;
  }
  return recurse(0) ? grid : null;
}

// Minimal trace.
const size = 6;
let s = 4000;
const rng = mulberry32(s);
console.log("buildSolution start...");
const t0 = Date.now();
const solution = buildSolution(size, rng);
console.log("buildSolution done in", Date.now() - t0, "ms ->", solution ? "ok" : "NULL");
if (!solution) process.exit();

const N = size * size;
const clues = {};
for (let i = 0; i < N; i++) clues[i] = solution[i];
const edges = {};
const allEdges = [];
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
console.log("starting clues:", Object.keys(clues).length, "edges:", Object.keys(edges).length);

let progress = true;
let pass = 0;
while (progress) {
  progress = false;
  pass++;
  let removedThisPass = 0;
  const cellOrder = Array.from({ length: N }, (_, i) => i);
  shuffleInPlace(cellOrder, rng);
  const tPass = Date.now();
  for (const cell of cellOrder) {
    if (!(cell in clues)) continue;
    const saved = clues[cell];
    delete clues[cell];
    const sols = solveZonMaan(size, clues, edges, 2);
    if (sols.length !== 1) {
      clues[cell] = saved;
    } else {
      progress = true;
      removedThisPass++;
    }
  }
  console.log(`pass ${pass}: removed=${removedThisPass} remaining=${Object.keys(clues).length} (${Date.now() - tPass}ms)`);
}
console.log("final clues:", Object.keys(clues).length, "of", N);
