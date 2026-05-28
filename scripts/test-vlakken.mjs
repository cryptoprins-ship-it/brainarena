// Property-test for the Vlakken puzzle generator.
//
// Generates N seeds per difficulty and asserts every result is uniquely
// solvable (verifyVlakken().ok === true). Mirrors the difficulty
// configuration used by app/vlakken/page.tsx so this catches the same
// puzzles that would actually ship to players.
//
// Run via:  node scripts/test-vlakken.mjs
// CI wires this into .github/workflows/ci.yml.

import { generateVlakken, verifyVlakken } from "../lib/games/vlakken.ts";

// MUST stay in sync with SIZE_FOR / FLEX_FOR / HIDE_FOR in
// app/vlakken/page.tsx, otherwise this test validates a different
// puzzle distribution than production.
const DIFFS = {
  easy:   { size: 5, flex: 0.30, hide: 0 },
  medium: { size: 6, flex: 0.60, hide: 1 },
  hard:   { size: 8, flex: 0.85, hide: 2 },
};

const SEEDS_PER_DIFF = 500;
const START_SEED = 1;

let pass = 0;
let fail = 0;
const failures = [];

for (const [name, cfg] of Object.entries(DIFFS)) {
  for (let seed = START_SEED; seed < START_SEED + SEEDS_PER_DIFF; seed++) {
    try {
      const puzzle = generateVlakken(cfg.size, seed, cfg.flex, cfg.hide);
      const v = verifyVlakken(puzzle);
      if (v.ok) {
        pass++;
      } else {
        fail++;
        failures.push({ name, seed, reason: `solutions=${v.solutionCount}` });
      }
    } catch (err) {
      fail++;
      failures.push({ name, seed, reason: `throw: ${err.message}` });
    }
  }
}

console.log(`vlakken property-test: ${pass} pass, ${fail} fail (${SEEDS_PER_DIFF} seeds × 3 difficulties)`);
for (const f of failures.slice(0, 20)) {
  console.error(`  FAIL  ${f.name}  seed=${f.seed}  ${f.reason}`);
}
if (failures.length > 20) console.error(`  ... and ${failures.length - 20} more`);

process.exit(fail ? 1 : 0);
