"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayIndex } from "@/lib/dailyWord";
import { getName, submitScore } from "@/lib/scores";
import { useLocale } from "@/lib/i18n";
import {
  isBoggleSupported,
  loadDictionary,
  getCachedDictionary,
  type BoggleLocale,
} from "@/lib/dictionary";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";

const SIZE = 4;
const DURATION = 180; // seconds

// Standard letter frequency-weighted bag (English-leaning, works across our 5 langs).
const BAG = "AAAABBCCDDDEEEEEEEEFFGGHHHIIIIIJKLLLMMNNNNOOOOPPQRRRRSSSSTTTTTUUUVVWWXYYZ";

function pointsFor(len: number): number {
  if (len < 3) return 0;
  if (len === 3) return 1;
  if (len === 4) return 2;
  if (len === 5) return 4;
  if (len === 6) return 7;
  return 11;
}

function neighbors(idx: number): number[] {
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr; const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) continue;
      out.push(nr * SIZE + nc);
    }
  }
  return out;
}

// Seeded PRNG so the daily grid is identical for everyone.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(seed: number): string[] {
  const rng = mulberry32(seed);
  const out: string[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    out.push(BAG[Math.floor(rng() * BAG.length)]);
  }
  return out;
}

export default function BogglePage() {
  const { t, locale } = useLocale();
  const supported = isBoggleSupported(locale);
  const dictLocale: BoggleLocale = supported ? locale : "en";

  const [grid, setGrid] = useState<string[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [flash, setFlash] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [time, setTime] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const todayIdx = useMemo(() => dayIndex(), []);
  // Grid is the same for everyone today, but each locale draws from its
  // own dictionary, so attempts are tracked per-locale.
  const { attempts: dailyAttempts, record } = useDailyAttempts("boggle", todayIdx, dictLocale);
  const [dictReady, setDictReady] = useState(() => getCachedDictionary(dictLocale) !== null);
  const dictRef = useRef<Set<string> | null>(getCachedDictionary(dictLocale));
  const startedAt = useRef<number | null>(null);
  const pathRef = useRef<number[]>([]);
  useEffect(() => { pathRef.current = path; }, [path]);

  // Pre-load the dictionary as soon as the page mounts so it's ready by
  // the time the player commits their first word.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    loadDictionary(dictLocale).then((set) => {
      if (cancelled) return;
      dictRef.current = set;
      setDictReady(true);
    }).catch(() => { /* swallow — game still playable, all words rejected */ });
    return () => { cancelled = true; };
  }, [supported, dictLocale]);

  useEffect(() => { setGrid(makeGrid(dayIndex())); }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = DURATION - Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000);
      if (remaining <= 0) { setTime(0); setRunning(false); setDone(true); return; }
      setTime(remaining);
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (running || done) return;
    startedAt.current = Date.now();
    setRunning(true);
  }, [done, running]);

  const word = path.map((i) => grid[i]).join("").toLowerCase();

  const tryCommit = useCallback(() => {
    const p = pathRef.current;
    if (!running) { setPath([]); return; }
    const w = p.map((i) => grid[i]).join("").toLowerCase();
    const dict = dictRef.current;
    const inDict = dict?.has(w) === true;
    if (p.length >= 3 && !found.includes(w) && inDict) {
      setFound((f) => [w, ...f]);
      setInvalidMsg(null);
    } else if (p.length >= 1) {
      setShakeKey((k) => k + 1);
      // Only show "not a word" once the dict is ready — before that, a
      // failure could just be due to the dict still loading.
      if (p.length >= 3 && !found.includes(w) && dict && !inDict) {
        setInvalidMsg(t("boggle_invalid_word"));
        window.setTimeout(() => setInvalidMsg(null), 1500);
      }
    }
    setPath([]);
  }, [found, grid, running, t]);
  const tryCommitRef = useRef(tryCommit);
  useEffect(() => { tryCommitRef.current = tryCommit; }, [tryCommit]);

  const score = useMemo(() => found.reduce((s, w) => s + pointsFor(w.length), 0), [found]);

  const flashCandidates = useCallback((indices: number[]) => {
    setFlash(indices);
    window.setTimeout(() => setFlash([]), 600);
  }, []);

  const onTileClick = useCallback((idx: number) => {
    if (done) return;
    if (!running) {
      startedAt.current = Date.now();
      setRunning(true);
    }
    setPath((p) => {
      if (p.length === 0) return [idx];
      const last = p[p.length - 1];
      if (idx === last) return p.slice(0, -1);
      if (p.includes(idx)) return p;
      if (!neighbors(last).includes(idx)) return p;
      return [...p, idx];
    });
  }, [done, running]);

  useEffect(() => {
    if (done) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "INPUT") return;

      if (e.key === "Enter") {
        e.preventDefault();
        tryCommitRef.current();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setPath((p) => p.slice(0, -1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPath([]);
        return;
      }
      if (!/^[a-zA-Z]$/.test(e.key)) return;

      e.preventDefault();
      const letter = e.key.toUpperCase();
      if (!running) {
        startedAt.current = Date.now();
        setRunning(true);
      }
      const p = pathRef.current;
      let candidates: number[];
      if (p.length === 0) {
        candidates = grid
          .map((ch, i) => (ch === letter ? i : -1))
          .filter((i) => i >= 0);
      } else {
        const last = p[p.length - 1];
        candidates = neighbors(last).filter(
          (i) => grid[i] === letter && !p.includes(i)
        );
      }
      if (candidates.length === 0) return;
      if (candidates.length === 1) {
        setPath([...p, candidates[0]]);
        return;
      }
      flashCandidates(candidates);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, grid, running, flashCandidates]);

  // Submit on game end, gated by the daily attempt cap.
  useEffect(() => {
    if (!done) { recordedRef.current = false; return; }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "boggle",
        name: getName() || "Anonymous",
        score,
        time: DURATION,
        meta: { found },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, found, record, score, submitted]);

  if (!supported) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-black">Boggle</h1>
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <p className="font-bold text-amber-200">{t("boggle_unsupported_title")}</p>
          <p className="mt-2 text-amber-100">{t("boggle_unsupported_body")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="boggle" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Boggle</h1>
          <p className="text-xs text-gray-400">
            {t("boggle_status", { seconds: DURATION })} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} {t("ranked_label")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1 text-sm font-mono">⏱ {time}s</span>
          <span className="rounded-md bg-indigo-500/20 px-3 py-1 text-sm font-bold text-indigo-200">★ {score}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div
            key={shakeKey}
            className="mx-auto grid w-full max-w-sm grid-cols-4 gap-2 select-none"
          >
            {grid.map((ch, i) => {
              const inPath = path.includes(i);
              const isLast = path[path.length - 1] === i;
              const isFlashing = flash.includes(i);
              const cls = isFlashing
                ? "bg-yellow-400 text-black ring-2 ring-yellow-200"
                : inPath
                ? isLast
                  ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                  : "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-gray-100";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onTileClick(i)}
                  className={`aspect-square rounded-xl border-2 border-[#2a2a2a] text-2xl font-black uppercase transition-colors ${cls}`}
                >
                  {ch}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-400">{t("boggle_word")} <span className="font-mono uppercase text-white">{word || "—"}</span></span>
            <div className="flex gap-2">
              {!running && !done ? (
                <button onClick={start} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">{t("boggle_start")}</button>
              ) : null}
              {running && !done ? (
                <button
                  onClick={tryCommit}
                  disabled={path.length < 3}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold disabled:opacity-40"
                >
                  {t("submit")}
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-2 flex h-5 items-center justify-between text-[11px]">
            <span className="text-gray-500">
              {t("boggle_kbd_hint")}
            </span>
            {invalidMsg ? (
              <span className="font-bold text-red-300">{invalidMsg}</span>
            ) : !dictReady ? (
              <span className="text-gray-500">{t("boggle_loading_dict")}</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">{t("boggle_found", { n: found.length })}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 text-sm">
            {found.map((w) => (
              <li key={w} className="flex justify-between">
                <span className="uppercase">{w}</span>
                <span className="text-gray-500">+{pointsFor(w.length)}</span>
              </li>
            ))}
            {found.length === 0 ? <li className="text-gray-600">{t("boggle_drag_hint")}</li> : null}
          </ul>
        </div>
      </div>

      {done ? (
        <EndScreenAddon
          game="boggle"
          score={score}
          time={DURATION}
          rank={submitted?.rank}
          locale={locale}
          meta={{ found: found.length }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-black">{t("boggle_final_score", { score })}</h2>
          <p className="mt-1 text-sm text-gray-400">{t("boggle_words_found", { n: found.length })}</p>
          {submitted ? (
            <p className="mt-3 text-sm text-emerald-300">
              <span className="font-bold">{getName() || "Anonymous"}</span> · {t("you_ranked", { rank: submitted.rank })}
            </p>
          ) : null}
          {done && !eligibleToSubmit && !submitted ? (
            <p className="mt-3 text-xs text-amber-300">
              {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
