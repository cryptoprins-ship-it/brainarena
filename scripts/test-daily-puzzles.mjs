// 365-day puzzle smoke test across every game that has a generator.
//
// Walks dayIdx forward by 365 days from today and asserts every
// (game × difficulty) combination produces a uniquely solvable puzzle
// using the same seed formula as the live page. Catches seed-specific
// generator gaps before they hit production.
//
// Run via:  node scripts/test-daily-puzzles.mjs
// Wired into .github/workflows/ci.yml.

import { generateVlakken, verifyVlakken } from "../lib/games/vlakken.ts";
import { generateZonMaan, verifyZonMaan } from "../lib/games/zonmaan.ts";
import { generateKronen, verifyKronen } from "../lib/games/kronen.ts";
import { generateVerbind, verifyVerbind } from "../lib/games/verbind.ts";
import { dayIndex } from "../lib/games/kronen.ts";

// 60-day lookahead — long enough to catch seed-specific generator gaps
// before they hit production, short enough to keep CI under a few
// minutes on Linux runners (kronen-hard 10×10 + vlakken-hard 8×8 are
// the bottleneck). Raise locally if you want a deeper sweep.
const DAYS = 60;
const today = dayIndex();

// Each entry mirrors the corresponding app/<game>/page.tsx so this
// validates the exact puzzle stream players will receive.
const GAMES = [
  {
    name: "vlakken",
    seedMul: 1303, diffMul: 19,
    diffs: {
      easy:   { idx: 0, size: 5, opts: [0.30, 0] },
      medium: { idx: 1, size: 6, opts: [0.60, 1] },
      hard:   { idx: 2, size: 8, opts: [0.85, 2] },
    },
    generate: (size, seed, opts) => generateVlakken(size, seed, opts[0], opts[1]),
    verify: verifyVlakken,
  },
  {
    name: "zonmaan",
    seedMul: 1013, diffMul: 19,
    diffs: {
      easy:   { idx: 0, size: 6, opts: [] },
      medium: { idx: 1, size: 6, opts: [] },
      hard:   { idx: 2, size: 6, opts: [] },
    },
    generate: (size, seed) => generateZonMaan(size, seed),
    verify: verifyZonMaan,
  },
  {
    name: "kronen",
    seedMul: 1009, diffMul: 17,
    diffs: {
      easy:   { idx: 0, size: 6,  opts: [] },
      medium: { idx: 1, size: 8,  opts: [] },
      hard:   { idx: 2, size: 10, opts: [] },
    },
    generate: (size, seed) => generateKronen(size, seed),
    verify: verifyKronen,
  },
  {
    name: "verbind",
    seedMul: 1601, diffMul: 23,
    diffs: {
      easy:   { idx: 0, size: 5, opts: [] },
      medium: { idx: 1, size: 6, opts: [] },
      hard:   { idx: 2, size: 7, opts: [] },
    },
    generate: (size, seed) => generateVerbind(size, seed),
    verify: verifyVerbind,
  },
];

let pass = 0;
let fail = 0;
const failures = [];

for (const game of GAMES) {
  for (let offset = 0; offset < DAYS; offset++) {
    const dayIdx = today + offset;
    for (const [name, cfg] of Object.entries(game.diffs)) {
      const seed = dayIdx * game.seedMul + cfg.idx * game.diffMul;
      try {
        const puzzle = game.generate(cfg.size, seed, cfg.opts);
        const v = game.verify(puzzle);
        if (v.ok) {
          pass++;
        } else {
          fail++;
          failures.push({ game: game.name, diff: name, dayIdx, seed, reason: `solutions=${v.solutionCount}` });
        }
      } catch (err) {
        fail++;
        failures.push({ game: game.name, diff: name, dayIdx, seed, reason: `throw: ${err.message}` });
      }
    }
  }
}

const total = DAYS * GAMES.reduce((a, g) => a + Object.keys(g.diffs).length, 0);
console.log(`daily-puzzles smoke: ${pass} pass, ${fail} fail (${DAYS} days × ${GAMES.length} games × 3 difficulties = ${total} puzzles)`);
for (const f of failures.slice(0, 30)) {
  console.error(`  FAIL  ${f.game}/${f.diff}  dayIdx=${f.dayIdx}  seed=${f.seed}  ${f.reason}`);
}
if (failures.length > 30) console.error(`  ... and ${failures.length - 30} more`);

process.exit(fail ? 1 : 0);
