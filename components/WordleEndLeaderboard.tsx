"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { ScoreEntry } from "@/lib/leaderboard/standings";

const ROWS = 6;
const TOP_N = 10;

type Props = {
  // Current locale: scopes the table to plays of THIS locale's daily
  // word, otherwise the board mixes different puzzles into one ranking.
  locale: string;
  // What the local player just submitted, so the table can find and
  // highlight their row even if there are duplicate names. `name` may
  // be empty (anonymous play, no leaderboard entry); in that case we
  // just render the public top.
  playerName: string;
  playerGuesses: number;
  playerTime: number;
  // Rank returned by POST /api/leaderboard at submit. Used as a
  // refetch trigger so the table reflects the freshly appended entry
  // once the server has acknowledged it; the value itself is not read.
  submittedRank?: number;
};

// Pogingen = (ROWS - score + 1). meta.guesses, when present, is the
// authoritative count; falling back to the score lets us render older
// entries written before meta was a field too.
function attemptsOf(e: ScoreEntry): number {
  const meta = e.meta as { guesses?: unknown } | undefined;
  if (meta && typeof meta.guesses === "number") return meta.guesses;
  return Math.max(1, Math.min(ROWS, ROWS - e.score + 1));
}

export default function WordleEndLeaderboard({
  locale,
  playerName,
  playerGuesses,
  playerTime,
  submittedRank,
}: Props) {
  const { t } = useLocale();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=wordle&period=today`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const all: ScoreEntry[] = Array.isArray(data?.scores) ? data.scores : [];
        // Filter to this locale's daily word — the API returns scores
        // across all languages, but only same-language entries played
        // the puzzle the current player just finished.
        const sameLang = all.filter((e) => e.language === locale);
        setScores(sameLang);
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
    // submittedRank flips from undefined → number once POST /api/leaderboard
    // resolves; refetch then so the table reflects the row the server just
    // appended for this player.
  }, [locale, submittedRank]);

  // Locate the player's row in the filtered+sorted list. Match on
  // name+attempts+time; ties on (name, score, time) are rare enough on
  // a daily board that the first hit is the right one. The server
  // substitutes "Anonymous" for empty submissions, so mirror that
  // mapping when the local player has no saved name.
  const effectiveName = playerName || "Anonymous";
  const playerIndex = scores.findIndex(
    (e) =>
      e.name === effectiveName &&
      attemptsOf(e) === playerGuesses &&
      (e.time ?? -1) === playerTime,
  );

  const top = scores.slice(0, TOP_N);
  // If the player ranked below the visible top, append their row with
  // a separator so they always see where they stand.
  const showPlayerBelow = playerIndex >= TOP_N;

  return (
    <div className="mt-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {t("wordle_lb_title")}
      </p>
      <div className="mt-2 overflow-hidden rounded-md border border-[#2a2a2a]">
        <table className="w-full text-xs">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-left">{t("lb_col_name")}</th>
              <th className="px-2 py-1.5 text-right">
                {t("wordle_lb_col_attempts")}
              </th>
              <th className="px-2 py-1.5 text-right">
                {t("wordle_lb_col_time")}
              </th>
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
                  {t("wordle_lb_empty")}
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
}: {
  entry: ScoreEntry;
  rank: number;
  isPlayer: boolean;
  youLabel: string;
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
      <td className="px-2 py-1.5 truncate max-w-[8rem]">
        {entry.name}
        {isPlayer ? (
          <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-300">
            · {youLabel}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
        {attemptsOf(entry)}
      </td>
      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
        {entry.time != null ? `${entry.time}s` : "—"}
      </td>
    </tr>
  );
}
