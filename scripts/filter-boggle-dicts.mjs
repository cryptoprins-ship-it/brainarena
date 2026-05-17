#!/usr/bin/env node
// Filter proper nouns out of the Boggle per-locale dictionaries.
//
// Run with: node scripts/filter-boggle-dicts.mjs
//
// Problem: public/dict/<locale>.txt was originally lowercased en masse,
// so names like "Neel", "Aafje", "Kevin", "Amsterdam", "Paris" all
// survived as valid Boggle words. This script removes entries that the
// upstream hunspell dictionary only knows as a capital-leading proper
// noun (i.e. there is no lowercase entry of the same string).
//
// Re-runnable: cached hunspell sources live in data/wordlists/.cache/,
// matching scripts/generate-wordlists.mjs. Output is sorted + unique +
// one-per-line, so reruns produce a byte-identical file when inputs
// haven't changed.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DICT_DIR = join(ROOT, "public", "dict");
const CACHE_DIR = join(ROOT, "data", "wordlists", ".cache");

const DIC_BASE =
  "https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries";

// Same hunspell mapping as scripts/generate-wordlists.mjs:
//   en  → en-GB  (en-US's index.dic is empty upstream)
//   pt-BR → pt   (no pt-BR dict upstream)
// `fold` strips vowel-diacritics so hunspell entries collapse onto the
// ASCII keys used in public/dict/<locale>.txt — semantic letters
// (ñ/ß/ç) are kept, then a final [a-z]-only pass drops what remains.
// `inflectionSuffixes` are appended to each proper-noun base to catch
// inflected forms (plurals, diminutives) that the dict source picked up
// even though hunspell only lists the bare proper noun: e.g. "Neel/PN"
// is in hunspell, but "neels"/"neeltje"/"neeltjes" landed in the dict
// from elsewhere. We only drop an inflection if it isn't also attested
// as a lowercase entry in hunspell, so "may" (English month vs. verb)
// or any name-ish form that's also a real word stays.
const LOCALES = [
  { code: "en", dicLang: "en-GB", fold: {}, inflectionSuffixes: ["s"] },
  {
    code: "nl",
    dicLang: "nl",
    fold: {},
    inflectionSuffixes: ["s", "en", "tje", "tjes"],
  },
  {
    code: "de",
    dicLang: "de",
    fold: { ä: "a", ö: "o", ü: "u" },
    inflectionSuffixes: ["s"],
  },
  {
    code: "fr",
    dicLang: "fr",
    fold: {
      à: "a", â: "a", æ: "ae",
      é: "e", è: "e", ê: "e", ë: "e",
      î: "i", ï: "i",
      ô: "o", œ: "oe",
      ù: "u", û: "u", ü: "u", ÿ: "y",
    },
    inflectionSuffixes: ["s"],
  },
  {
    code: "es",
    dicLang: "es",
    fold: { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" },
    inflectionSuffixes: ["s", "es"],
  },
  {
    code: "pt-BR",
    dicLang: "pt",
    fold: {
      á: "a", â: "a", ã: "a", à: "a",
      é: "e", ê: "e",
      í: "i",
      ó: "o", ô: "o", õ: "o",
      ú: "u",
    },
    inflectionSuffixes: ["s"],
  },
];

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

function applyFold(s, fold) {
  let out = "";
  for (const ch of s) out += fold[ch] ?? ch;
  return out;
}

// Build the set of lowercase+folded strings that appear in hunspell
// ONLY as a capital-leading entry — i.e. there is no lowercase entry of
// the same word. Those are proper nouns by hunspell convention
// (Neel/PN, Amsterdam, John, ...). A word that appears both ways (e.g.
// English "may" + "May") stays out of this set, so it survives the
// filter as the common-noun reading.
//
// `inflectionSuffixes` extends the set with surfaces like name+"s" /
// name+"tjes" — but only if that surface isn't itself a lowercase
// hunspell entry (which would mean it's a real word too).
function buildProperNounSet(dicText, fold, inflectionSuffixes) {
  const lines = dicText.split(/\r?\n/);
  const start = /^\d+$/.test(lines[0]?.trim() ?? "") ? 1 : 0;

  const lowerSeen = new Set();
  const upperCandidates = [];

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const slash = line.indexOf("/");
    const base = (slash >= 0 ? line.slice(0, slash) : line).trim();
    if (!base) continue;
    const first = base[0];
    // Skip entries whose first character isn't an alphabetic letter
    // (digits, punctuation): they can't collide with our [a-z] dict.
    const lowered = first.toLowerCase();
    const uppered = first.toUpperCase();
    if (lowered === uppered) continue;
    const folded = applyFold(base.toLowerCase(), fold);
    if (first === lowered) {
      lowerSeen.add(folded);
    } else {
      upperCandidates.push(folded);
    }
  }

  const properOnly = new Set();
  for (const w of upperCandidates) {
    if (lowerSeen.has(w)) continue;
    properOnly.add(w);
    for (const suf of inflectionSuffixes) {
      const inflected = w + suf;
      if (!lowerSeen.has(inflected)) properOnly.add(inflected);
    }
  }
  return properOnly;
}

async function filterOne(locale) {
  console.log(`\n[${locale.code}]`);
  const dictPath = join(DICT_DIR, `${locale.code}.txt`);
  const dicUrl = `${DIC_BASE}/${locale.dicLang}/index.dic`;
  const dicCache = join(CACHE_DIR, `dic_${locale.dicLang}.dic`);

  const dicSrc = await fetchCached(dicUrl, dicCache);
  const properOnly = buildProperNounSet(
    dicSrc,
    locale.fold,
    locale.inflectionSuffixes,
  );

  const original = readFileSync(dictPath, "utf8").split("\n").filter(Boolean);
  const kept = [];
  const removed = [];
  for (const w of original) {
    if (properOnly.has(w)) removed.push(w);
    else kept.push(w);
  }

  // Sort + dedupe so the on-disk format is canonical regardless of
  // historical insertion order.
  const unique = [...new Set(kept)].sort();
  writeFileSync(dictPath, unique.join("\n") + "\n");

  console.log(
    `  ok: ${original.length} → ${unique.length} ` +
      `(${removed.length} proper-noun-filtered)`,
  );
  if (removed.length) {
    const sample = removed.slice(0, 8).join(", ");
    console.log(`  sample: ${sample}${removed.length > 8 ? ", …" : ""}`);
  }
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  for (const locale of LOCALES) {
    await filterOne(locale);
  }
  console.log("\ndone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
