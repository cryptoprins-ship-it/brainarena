import { generateZonMaan, solveZonMaan, verifyZonMaan } from "../lib/games/zonmaan.ts";

// Generate a 6×6 puzzle and try to remove ONE clue manually to see if solver
// returns 1 solution.
const p = generateZonMaan(6, 4000);
console.log("clues:", Object.keys(p.clues).length, "edges:", Object.keys(p.edges).length);

// Make a copy and remove the cell at index 0.
const clues2 = { ...p.clues };
const removed = clues2[0];
delete clues2[0];
console.log("after removing cell 0 (value", removed, "), clues:", Object.keys(clues2).length);

const t0 = Date.now();
const sols = solveZonMaan(6, clues2, p.edges, 5);
console.log("solver returned", sols.length, "solutions in", Date.now() - t0, "ms");
if (sols.length > 0) {
  console.log("first solution row 0:", sols[0].slice(0, 6));
  console.log("expected row 0:", p.solution.slice(0, 6));
}
