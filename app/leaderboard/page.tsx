"use client";

import { useEffect, useState } from "react";

type Game =
  | "wordle"
  | "boggle"
  | "sudoku"
  | "typing"
  | "tiledrop"
  | "colormatch"
  | "letterstack"
  | "vlakken"
  | "verbind"
  | "zonmaan"
  | "kronen";
type Period = "today" | "week" | "alltime";

type Entry = {
  name: string;
  score: number;
  time?: number;
  language?: string;
  country?: string;
  date: string;
};

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
];

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "alltime", label: "All Time" },
];

function flagOf(country?: string) {
  if (!country) return "🌍";
  const cc = country.trim().toUpperCase();
  if (cc.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

function scoreCell(game: Game, e: Entry): string {
  if (game === "sudoku" || game === "typing") {
    if (game === "sudoku" && e.time != null) return `${e.time}s`;
    if (game === "typing") return `${e.score} WPM`;
  }
  return String(e.score);
}

export default function LeaderboardPage() {
  const [game, setGame] = useState<Game>("wordle");
  const [period, setPeriod] = useState<Period>("today");
  const [scores, setScores] = useState<Entry[]>([]);
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
    return () => { active = false; };
  }, [game, period]);

  const top = scores[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black md:text-4xl">Global Leaderboard</h1>
      <p className="mt-2 text-sm text-gray-400">Top scores from BrainArena players worldwide.</p>

      {top ? (
        <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm">
          <span className="font-bold">#1 today: {top.name}</span> with{" "}
          <span className="font-mono">{scoreCell(game, top)}</span> {flagOf(top.country)} —{" "}
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
