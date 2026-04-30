import { generateZonMaan, verifyZonMaan } from "../lib/games/zonmaan.ts";

const SIZES = { easy: 4, medium: 6, hard: 8 };
let pass = 0, fail = 0;
for (const [diff, size] of Object.entries(SIZES)) {
  for (let seed = 4000; seed < 4010; seed++) {
    const t0 = Date.now();
    const puzzle = generateZonMaan(size, seed);
    const ms = Date.now() - t0;
    const v = verifyZonMaan(puzzle);
    const tag = v.ok ? "ok" : "FAIL";
    if (v.ok) pass++; else fail++;
    console.log(
      `[${tag}] zonmaan ${diff} (${size}×${size}) seed=${seed}  ` +
      `solutions=${v.solutionCount} clues=${v.clueCount}/${size * size} edges=${v.edgeCount} (${ms}ms)`
    );
  }
}
console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail ? 1 : 0);
