#!/usr/bin/env node
// Generate Wordle wordlists per locale.
//
// Run with: node scripts/generate-wordlists.mjs
//
// Idempotent: given the same upstream source file content, output JSON is
// byte-identical. Source files are cached to data/wordlists/.cache/ so a
// rerun without network access still works.
//
// Outputs (commit these to the repo, the runtime reads them):
//   data/wordlists/{locale}/solutions.json   ordered, frequency-ranked,
//                                            slur-filtered, locale-shuffled
//   data/wordlists/{locale}/guesses.json     sorted, unique, every valid
//                                            5-letter word from the source
//   data/wordlists/{locale}/stats.json       counts, source, license, hashes
//
// Sources:
//   1. hermitdave/FrequencyWords (OpenSubtitles 2018), CC BY-SA 4.0.
//      One source for all six locales keeps normalisation consistent.
//      Every frequency-weighted entry is lowercase, space-separated
//      `word count`. Drives both the GUESSES set and the frequency rank
//      that orders SOLUTIONS.
//   2. wooorm/dictionaries (hunspell-format), MIT.
//      Used only as a SOLUTIONS gate: entries that start with a capital
//      are proper nouns / acronyms in hunspell, and OpenSubtitles is
//      flooded with character names ("Kevin", "Laura" all in lowercase
//      after our normalise step). Intersecting the top-frequency 5-letter
//      words with the lowercase-leading hunspell entries cuts the bulk of
//      that noise without hand-curation.

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT_DIR = join(ROOT, "data", "wordlists");
const CACHE_DIR = join(OUT_DIR, ".cache");

// Pin to current master content; each download's sha256 is recorded in
// stats.json so a content drift upstream is auditable.
const FREQ_BASE =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018";
const DIC_BASE =
  "https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries";

// Per-locale config. `alphabet` is the post-normalisation character class
// that a candidate must consist entirely of; `seed` deterministically
// shuffles the per-locale solutions so each locale gets its own daily
// rotation even though the underlying ranked set comes from the same
// source family.
// `dicLang` is the wooorm/dictionaries subdir. Mapping notes:
//   en  → en-GB  (en-US's index.dic is empty in upstream)
//   pt-BR → pt   (no pt-BR dict in upstream; pt covers most pt-BR spellings,
//                noted in stats.json)
//
// Per-locale folding (after lowercasing): vowel-diacritics are stripped
// to base ASCII so the existing keyboard layouts work without bolting on
// a row of accent keys; the "real" letters that carry semantic load —
// ñ in Spanish, ß in German, ç in French/Portuguese — are kept because
// they ARE separate letters in those alphabets. Ligatures (æ, œ) expand;
// length is checked post-fold so e.g. "œufs" survives as "oeufs".
const LOCALES = [
  {
    code: "en",
    freqLang: "en",
    dicLang: "en-GB",
    alphabet: /^[a-z]+$/,
    fold: {},
    seed: 0x454e_5f31, // "EN_1"
  },
  {
    code: "nl",
    freqLang: "nl",
    dicLang: "nl",
    alphabet: /^[a-z]+$/,
    fold: {},
    seed: 0x4e4c_5f31, // "NL_1"
  },
  {
    code: "de",
    freqLang: "de",
    dicLang: "de",
    alphabet: /^[a-zß]+$/,
    fold: { ä: "a", ö: "o", ü: "u" },
    seed: 0x4445_5f31, // "DE_1"
  },
  {
    code: "fr",
    freqLang: "fr",
    dicLang: "fr",
    alphabet: /^[a-zç]+$/,
    fold: {
      à: "a", â: "a", æ: "ae",
      é: "e", è: "e", ê: "e", ë: "e",
      î: "i", ï: "i",
      ô: "o", œ: "oe",
      ù: "u", û: "u", ü: "u", ÿ: "y",
    },
    seed: 0x4652_5f31, // "FR_1"
  },
  {
    code: "es",
    freqLang: "es",
    dicLang: "es",
    alphabet: /^[a-zñ]+$/,
    fold: { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" },
    seed: 0x4553_5f31, // "ES_1"
  },
  {
    code: "pt-BR",
    freqLang: "pt_br",
    dicLang: "pt",
    alphabet: /^[a-zç]+$/,
    fold: {
      á: "a", â: "a", ã: "a", à: "a",
      é: "e", ê: "e",
      í: "i",
      ó: "o", ô: "o", õ: "o",
      ú: "u",
    },
    seed: 0x5042_5f31, // "PB_1"
  },
];

const TARGET_SOLUTIONS = 2500;

// ---------------------------------------------------------------------------

async function fetchCached(url, cachePath) {
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf8");
  }
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, text);
  return text;
}

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

function applyFold(s, fold) {
  let out = "";
  for (const ch of s) out += fold[ch] ?? ch;
  return out;
}

// Per-locale normalisation:
//   * lowercase + trim
//   * fold vowel-diacritics + ligatures via locale.fold so the result
//     fits the keyboard the page renders (à/â/é/œ/… → ASCII; ñ/ß/ç stay)
//   * reject anything outside the post-fold alphabet (a-z + ñ/ß/ç)
//   * reject anything that isn't exactly 5 code points POST-fold —
//     this is what catches both "vijfde" (6 chars) and "œufs" → "oeufs"
//     (which correctly survives as 5)
// Returns "" for rejected inputs so callers can `if (!norm) continue`.
function normalize(raw, locale) {
  const lower = raw.toLowerCase().trim();
  const folded = applyFold(lower, locale.fold);
  if (!locale.alphabet.test(folded)) return "";
  if ([...folded].length !== 5) return "";
  return folded;
}

// mulberry32 — small, well-distributed, fully deterministic from a 32-bit
// seed. Used so each locale's "shuffle order of frequency-ranked
// solutions" is reproducible across runs and machines.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b_79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(items, seed) {
  const rng = mulberry32(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadSlurFilter(localeCode) {
  const path = join(OUT_DIR, `slur-filter-${localeCode}.json`);
  if (!existsSync(path)) return new Set();
  const data = JSON.parse(readFileSync(path, "utf8"));
  const terms = Array.isArray(data.terms) ? data.terms : [];
  return new Set(terms.map((t) => String(t).toLowerCase()));
}

// Stringify with stable formatting (sorted top-level keys, two-space
// indent) so JSON diffs across reruns are clean.
function stableStringify(obj) {
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
  }
  return JSON.stringify(obj);
}

function writePretty(path, obj) {
  // Pretty-print arrays of strings as one-per-line for readable diffs.
  if (Array.isArray(obj)) {
    writeFileSync(path, "[\n" + obj.map((w) => "  " + JSON.stringify(w)).join(",\n") + "\n]\n");
    return;
  }
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

// Parse a hunspell .dic file: first line is a count, then `word[/flags]`
// per line. Returns the set of base words whose first character is
// lowercase (i.e. NOT proper nouns / acronyms in hunspell convention),
// folded via the locale's normaliser so the set matches the frequency
// pipeline's keys (e.g. "école" hunspell entry ↔ "ecole" freq entry).
function parseHunspellCommonWords(text, locale) {
  const out = new Set();
  const lines = text.split(/\r?\n/);
  // Skip the count header if present.
  const start = /^\d+$/.test(lines[0]?.trim() ?? "") ? 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const slash = line.indexOf("/");
    const base = (slash >= 0 ? line.slice(0, slash) : line).trim();
    if (!base) continue;
    const first = base[0];
    // First character must be lowercase. This filters proper nouns
    // ("Kevin"), acronyms ("ABC"), and Roman numerals ("XIV").
    if (first !== first.toLowerCase()) continue;
    // Fold via locale rules but DON'T enforce 5-letter; the common-noun
    // set covers all word lengths since it's only used as a gate.
    const folded = applyFold(base.toLowerCase(), locale.fold);
    if (!folded) continue;
    out.add(folded);
  }
  return out;
}

async function generateOne(locale) {
  console.log(`\n[${locale.code}]`);
  const freqUrl = `${FREQ_BASE}/${locale.freqLang}/${locale.freqLang}_50k.txt`;
  const freqCache = join(CACHE_DIR, `freq_${locale.freqLang}_50k.txt`);
  const dicUrl = `${DIC_BASE}/${locale.dicLang}/index.dic`;
  const dicCache = join(CACHE_DIR, `dic_${locale.dicLang}.dic`);

  const [freqSrc, dicSrc] = await Promise.all([
    fetchCached(freqUrl, freqCache),
    fetchCached(dicUrl, dicCache),
  ]);
  const freqHash = sha256(freqSrc);
  const dicHash = sha256(dicSrc);

  // Parse `word count` per line, preserving frequency order.
  const seen = new Map(); // normalized word → cumulative frequency
  const lines = freqSrc.split(/\r?\n/);
  let raw = 0;
  for (const line of lines) {
    if (!line) continue;
    raw++;
    const sp = line.indexOf(" ");
    if (sp < 0) continue;
    const word = line.slice(0, sp);
    const count = Number(line.slice(sp + 1));
    if (!Number.isFinite(count)) continue;
    const norm = normalize(word, locale);
    if (!norm) continue;
    // Multiple source entries can normalise to the same word (rare with
    // pure lowercase OS frequency files but defensive against future
    // sources). Sum frequencies so ranking is stable.
    seen.set(norm, (seen.get(norm) ?? 0) + count);
  }

  const ranked = [...seen.entries()].sort((a, b) => b[1] - a[1]);
  const guesses = [...seen.keys()].sort();

  // Build the proper-noun filter from the hunspell base set.
  const commonWords = parseHunspellCommonWords(dicSrc, locale);

  const slurs = loadSlurFilter(locale.code);
  let slurFiltered = 0;
  let properNounFiltered = 0;
  const topRanked = [];
  for (const [w] of ranked) {
    if (slurs.has(w)) {
      slurFiltered++;
      continue;
    }
    // Solutions must appear as a lowercase-leading base form in the
    // language's hunspell dictionary. Drops names ("kevin"), foreign
    // tokens ("anand"), acronyms cast as 5-letter ("nasaa"), etc.
    if (!commonWords.has(w)) {
      properNounFiltered++;
      continue;
    }
    topRanked.push(w);
    if (topRanked.length >= TARGET_SOLUTIONS) break;
  }

  const solutions = deterministicShuffle(topRanked, locale.seed);

  // solutions ⊆ guesses sanity check.
  const guessSet = new Set(guesses);
  for (const s of solutions) {
    if (!guessSet.has(s)) {
      throw new Error(`solutions ⊄ guesses: "${s}" not in guesses for ${locale.code}`);
    }
  }

  // Output.
  const outDir = join(OUT_DIR, locale.code);
  mkdirSync(outDir, { recursive: true });
  writePretty(join(outDir, "solutions.json"), solutions);
  writePretty(join(outDir, "guesses.json"), guesses);

  const stats = {
    locale: locale.code,
    generated_at_utc_date: new Date().toISOString().slice(0, 10),
    sources: {
      frequency: {
        name: "hermitdave/FrequencyWords (OpenSubtitles 2018)",
        url: freqUrl,
        license: "CC BY-SA 4.0",
        content_sha256: freqHash,
      },
      hunspell_dictionary: {
        name: `wooorm/dictionaries/${locale.dicLang}`,
        url: dicUrl,
        license: "MIT",
        content_sha256: dicHash,
        note: locale.code === "pt-BR"
          ? "pt-BR hunspell missing upstream; pt (Portugal) used as approximation."
          : locale.code === "en"
          ? "en-GB used; en-US upstream index.dic is empty."
          : undefined,
      },
    },
    normalisation: {
      lowercase: true,
      reject_if_outside_alphabet: locale.alphabet.source,
      length_in_code_points: 5,
      keeps_accents: locale.code !== "en" && locale.code !== "nl",
    },
    counts: {
      source_lines: raw,
      distinct_5letter: seen.size,
      guesses: guesses.length,
      solutions: solutions.length,
      slur_filtered: slurFiltered,
      proper_noun_filtered: properNounFiltered,
    },
    shuffle_seed: locale.seed,
    output_sha256: {
      solutions: sha256(stableStringify(solutions)),
      guesses: sha256(stableStringify(guesses)),
    },
  };
  writeFileSync(join(outDir, "stats.json"), JSON.stringify(stats, null, 2) + "\n");

  // Validation thresholds — warn loudly if a locale is under-sourced.
  const warnings = [];
  if (solutions.length < 1000) warnings.push(`solutions=${solutions.length} < 1000`);
  if (guesses.length < 3000) warnings.push(`guesses=${guesses.length} < 3000`);

  console.log(
    `  ok: ${guesses.length} guesses, ${solutions.length} solutions ` +
      `(${properNounFiltered} proper-noun-filtered, ${slurFiltered} slur-filtered)`,
  );
  if (warnings.length) console.log(`  ⚠ ${warnings.join("; ")}`);
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  for (const locale of LOCALES) {
    await generateOne(locale);
  }
  console.log("\ndone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
