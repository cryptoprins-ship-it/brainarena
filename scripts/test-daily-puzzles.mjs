// 365-day puzzle smoke test.
//
// Walks dayIdx forward by 365 days from today and asserts every
// (game × difficulty) combination produces a uniquely solvable puzzle
// using the same seed formula as the live page. Catches seed-specific
// generator gaps before they hit production.
//
// Run via:  node scripts/test-daily-puzzles.mjs
// Wired into .github/workflows/ci.yml.

import { generateVlakken, verifyVlakken } from "../lib/games/vlakken.ts";
import { dayIndex } from "../lib/games/kronen.ts";

const DAYS = 365;
const today = dayIndex();

// Vlakken seed formula must mirror app/vlakken/page.tsx:
//   seed = dayIndex() * 1303 + DIFF_INDEX[difficulty] * 19 + seedNonce
// SIZE_FOR / FLEX_FOR / HIDE_FOR are also duplicated here. Keep in sync.
const VLAKKEN_DIFFS = {
  easy:   { idx: 0, size: 5, flex: 0.30, hide: 0 },
  medium: { idx: 1, size: 6, flex: 0.60, hide: 1 },
  hard:   { idx: 2, size: 8, flex: 0.85, hide: 2 },
};

let pass = 0;
let fail = 0;
const failures = [];

for (let offset = 0; offset < DAYS; offset++) {
  const dayIdx = today + offset;
  for (const [name, cfg] of Object.entries(VLAKKEN_DIFFS)) {
    const seed = dayIdx * 1303 + cfg.idx * 19;
    try {
      const puzzle = generateVlakken(cfg.size, seed, cfg.flex, cfg.hide);
      const v = verifyVlakken(puzzle);
      if (v.ok) {
        pass++;
      } else {
        fail++;
        failures.push({ game: "vlakken", diff: name, dayIdx, seed, reason: `solutions=${v.solutionCount}` });
      }
    } catch (err) {
      fail++;
      failures.push({ game: "vlakken", diff: name, dayIdx, seed, reason: `throw: ${err.message}` });
    }
  }
}

console.log(`daily-puzzles smoke: ${pass} pass, ${fail} fail (${DAYS} days × vlakken 3 difficulties)`);
for (const f of failures.slice(0, 20)) {
  console.error(`  FAIL  ${f.game}/${f.diff}  dayIdx=${f.dayIdx}  seed=${f.seed}  ${f.reason}`);
}
if (failures.length > 20) console.error(`  ... and ${failures.length - 20} more`);

process.exit(fail ? 1 : 0);
