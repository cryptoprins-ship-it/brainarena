"use client";

import { useEffect, useState } from "react";
import type {
  Game,
  Period,
  ScoreEntry,
  ChampionStanding,
} from "@/lib/leaderboard/standings";

const GAMES: { key: Game; label: string }[] = [
  { key: "wordle", label: "Wordle" },
  { key: "boggle", label: "Boggle" },
  { key: "sudoku", label: "Sudoku" },
  { key: "typing", label: "Typing" },
  { key: "tiledrop", label: "TileDrop" },
  { key: "colormatch", label: "ColorMatch" },
  { key: "letterstack", label: "LetterStack" },
  { key: "vlakken", label: "Vlakken" },
  { key: "verbind", label: "Verbind" },
  { key: "zonmaan", label: "Zon & Maan" },
  { key: "kronen", label: "Kronen" },
  { key: "minesweeper", label: "Minesweeper" },
  { key: "connections", label: "Connections" },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "alltime", label: "All Time" },
];

function monthLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function flagOf(country?: string) {
  if (!country) return "🌍";
  const cc = country.trim().toUpperCase();
  if (cc.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

function scoreCell(game: Game, e: ScoreEntry): string {
  if (game === "sudoku" && e.time != null) return `${e.time}s`;
  if (game === "typing") return `${e.score} WPM`;
  return String(e.score);
}

// Monthly all-round championship — aggregates per-game placement into a
// single cross-game ranking. This is the board the all-round prize is
// awarded from; per-game monthly winners are just #1 of each game's
// "This Month" board.
function ChampionPanel() {
  const [standings, setStandings] = useState<ChampionStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/leaderboard/champion?period=month")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setStandings(Array.isArray(data?.standings) ? data.standings : []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setStandings([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const champ = standings[0];

  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-black text-amber-200">
          🏆 All-Round Champion — {monthLabel()}
        </h2>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Points across all 13 games this month (top-10 placements score
        25-18-15-12-10-8-6-4-2-1).
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      ) : standings.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          No ranked games yet this month — be the first to place.
        </p>
      ) : (
        <>
          {champ ? (
            <p className="mt-3 text-sm">
              Leading:{" "}
              <span className="font-bold text-amber-100">{champ.name}</span>{" "}
              with <span className="font-mono">{champ.points} pts</span>
              {champ.wins > 0 ? (
                <span className="text-gray-400">
                  {" "}
                  ({champ.wins} game{champ.wins === 1 ? "" : "s"} won)
                </span>
              ) : null}
            </p>
          ) : null}
          <ol className="mt-3 space-y-1 text-sm">
            {standings.slice(0, 10).map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 ${
                  i === 0 ? "bg-amber-500/15" : "bg-[#1a1a1a]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 tabular-nums text-gray-500">{i + 1}</span>
                  <span className="font-medium">{s.name}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    {s.gamesPlaced} game{s.gamesPlaced === 1 ? "" : "s"}
                  </span>
                  <span className="font-mono text-sm text-amber-200">
                    {s.points} pts
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [game, setGame] = useState<Game>("wordle");
  const [period, setPeriod] = useState<Period>("today");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=${game}&period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setScores(Array.isArray(data?.scores) ? data.scores : []);
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
  }, [game, period]);

  const top = scores[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black md:text-4xl">Global Leaderboard</h1>
      <p className="mt-2 text-sm text-gray-400">Top scores from BrainArena players worldwide.</p>

      {/* Monthly all-round championship — only shown on the monthly view,
          which is the period it's scoped to. */}
      {period === "month" ? <ChampionPanel /> : null}

      {top ? (
        <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm">
          <span className="font-bold">
            #1 {period === "month" ? "this month" : period === "week" ? "this week" : period === "alltime" ? "all time" : "today"}: {top.name}
          </span>{" "}
          with <span className="font-mono">{scoreCell(game, top)}</span> {flagOf(top.country)} —{" "}
          <span className="text-indigo-300">Can you beat #1?</span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {GAMES.map((g) => (
          <button
            key={g.key}
            onClick={() => setGame(g.key)}
            className={`rounded-lg px-3 py-1.5 text-sm border transition ${
              game === g.key
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-300 hover:border-[#3a3a3c]"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-md px-3 py-1 text-xs uppercase tracking-wider border ${
              period === p.key
                ? "border-white/40 bg-white/10 text-white"
                : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-right">Score</th>
              <th className="px-4 py-2 text-center">Country</th>
              <th className="px-4 py-2 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
            ) : scores.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No scores yet — be the first!</td></tr>
            ) : (
              scores.map((e, i) => (
                <tr key={`${e.date}-${i}`} className={i === 0 ? "bg-indigo-500/10" : "hover:bg-[#222]"}>
                  <td className="px-4 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2 text-right font-mono">{scoreCell(game, e)}</td>
                  <td className="px-4 py-2 text-center">{flagOf(e.country)}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
