// Quick smoke test for the Kronen generator. Loads the source and runs
// `verifyKronen` on 10 seeds × 3 difficulties, logging any failures.
//
// Run with: node scripts/test-kronen.mjs

import { generateKronen, verifyKronen } from "../lib/games/kronen.ts";

const SIZES = { easy: 6, medium: 8, hard: 10 };

let pass = 0;
let fail = 0;
for (const [diff, size] of Object.entries(SIZES)) {
  for (let seed = 1000; seed < 1010; seed++) {
    const t0 = Date.now();
    const puzzle = generateKronen(size, seed);
    const ms = Date.now() - t0;
    const v = verifyKronen(puzzle);
    const tag = v.ok ? "ok" : "FAIL";
    if (v.ok) pass++;
    else fail++;
    console.log(
      `[${tag}] kronen ${diff} (${size}×${size}) seed=${seed}  ` +
      `solutions=${v.solutionCount} matchEmbedded=${v.matchesEmbedded} (${ms}ms)`
    );
  }
}
console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail ? 1 : 0);
