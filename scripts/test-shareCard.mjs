// Smoke test for the share-card headline values (pure functions, no
// browser/canvas needed) and the native-share file-attachment fallback
// logic (Task 2 appends to this file).
//
// Run with: node scripts/test-shareCard.mjs

import { SHARE_HEADLINES } from "../lib/share.ts";

let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`[FAIL] ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

check("wordle win", SHARE_HEADLINES.wordle({ score: 0, meta: { won: true, guesses: 4 } }), "4/6");
check("wordle loss", SHARE_HEADLINES.wordle({ score: 0, meta: { won: false } }), "X/6");
check("boggle", SHARE_HEADLINES.boggle({ score: 87, meta: { found: 12 } }), "87");
check("sudoku", SHARE_HEADLINES.sudoku({ score: 0, time: 154 }), "2:34");
check("typing", SHARE_HEADLINES.typing({ score: 62, meta: { accuracy: 97 } }), "62 WPM");
check("tiledrop", SHARE_HEADLINES.tiledrop({ score: 4200 }), "4200");
check("colormatch", SHARE_HEADLINES.colormatch({ score: 1246 }), "1246");
check("letterstack", SHARE_HEADLINES.letterstack({ score: 340 }), "340");
check("vlakken", SHARE_HEADLINES.vlakken({ score: 0, time: 95 }), "1:35");
check("verbind", SHARE_HEADLINES.verbind({ score: 0, time: 42 }), "0:42");
check("zonmaan", SHARE_HEADLINES.zonmaan({ score: 0, time: 200 }), "3:20");
check("kronen", SHARE_HEADLINES.kronen({ score: 0, time: 88 }), "1:28");
check("minesweeper win", SHARE_HEADLINES.minesweeper({ score: 0, time: 61, meta: { won: true } }), "1:01");
check("minesweeper loss", SHARE_HEADLINES.minesweeper({ score: 0, meta: { won: false } }), "💥");
check("connections win", SHARE_HEADLINES.connections({ score: 4 }), "4/4");
check("connections partial", SHARE_HEADLINES.connections({ score: 2 }), "2/4");

console.log(`\nShare-card headline tests: PASS ${pass} · FAIL ${fail}`);
if (fail > 0) process.exit(1);
