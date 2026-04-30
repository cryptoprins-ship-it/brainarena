import { generateVlakken, verifyVlakken } from "../lib/games/vlakken.ts";

const SIZES = { easy: 6, medium: 7, hard: 9 };
let pass = 0, fail = 0;
for (const [diff, size] of Object.entries(SIZES)) {
  for (let seed = 2000; seed < 2010; seed++) {
    const t0 = Date.now();
    const puzzle = generateVlakken(size, seed);
    const ms = Date.now() - t0;
    const v = verifyVlakken(puzzle);
    const tag = v.ok ? "ok" : "FAIL";
    if (v.ok) pass++; else fail++;
    console.log(
      `[${tag}] vlakken ${diff} (${size}×${size}) seed=${seed}  ` +
      `solutions=${v.solutionCount} anchors=${puzzle.anchors.length} (${ms}ms)`
    );
  }
}
console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail ? 1 : 0);
