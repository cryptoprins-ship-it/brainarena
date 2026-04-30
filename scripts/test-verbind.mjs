import { generateVerbind, verifyVerbind } from "../lib/games/verbind.ts";

const SIZES = { easy: 5, medium: 6, hard: 7 };
let pass = 0, fail = 0;
for (const [diff, size] of Object.entries(SIZES)) {
  for (let seed = 3000; seed < 3010; seed++) {
    const t0 = Date.now();
    const puzzle = generateVerbind(size, seed);
    const ms = Date.now() - t0;
    const v = verifyVerbind(puzzle);
    const tag = v.ok ? "ok" : "FAIL";
    if (v.ok) pass++; else fail++;
    console.log(
      `[${tag}] verbind ${diff} (${size}×${size}) seed=${seed}  ` +
      `solutions=${v.solutionCount} checkpoints=${puzzle.checkpoints.length - 1} (${ms}ms)`
    );
  }
}
console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail ? 1 : 0);
