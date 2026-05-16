"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { Game, ScoreEntry } from "@/lib/leaderboard/standings";
import { flagOf } from "@/lib/leaderboard/flag";

const TOP_N = 10;

type Props = {
  // Which score-based game's daily board to render. Drives the GET
  // /api/leaderboard?game=… request and is the key for player-row
  // matching.
  game: Game;
  // What the local player just submitted, used to find and highlight
  // their row even when names collide. `playerName` may be empty —
  // then we mirror the server's "Anonymous" fallback.
  playerName: string;
  playerScore: number;
  // Rank returned by POST /api/leaderboard at submit. Used as a
  // refetch trigger so the table reflects the freshly appended entry
  // once the server has acknowledged it; the value itself is not read.
  submittedRank?: number;
  // Optional client-side filter — used by games that group entries
  // by an additional dimension (e.g. difficulty) the server doesn't
  // partition on.
  metaFilter?: (entry: ScoreEntry) => boolean;
  // Per-game formatter for the visible score cell. Lets boggle show
  // "12 woorden" off `meta.found.length`, connections show "3/4
  // groepen", typing show "45 WPM", etc., while ranking remains the
  // server-side sortFor()-driven order.
  formatScore?: (entry: ScoreEntry) => string;
};

export default function ScoreEndLeaderboard({
  game,
  playerName,
  playerScore,
  submittedRank,
  metaFilter,
  formatScore,
}: Props) {
  const { t } = useLocale();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=${game}&period=today`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const all: ScoreEntry[] = Array.isArray(data?.scores) ? data.scores : [];
        const filtered = metaFilter ? all.filter(metaFilter) : all;
        setScores(filtered);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setScores([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // metaFilter is intentionally not in the dep array — callers pass
    // a fresh closure each render, and refetching on every render
    // would loop. Server-derived `submittedRank` is the trigger for
    // re-fetch after the player's own POST resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, submittedRank]);

  // Match player row by name + score. Server replaces empty names
  // with "Anonymous" so mirror that here.
  const effectiveName = playerName || "Anonymous";
  const playerIndex = scores.findIndex(
    (e) => e.name === effectiveName && e.score === playerScore,
  );

  const top = scores.slice(0, TOP_N);
  const showPlayerBelow = playerIndex >= TOP_N;

  const fmt = formatScore ?? ((e: ScoreEntry) => String(e.score));

  return (
    <div className="mt-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {t("score_lb_title")}
      </p>
      <div className="mt-2 overflow-hidden rounded-md border border-[#2a2a2a]">
        <table className="w-full text-xs">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-center w-6"></th>
              <th className="px-2 py-1.5 text-left">{t("lb_col_name")}</th>
              <th className="px-2 py-1.5 text-right">{t("lb_col_score")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  {t("home_loading")}
                </td>
              </tr>
            ) : scores.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  {t("score_lb_empty")}
                </td>
              </tr>
            ) : (
              <>
                {top.map((e, i) => (
                  <Row
                    key={`${e.date}-${i}`}
                    entry={e}
                    rank={i + 1}
                    isPlayer={i === playerIndex}
                    youLabel={t("wordle_lb_you")}
                    formatted={fmt(e)}
                  />
                ))}
                {showPlayerBelow ? (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-1 text-center text-gray-600"
                      >
                        …
                      </td>
                    </tr>
                    <Row
                      entry={scores[playerIndex]}
                      rank={playerIndex + 1}
                      isPlayer
                      youLabel={t("wordle_lb_you")}
                      formatted={fmt(scores[playerIndex])}
                    />
                  </>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  entry,
  rank,
  isPlayer,
  youLabel,
  formatted,
}: {
  entry: ScoreEntry;
  rank: number;
  isPlayer: boolean;
  youLabel: string;
  formatted: string;
}) {
  return (
    <tr
      className={
        isPlayer
          ? "bg-[#538d4e]/25 font-bold"
          : rank === 1
            ? "bg-amber-500/10"
            : "odd:bg-[#161616]"
      }
    >
      <td className="px-2 py-1.5 tabular-nums text-gray-400">{rank}</td>
      <td className="px-1 py-1.5 text-center text-base leading-none">
        {flagOf(entry.country)}
      </td>
      <td className="px-2 py-1.5 truncate max-w-[8rem]">
        {entry.name}
        {isPlayer ? (
          <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-300">
            · {youLabel}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
        {formatted}
      </td>
    </tr>
  );
}
