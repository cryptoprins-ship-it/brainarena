"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, type Locale } from "@/lib/i18n";
import { dailyWord, randomWord } from "@/lib/dailyWord";
import { bumpStreak, breakStreak, getStreak, getName, setName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";
import { dayIndex } from "@/lib/games/kronen";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import {
  getCachedDictionary,
  isBoggleSupported,
  loadDictionary,
  type BoggleLocale,
} from "@/lib/dictionary";

const ROWS = 6;
const COLS = 5;

type Tile = { letter: string; state: "empty" | "tbd" | "correct" | "present" | "absent" };

const QWERTY: Record<Locale, string[][]> = {
  en: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
  nl: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
  de: [["q","w","e","r","t","z","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","y","x","c","v","b","n","m","back"]],
  fr: [["a","z","e","r","t","y","u","i","o","p"], ["q","s","d","f","g","h","j","k","l","m"], ["enter","w","x","c","v","b","n","back"]],
  es: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l","ñ"], ["enter","z","x","c","v","b","n","m","back"]],
  "pt-BR": [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l","ç"], ["enter","z","x","c","v","b","n","m","back"]],
  hi: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
  ja: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
};

function score(target: string, guess: string): Tile["state"][] {
  const t = [...target];
  const g = [...guess];
  const states: Tile["state"][] = Array(g.length).fill("absent");
  const used = Array(t.length).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) { states[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < g.length; i++) {
    if (states[i] === "correct") continue;
    const idx = t.findIndex((ch, j) => !used[j] && ch === g[i]);
    if (idx >= 0) { states[i] = "present"; used[idx] = true; }
  }
  return states;
}

const STATE_BG: Record<Tile["state"], string> = {
  empty: "border-[#3a3a3c] bg-transparent",
  tbd: "border-[#565758] bg-transparent",
  correct: "border-[#538d4e] bg-[#538d4e]",
  present: "border-[#b59f3b] bg-[#b59f3b]",
  absent: "border-[#3a3a3c] bg-[#3a3a3c]",
};

const STATE_RANK: Record<Tile["state"], number> = {
  empty: 0, tbd: 1, absent: 2, present: 3, correct: 4,
};

function emojiGrid(rows: Tile["state"][][]): string {
  return rows
    .map((r) => r.map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛")).join(""))
    .join("\n");
}

export default function WordlePage() {
  const { locale, t } = useLocale();
  const [unlimited, setUnlimited] = useState(false);
  const [target, setTarget] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const [revealRow, setRevealRow] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [name, setNameState] = useState("");
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  // Whether the just-finished play still qualifies for the leaderboard.
  // Captured the moment `record()` fires so both auto-submit and the
  // saveName fallback agree (record itself is single-shot — we'd race
  // ourselves if we re-asked the counter).
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);

  const dayIdx = useMemo(() => dayIndex(), []);
  // Per-locale variant: each language has its own daily word, so attempts
  // count separately.
  const { attempts: dailyAttempts, remaining, record } = useDailyAttempts(
    "wordle",
    dayIdx,
    locale
  );

  // Locale we'll use for dictionary-backed guess validation. hi/ja have no
  // wordlist file shipped — skip validation there rather than blocking the
  // game.
  const dictLocale: BoggleLocale | null = isBoggleSupported(locale) ? locale : null;

  // Warm the dictionary in the background so the first guess doesn't race
  // the network. Failures are silently ignored — validation just falls
  // through to "anything goes" until/unless the file loads.
  useEffect(() => {
    if (!dictLocale) return;
    loadDictionary(dictLocale).catch(() => {});
  }, [dictLocale]);

  // Reset on locale or mode change.
  useEffect(() => {
    const w = unlimited ? randomWord(locale) : dailyWord(locale);
    setTarget(w);
    setGuesses([]);
    setCurrent("");
    setDone(null);
    setRevealRow(-1);
    setElapsed(0);
    startedAt.current = null;
    setShowModal(false);
    setSubmitted(null);
    setEligibleToSubmit(false);
    setStreak(getStreak("wordle"));
    setNameState(getName());
  }, [locale, unlimited]);

  // Timer.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const submitGuess = useCallback(() => {
    if (done) return;
    if (current.length !== COLS) {
      setShake(true); window.setTimeout(() => setShake(false), 400);
      return;
    }
    // Reject guesses that aren't real words. We only enforce this when the
    // dictionary has actually loaded for this locale — otherwise the player
    // would be silently blocked on a slow network. The target itself is
    // always allowed through, in case a curated daily word happens to be
    // missing from the dict.
    if (dictLocale) {
      const dict = getCachedDictionary(dictLocale);
      if (dict && current !== target && !dict.has(current)) {
        setShake(true); window.setTimeout(() => setShake(false), 400);
        setToast(t("boggle_invalid_word"));
        window.setTimeout(() => setToast((m) => (m === t("boggle_invalid_word") ? null : m)), 1500);
        return;
      }
    }
    if (!startedAt.current) startedAt.current = Date.now();
    const next = [...guesses, current];
    setGuesses(next);
    setRevealRow(next.length - 1);
    const elapsedSec = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0;

    if (current === target) {
      setDone("win");
      const newStreak = unlimited ? getStreak("wordle") : bumpStreak("wordle");
      setStreak(newStreak);
      window.setTimeout(() => setShowModal(true), 1500);
      if (!unlimited) {
        const { shouldSubmit } = record();
        setEligibleToSubmit(shouldSubmit);
        if (shouldSubmit) {
          const playerName = getName() || "Anonymous";
          submitScore({
            game: "wordle",
            name: playerName,
            score: ROWS - next.length + 1, // higher = fewer guesses
            time: elapsedSec,
            language: locale,
            meta: { guesses: next.length, target },
          }).then((r) => r && setSubmitted(r));
        }
      }
    } else if (next.length >= ROWS) {
      setDone("lose");
      if (!unlimited) {
        breakStreak("wordle");
        // A loss still counts as an attempt — without this, players
        // could deliberately tank the first plays to "save" leaderboard
        // submissions for after they've memorised the word.
        record();
      }
      setStreak(unlimited ? streak : 0);
      window.setTimeout(() => setShowModal(true), 1500);
    }
    setCurrent("");
  }, [current, dictLocale, done, guesses, locale, record, streak, t, target, unlimited]);

  const onKey = useCallback((k: string) => {
    if (done) return;
    if (k === "enter") return submitGuess();
    if (k === "back") return setCurrent((c) => c.slice(0, -1));
    if (/^[a-zñ]$/.test(k) && current.length < COLS) setCurrent((c) => c + k);
  }, [current.length, done, submitGuess]);

  // Hardware keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); onKey("enter"); }
      else if (e.key === "Backspace") { e.preventDefault(); onKey("back"); }
      else if (/^[a-zA-Zñ]$/.test(e.key)) onKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey]);

  const rows: Tile[][] = useMemo(() => {
    return Array.from({ length: ROWS }, (_, r) => {
      const guess = guesses[r];
      if (guess) {
        const states = score(target, guess);
        return [...guess].map((letter, i) => ({ letter, state: states[i] }));
      }
      const isCurrent = r === guesses.length;
      return Array.from({ length: COLS }, (_, i) => {
        const letter = isCurrent ? current[i] ?? "" : "";
        return { letter, state: letter ? "tbd" : "empty" } as Tile;
      });
    });
  }, [current, guesses, target]);

  const keyStates = useMemo(() => {
    const m = new Map<string, Tile["state"]>();
    guesses.forEach((g) => {
      const states = score(target, g);
      [...g].forEach((ch, i) => {
        const prev = m.get(ch);
        const next = states[i];
        if (!prev || STATE_RANK[next] > STATE_RANK[prev]) m.set(ch, next);
      });
    });
    return m;
  }, [guesses, target]);

  const share = useCallback(async () => {
    const stateGrid = guesses.map((g) => score(target, g));
    const head = `BrainArena Wordle ${locale.toUpperCase()} ${done === "win" ? guesses.length : "X"}/${ROWS} · ${elapsed}s`;
    const text = `${head}\n${emojiGrid(stateGrid)}\nbrainarena.fun`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      prompt("Copy your result:", text);
    }
  }, [done, elapsed, guesses, locale, target]);

  const saveName = useCallback(() => {
    setName(name);
    if (done === "win" && !submitted && eligibleToSubmit) {
      submitScore({
        game: "wordle",
        name: name || "Anonymous",
        score: ROWS - guesses.length + 1,
        time: elapsed,
        language: locale,
        meta: { guesses: guesses.length, target },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, elapsed, eligibleToSubmit, guesses, locale, name, submitted, target]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="wordle" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Wordle</h1>
          <p className="text-xs text-gray-400">
            {unlimited ? "Unlimited" : "Daily"} · {locale.toUpperCase()} ·{" "}
            <span className="tabular-nums">{elapsed}s</span> · 🔥 {streak}
            {!unlimited ? (
              <>
                {" · "}
                <span className={remaining === 0 ? "text-amber-300" : "text-gray-400"}>
                  {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
                </span>
              </>
            ) : null}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="accent-indigo-500" />
          Unlimited
        </label>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <div className="mt-4 grid place-items-center gap-1">
        {rows.map((row, r) => (
          <div key={r} className={`flex gap-1 ${shake && r === guesses.length ? "shake" : ""}`}>
            {row.map((tile, c) => (
              <div
                key={c}
                className={`h-14 w-14 grid place-items-center rounded-md border-2 text-2xl font-bold uppercase ${STATE_BG[tile.state]} ${revealRow === r ? "flip" : ""}`}
                style={revealRow === r ? { animationDelay: `${c * 100}ms` } : undefined}
              >
                {tile.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-1.5">
        {QWERTY[locale].map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((k) => {
              const wide = k === "enter" || k === "back";
              const state = keyStates.get(k);
              const bg = state === "correct" ? "bg-[#538d4e]" : state === "present" ? "bg-[#b59f3b]" : state === "absent" ? "bg-[#3a3a3c]" : "bg-[#818384]";
              return (
                <button
                  key={k}
                  onClick={() => onKey(k)}
                  className={`${wide ? "px-3" : "w-9"} h-12 rounded text-xs font-bold uppercase ${bg} text-white active:scale-95`}
                >
                  {k === "back" ? "⌫" : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {done ? (
        <EndScreenAddon
          game="wordle"
          score={done === "win" ? ROWS - guesses.length + 1 : 0}
          time={elapsed}
          rank={submitted?.rank}
          meta={{ guesses: guesses.length, won: done === "win", target }}
        />
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black">{done === "win" ? "🎉 Solved!" : "😵 Out of guesses"}</h2>
            {done === "win" ? (
              <p className="mt-2 text-sm text-gray-300">
                Solved in {guesses.length} guess{guesses.length === 1 ? "" : "es"}<br />
                Time: <span className="tabular-nums">{elapsed}s</span><br />
                Current streak: <span className="font-bold text-indigo-300">{streak} day{streak === 1 ? "" : "s"}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-300">The word was <span className="font-bold uppercase text-emerald-400">{target}</span></p>
            )}

            {done === "win" && !submitted && eligibleToSubmit ? (
              <div className="mt-4 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setNameState(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
                />
                <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">Submit</button>
              </div>
            ) : null}
            {done && !unlimited && !eligibleToSubmit && !submitted ? (
              <p className="mt-3 text-xs text-amber-300">
                Practice play — you&apos;ve used your {MAX_LEADERBOARD_ATTEMPTS} ranked attempts for today&apos;s puzzle. Tomorrow resets the counter.
              </p>
            ) : null}
            {submitted ? (
              <p className="mt-3 text-sm text-emerald-300">You ranked #{submitted.rank} on the leaderboard!</p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button onClick={share} className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-sm font-bold hover:border-indigo-400/40">
                Share
              </button>
              <button onClick={() => { setShowModal(false); setUnlimited(true); }} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-bold">
                Play again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
