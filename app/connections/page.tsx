"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [startedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    setOrder(shuffleSeeded(allWords(puzzle), seed));
    setSelected(new Set());
    setSolved([]);
    setMistakes(0);
    setState("playing");
    setOneAwayFlash(false);
    setShakeFlash(false);
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
        setState("won");
      }
    } else {
      setMistakes((m) => {
        const next = m + 1;
        if (next >= MAX_MISTAKES) {
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
  }, [puzzle, selected, solved, state]);

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
            {t("game_connections_desc")} · {locale.toUpperCase()}
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
        <EndScreenAddon
          game="connections"
          score={Math.max(1, (MAX_MISTAKES - mistakes) * 1000)}
          time={elapsed}
          meta={{ mistakes, won }}
        />
      ) : null}
    </div>
  );
}
