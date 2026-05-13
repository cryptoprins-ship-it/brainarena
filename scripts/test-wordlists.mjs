#!/usr/bin/env node
// Validate the generated wordlists against the per-locale invariants the
// runtime depends on. Cheap, deterministic, no network — run after
// scripts/generate-wordlists.mjs to confirm the output is shippable.
//
//   node scripts/test-wordlists.mjs

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT_DIR = join(ROOT, "data", "wordlists");

// Same post-fold alphabet the generator targets. ñ stays for es, ß for
// de, ç for fr/pt-BR; everything else folds to a-z.
const ALPHABETS = {
  en: /^[a-z]+$/,
  nl: /^[a-z]+$/,
  de: /^[a-zß]+$/,
  fr: /^[a-zç]+$/,
  es: /^[a-zñ]+$/,
  "pt-BR": /^[a-zç]+$/,
};

const MIN_SOLUTIONS = 1000;
const MIN_GUESSES = 3000;

let failures = 0;
function fail(locale, msg) {
  console.error(`  ✗ ${locale}: ${msg}`);
  failures++;
}

for (const locale of Object.keys(ALPHABETS)) {
  console.log(`[${locale}]`);
  const sol = JSON.parse(readFileSync(join(OUT_DIR, locale, "solutions.json"), "utf8"));
  const gss = JSON.parse(readFileSync(join(OUT_DIR, locale, "guesses.json"), "utf8"));
  const stats = JSON.parse(readFileSync(join(OUT_DIR, locale, "stats.json"), "utf8"));
  const alpha = ALPHABETS[locale];

  // 1. Every word is exactly 5 code points + matches the alphabet.
  for (const w of sol) {
    if (typeof w !== "string") fail(locale, `non-string in solutions: ${JSON.stringify(w)}`);
    else if ([...w].length !== 5) fail(locale, `solution wrong length: "${w}"`);
    else if (!alpha.test(w)) fail(locale, `solution outside alphabet: "${w}"`);
  }
  for (const w of gss) {
    if (typeof w !== "string") fail(locale, `non-string in guesses: ${JSON.stringify(w)}`);
    else if ([...w].length !== 5) fail(locale, `guess wrong length: "${w}"`);
    else if (!alpha.test(w)) fail(locale, `guess outside alphabet: "${w}"`);
  }

  // 2. Each list is deduplicated.
  if (new Set(sol).size !== sol.length) fail(locale, `duplicates in solutions`);
  if (new Set(gss).size !== gss.length) fail(locale, `duplicates in guesses`);

  // 3. solutions ⊆ guesses (the player can always type a daily target).
  const gssSet = new Set(gss);
  for (const w of sol) {
    if (!gssSet.has(w)) fail(locale, `solution "${w}" missing from guesses`);
  }

  // 4. Volume thresholds.
  if (sol.length < MIN_SOLUTIONS) fail(locale, `solutions=${sol.length} < ${MIN_SOLUTIONS}`);
  if (gss.length < MIN_GUESSES) fail(locale, `guesses=${gss.length} < ${MIN_GUESSES}`);

  // 5. stats.counts agrees with the file sizes.
  if (stats.counts.solutions !== sol.length) fail(locale, `stats.counts.solutions=${stats.counts.solutions} ≠ ${sol.length}`);
  if (stats.counts.guesses !== gss.length) fail(locale, `stats.counts.guesses=${stats.counts.guesses} ≠ ${gss.length}`);

  console.log(`  ok: ${sol.length} solutions, ${gss.length} guesses`);
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall checks passed.");
