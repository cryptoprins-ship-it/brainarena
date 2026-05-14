"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import { useLocale } from "@/lib/i18n";
import {
  allWords,
  checkSelection,
  pickPuzzle,
  shuffleSeeded,
  type ConnectionsGroup,
  type ConnectionsPuzzle,
} from "@/lib/games/connections";
import { dayIndex } from "@/lib/games/kronen";
import { getName, setName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";

const MAX_MISTAKES = 4;

type GameState = "playing" | "won" | "lost";

const COLOUR_BG: Record<ConnectionsGroup["color"], string> = {
  yellow: "bg-amber-400 text-black",
  green:  "bg-emerald-500 text-white",
  blue:   "bg-sky-500 text-white",
  purple: "bg-purple-500 text-white",
};

export default function ConnectionsPage() {
  const { t, locale } = useLocale();
  const [seedNonce, setSeedNonce] = useState(0);
  // Each day picks one puzzle from the curated pool. seedNonce lets the
  // player request a fresh puzzle from the same pool without waiting
  // 24h — useful when they've already played today's.
  const seed = useMemo(() => dayIndex() + seedNonce, [seedNonce]);
  const puzzle: ConnectionsPuzzle = useMemo(() => pickPuzzle(seed), [seed]);

  const [order, setOrder] = useState<string[]>(() => shuffleSeeded(allWords(puzzle), seed));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [solved, setSolved] = useState<ConnectionsGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState<GameState>("playing");
  const [oneAwayFlash, setOneAwayFlash] = useState(false);
  const [shakeFlash, setShakeFlash] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  // Snapshot of "groups the player actually solved" (0-4) at game-end —
  // captured BEFORE the lost-state auto-fill so the leaderboard score
  // reflects the player's real performance, not the autopaste.
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [finalElapsed, setFinalElapsed] = useState<number | null>(null);
  const recordedRef = useRef(false);

  const todayIdx = useMemo(() => dayIndex(), []);
  // Connections has one puzzle per day (with optional nonce for replays).
  const { attempts: dailyAttempts, record } = useDailyAttempts("connections", todayIdx);
  useEffect(() => { setNameInput(getName()); }, []);

  useEffect(() => {
    setOrder(shuffleSeeded(allWords(puzzle), seed));
    setSelected(new Set());
    setSolved([]);
    setMistakes(0);
    setState("playing");
    setOneAwayFlash(false);
    setShakeFlash(false);
    setSubmitted(null);
    setEligibleToSubmit(false);
    setPlayerScore(null);
    setFinalElapsed(null);
    recordedRef.current = false;
    setStartedAt(Date.now());
  }, [puzzle, seed]);

  const remaining = useMemo(() => {
    const solvedSet = new Set(solved.flatMap((g) => g.words));
    return order.filter((w) => !solvedSet.has(w));
  }, [order, solved]);

  const toggleSelect = useCallback((word: string) => {
    if (state !== "playing") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else if (next.size < 4) {
        next.add(word);
      }
      return next;
    });
  }, [state]);

  const onShuffle = useCallback(() => {
    setOrder((cur) => {
      const arr = cur.slice();
      // Fisher-Yates with Math.random — pure visual aid, no need for a seed
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  }, []);

  const onDeselect = useCallback(() => setSelected(new Set()), []);

  const onSubmit = useCallback(() => {
    if (state !== "playing") return;
    if (selected.size !== 4) return;
    const list = Array.from(selected);
    const { group, oneAway } = checkSelection(puzzle, list);
    if (group) {
      setSolved((s) => [...s, group]);
      setSelected(new Set());
      if (solved.length + 1 === 4) {
        setPlayerScore(4);
        setFinalElapsed(Math.floor((Date.now() - startedAt) / 1000));
        setState("won");
      }
    } else {
      setMistakes((m) => {
        const next = m + 1;
        if (next >= MAX_MISTAKES) {
          // Capture the player's real groups-solved BEFORE we auto-fill
          // the rest — otherwise the leaderboard score would always
          // record 4 even on a 0-correct loss.
          setPlayerScore(solved.length);
          setFinalElapsed(Math.floor((Date.now() - startedAt) / 1000));
          // Reveal the remaining groups as auto-solved so the player can
          // see the answers.
          const solvedColors = new Set(solved.map((g) => g.color));
          const left = puzzle.groups.filter((g) => !solvedColors.has(g.color));
          setSolved((s) => [...s, ...left]);
          setState("lost");
        }
        return next;
      });
      setShakeFlash(true);
      setTimeout(() => setShakeFlash(false), 600);
      if (oneAway) {
        setOneAwayFlash(true);
        setTimeout(() => setOneAwayFlash(false), 2200);
      }
    }
  }, [puzzle, selected, solved, startedAt, state]);

  // Submit to leaderboard on game end (won OR lost), gated by 3-attempt
  // cap. Score = groups solved by the player (0-4), time = elapsed —
  // matches the API's "score desc, time asc" sort so winners rank by
  // speed, losers rank by partial progress.
  useEffect(() => {
    if (state !== "won" && state !== "lost") return;
    if (recordedRef.current) return;
    if (playerScore == null || finalElapsed == null) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "connections",
        name: getName() || "Anonymous",
        score: playerScore,
        time: finalElapsed,
        meta: { mistakes, won: state === "won" },
      }).then((r) => r && setSubmitted(r));
    }
  }, [state, playerScore, finalElapsed, mistakes, record, submitted]);

  const saveName = useCallback(() => {
    setName(nameInput);
    if (
      (state === "won" || state === "lost") &&
      eligibleToSubmit &&
      !submitted &&
      playerScore != null &&
      finalElapsed != null
    ) {
      submitScore({
        game: "connections",
        name: nameInput || "Anonymous",
        score: playerScore,
        time: finalElapsed,
        meta: { mistakes, won: state === "won" },
      }).then((r) => r && setSubmitted(r));
    }
  }, [nameInput, state, eligibleToSubmit, submitted, playerScore, finalElapsed, mistakes]);

  const onNewPuzzle = useCallback(() => setSeedNonce((n) => n + 1), []);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const won = state === "won";
  const lost = state === "lost";
  const done = won || lost;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="connections" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_connections")}</h1>
          <p className="text-xs text-gray-400">
            {t("game_connections_desc")} · {locale.toUpperCase()} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs">
          <span className="text-gray-400">{t("connections_mistakes")}:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i < mistakes ? "bg-rose-500" : "bg-[#3a3a3c]"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {oneAwayFlash ? (
        <div className="mx-auto mt-3 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-center text-xs font-bold text-amber-200">
          {t("connections_one_away")}
        </div>
      ) : null}

      {/* Solved groups stack — newest on top so the column reads as a
          progress ladder. Each group shows category + the 4 words. */}
      <div className="mt-4 space-y-2">
        {solved.map((g) => (
          <div
            key={g.color}
            className={`rounded-lg px-3 py-2 text-center ${COLOUR_BG[g.color]}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">{g.category}</p>
            <p className="mt-0.5 text-sm">{g.words.join("  ·  ")}</p>
          </div>
        ))}
      </div>

      {/* Word tiles. Render a 4-wide grid; rows naturally shrink as
          groups solve. We use min-h to avoid layout collapse on small
          phones where the word might not fit on one line. */}
      <div
        className={`mt-4 grid grid-cols-4 gap-2 ${shakeFlash ? "animate-shake" : ""}`}
      >
        {remaining.map((word) => {
          const isSelected = selected.has(word);
          return (
            <button
              key={word}
              type="button"
              onClick={() => toggleSelect(word)}
              disabled={state !== "playing"}
              className={`min-h-[64px] rounded-lg border px-2 py-2 text-xs sm:text-sm font-bold transition select-none ${
                isSelected
                  ? "border-indigo-400 bg-indigo-600 text-white"
                  : "border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222] text-gray-100"
              } ${state !== "playing" ? "opacity-60" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShuffle}
            disabled={done}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40"
          >
            {t("connections_shuffle")}
          </button>
          <button
            type="button"
            onClick={onDeselect}
            disabled={done || selected.size === 0}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40"
          >
            {t("connections_deselect")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={done || selected.size !== 4}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            {t("submit")}
          </button>
        </div>
        <button
          type="button"
          onClick={onNewPuzzle}
          className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm"
        >
          {t("new_game")}
        </button>
      </div>

      {won ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-center text-sm font-bold text-emerald-200">
          ✓ {t("solved")}
          <p className="mt-1 text-sm font-normal text-white">
            {t("connections_won", { mistakes: String(mistakes) })}
          </p>
        </div>
      ) : lost ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-rose-500/60 bg-rose-500/15 px-3 py-2 text-center text-sm font-bold text-rose-100">
          {t("connections_lost")}
        </div>
      ) : null}

      {done ? (
        <>
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="font-bold text-emerald-200">
              {won ? t("solved") : t("connections_lost")}
            </p>
            <p className="mt-1 text-emerald-100">
              {playerScore ?? 0}/4 groups · {t("your_time")}: <span className="font-mono">{finalElapsed ?? elapsed}s</span>
            </p>
            {!submitted && eligibleToSubmit ? (
              <div className="mt-3 flex gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
                />
                <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">{t("submit")}</button>
              </div>
            ) : null}
            {submitted ? (
              <p className="mt-2 text-sm text-emerald-300">Ranked #{submitted.rank} globally.</p>
            ) : null}
            {!eligibleToSubmit && !submitted ? (
              <p className="mt-3 text-xs text-amber-300">
                Practice play — you&apos;ve used your {MAX_LEADERBOARD_ATTEMPTS} ranked attempts on today&apos;s puzzle. Tomorrow resets the counter.
              </p>
            ) : null}
          </div>
          <EndScreenAddon
            game="connections"
            score={playerScore ?? 0}
            time={finalElapsed ?? elapsed}
            meta={{ mistakes, won }}
          />
        </>
      ) : null}
    </div>
  );
}
