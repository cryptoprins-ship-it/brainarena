"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, type Locale } from "@/lib/i18n";
import { dailyWord, randomWord } from "@/lib/dailyWord";
import { bumpStreak, breakStreak, getStreak, getName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";
import { dayIndex } from "@/lib/games/kronen";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import { getCachedGuesses, loadGuesses } from "@/lib/wordle/guesses";
import {
  formatCountdown,
  loadBoard,
  msUntilNextUtcMidnight,
  recordResult,
  saveBoard,
} from "@/lib/games/wordleState";
import ShareButton from "@/components/ShareButton";
import WordleEndLeaderboard from "@/components/WordleEndLeaderboard";

const ROWS = 6;
const COLS = 5;

type Tile = { letter: string; state: "empty" | "tbd" | "correct" | "present" | "absent" };

// Per-locale on-screen keyboards. Extra letters (ñ for es, ß for de,
// ç for fr/pt-BR) are present where the wordlist actually contains them
// — see scripts/generate-wordlists.mjs for the alphabet each locale
// keeps post-fold.
const QWERTY: Record<Locale, string[][]> = {
  en: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
  nl: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]],
  de: [["q","w","e","r","t","z","u","i","o","p"], ["a","s","d","f","g","h","j","k","l","ß"], ["enter","y","x","c","v","b","n","m","back"]],
  fr: [["a","z","e","r","t","y","u","i","o","p"], ["q","s","d","f","g","h","j","k","l","m"], ["enter","w","x","c","v","b","n","ç","back"]],
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
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  // Whether the just-finished play still qualifies for the leaderboard.
  // Captured the moment `record()` fires so both auto-submit and the
  // saveName fallback agree (record itself is single-shot — we'd race
  // ourselves if we re-asked the counter).
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  const dayIdx = useMemo(() => dayIndex(), []);
  // Per-locale variant: each language has its own daily word, so attempts
  // count separately.
  const { attempts: dailyAttempts, remaining, record } = useDailyAttempts(
    "wordle",
    dayIdx,
    locale
  );

  // Warm the per-locale guesses set in the background so the first
  // submission doesn't race the network. Failures are silently ignored —
  // validation falls through to "anything goes" until the bundle loads.
  useEffect(() => {
    loadGuesses(locale).catch(() => {});
  }, [locale]);

  // Reset on locale or mode change. In Daily mode, prefer any persisted
  // board for today over starting fresh — that's what protects against
  // refresh wiping progress AND prevents replaying a won daily.
  useEffect(() => {
    const fresh = unlimited ? randomWord(locale) : dailyWord(locale);
    let initialTarget = fresh;
    let initialGuesses: string[] = [];
    let initialDone: "win" | "lose" | null = null;
    let initialElapsed = 0;

    if (!unlimited) {
      const saved = loadBoard(dayIdx, locale);
      // Only honour the saved board if the target still matches today's
      // daily word — defends against the (unlikely) case that the curated
      // pool changed between sessions.
      if (saved && saved.target === fresh) {
        initialTarget = saved.target;
        initialGuesses = saved.guesses;
        initialDone = saved.done;
        initialElapsed = saved.elapsed;
      }
    }

    setTarget(initialTarget);
    setGuesses(initialGuesses);
    setCurrent("");
    setDone(initialDone);
    setRevealRow(-1);
    setElapsed(initialElapsed);
    startedAt.current = null;
    // Open the modal immediately if we restored a finished daily — players
    // coming back later get to see their result instead of an empty board.
    setShowModal(!unlimited && initialDone !== null);
    setSubmitted(null);
    setEligibleToSubmit(false);
    setStreak(getStreak("wordle"));
  }, [dayIdx, locale, unlimited]);

  // Timer.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  // Countdown to next UTC midnight — only ticks while the end-of-game modal
  // is open in Daily mode, since that's the only place it's shown.
  useEffect(() => {
    if (!showModal || unlimited) return;
    const tick = () => setCountdown(formatCountdown(msUntilNextUtcMidnight()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [showModal, unlimited]);

  const submitGuess = useCallback(() => {
    if (done) return;
    if (current.length !== COLS) {
      setShake(true); window.setTimeout(() => setShake(false), 400);
      return;
    }
    // Reject guesses that aren't real words. We only enforce this when
    // the per-locale guesses set has actually loaded — otherwise the
    // player would be silently blocked on a slow network. The target
    // itself is always allowed through, defending against the edge case
    // where a curated daily happens to be missing from the guesses set.
    const guessSet = getCachedGuesses(locale);
    if (guessSet && current !== target && !guessSet.has(current)) {
      setShake(true); window.setTimeout(() => setShake(false), 400);
      setToast(t("boggle_invalid_word"));
      window.setTimeout(() => setToast((m) => (m === t("boggle_invalid_word") ? null : m)), 1500);
      return;
    }
    if (!startedAt.current) startedAt.current = Date.now();
    const next = [...guesses, current];
    setGuesses(next);
    setRevealRow(next.length - 1);
    const elapsedSec = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0;

    const winning = current === target;
    const losing = !winning && next.length >= ROWS;
    const result: "win" | "lose" | null = winning ? "win" : losing ? "lose" : null;

    // Persist after every guess in Daily mode — refresh now restores the
    // board, and a finished daily can't be re-played to overwrite the
    // result.
    if (!unlimited) {
      saveBoard(dayIdx, locale, {
        guesses: next,
        done: result,
        target,
        elapsed: elapsedSec,
      });
    }

    if (winning) {
      setDone("win");
      const newStreak = unlimited ? getStreak("wordle") : bumpStreak("wordle");
      setStreak(newStreak);
      window.setTimeout(() => setShowModal(true), 1500);
      if (!unlimited) {
        recordResult({ locale, dayIdx, won: true, guessCount: next.length });
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
    } else if (losing) {
      setDone("lose");
      if (!unlimited) {
        breakStreak("wordle");
        recordResult({ locale, dayIdx, won: false, guessCount: next.length });
        // A loss still counts as an attempt — without this, players
        // could deliberately tank the first plays to "save" leaderboard
        // submissions for after they've memorised the word.
        record();
      }
      setStreak(unlimited ? streak : 0);
      window.setTimeout(() => setShowModal(true), 1500);
    }
    setCurrent("");
  }, [current, dayIdx, done, guesses, locale, record, streak, t, target, unlimited]);

  const onKey = useCallback((k: string) => {
    if (done) return;
    if (k === "enter") return submitGuess();
    if (k === "back") return setCurrent((c) => c.slice(0, -1));
    // a-z plus the per-locale extra letters kept by the normaliser
    // (ñ es / ß de / ç fr / ç pt-BR). Letters not in the active locale's
    // wordlist simply won't match — they don't need a separate gate.
    if (/^[a-zñßç]$/.test(k) && current.length < COLS) setCurrent((c) => c + k);
  }, [current.length, done, submitGuess]);

  // Hardware keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack keystrokes while the player is typing in a text
      // input — most importantly the post-win "Je naam" field. The
      // handler is on `window`, so Enter and Backspace events bubble
      // up from the input and used to be preventDefault()'d here, which
      // meant the player couldn't submit their name or delete a typo.
      const tgt = e.target as Element | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          (tgt as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); onKey("enter"); }
      else if (e.key === "Backspace") { e.preventDefault(); onKey("back"); }
      else if (/^[a-zA-ZñßÑẞçÇ]$/.test(e.key)) onKey(e.key.toLowerCase());
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

  // Per-guess tile-state grid — feeds the shared share text's emoji grid
  // (and doubles as verifiable proof for server-side score validation).
  const stateGrid = useMemo(
    () => guesses.map((g) => score(target, g)),
    [guesses, target],
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="wordle" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Wordle</h1>
          <p className="text-xs text-gray-400">
            {unlimited ? t("mode_unlimited") : t("mode_daily")} · {locale.toUpperCase()} ·{" "}
            <span className="tabular-nums">{elapsed}s</span> · 🔥 {streak}
            {!unlimited ? (
              <>
                {" · "}
                <span className={remaining === 0 ? "text-amber-300" : "text-gray-400"}>
                  {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} {t("ranked_label")}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="accent-indigo-500" />
          {t("mode_unlimited")}
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
          locale={locale}
          meta={{ guesses: guesses.length, won: done === "win", target, states: stateGrid }}
        />
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShowModal(false)}>
          <div className="relative w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
            >
              ×
            </button>
            <h2 className="text-2xl font-black">{done === "win" ? t("wordle_win_title") : t("wordle_lose_title")}</h2>
            {done === "win" ? (
              <p className="mt-2 text-sm text-gray-300">
                {t("wordle_solved_in", { n: guesses.length })}<br />
                {t("wordle_time")} <span className="tabular-nums">{elapsed}s</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-300">{t("wordle_word_was")} <span className="font-bold uppercase text-emerald-400">{target}</span></p>
            )}

            {done === "win" && !unlimited ? (
              <WordleEndLeaderboard
                locale={locale}
                playerName={getName()}
                playerGuesses={guesses.length}
                playerTime={elapsed}
                submittedRank={submitted?.rank}
              />
            ) : null}

            {!unlimited ? (
              <div className="mt-5 flex items-baseline justify-center gap-2 border-t border-[#2a2a2a] pt-4">
                <span className="text-xs uppercase tracking-wider text-gray-400">{t("wordle_next")}</span>
                <span className="font-mono text-xl font-bold tabular-nums text-indigo-300">{countdown || "—"}</span>
              </div>
            ) : null}

            {/* New users are prompted for a name by the global NameGate
                modal — no inline name input here. Showing both led to a
                double-submit (auto-submit + inline OK), which is why
                the leaderboard listed the same play twice and the
                player landed in #4 instead of #1. */}
            {done && !unlimited && !eligibleToSubmit && !submitted ? (
              <p className="mt-3 text-xs text-amber-300">
                {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
              </p>
            ) : null}
            {submitted ? (
              <p className="mt-3 text-sm text-emerald-300">
                <span className="font-bold">{getName() || "Anonymous"}</span> · {t("you_ranked", { rank: submitted.rank })}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <ShareButton
                game="wordle"
                score={done === "win" ? ROWS - guesses.length + 1 : 0}
                time={elapsed}
                locale={locale}
                meta={{ guesses: guesses.length, won: done === "win", states: stateGrid }}
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-sm font-bold hover:border-indigo-400/40"
              />
              <button onClick={() => { setShowModal(false); setUnlimited(true); }} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-bold">
                {t("win_play_again")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
