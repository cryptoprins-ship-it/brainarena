"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameKey } from "@/lib/scores";
import { recordGame, type Achievement } from "@/lib/achievements";
import { getComparisonMessage, percentileFor, rankBracketMessage } from "@/lib/benchmarks";
import { pushAchievementToast } from "./AchievementToast";

type Props = {
  game: GameKey;
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
  rank?: number;
};

const NEXT_GAME: Record<GameKey, GameKey> = {
  wordle: "boggle",
  boggle: "sudoku",
  sudoku: "typing",
  typing: "tiledrop",
  tiledrop: "colormatch",
  colormatch: "letterstack",
  letterstack: "vlakken",
  vlakken: "verbind",
  verbind: "zonmaan",
  zonmaan: "kronen",
  kronen: "minesweeper",
  minesweeper: "connections",
  connections: "wordle",
};

export default function EndScreenAddon({ game, score, time, meta, rank }: Props) {
  const [percentile] = useState(() => percentileFor({ game, score, time, meta }));
  const [comparison] = useState(() => getComparisonMessage(game, percentile));
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    const result = recordGame({ game, score, secondsPlayed: time ?? 0, meta });
    setStreakMessage(result.streakMessage);
    setStreakDays(result.stats.streakDays);
    setUnlocked(result.newAchievements);
    result.newAchievements.forEach((a) => pushAchievementToast(a));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-indigo-300">Social comparison</p>
        <p className="mt-1 text-sm">{comparison}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">Today's ranking</p>
        <p className="mt-1 text-sm">
          {rank ? <>You rank <span className="font-bold text-indigo-300">#{rank}</span> globally today. </> : null}
          {rankBracketMessage(percentile, rank)}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">Streak</p>
        <p className="mt-1 text-sm">
          🔥 {streakDays} day streak{streakMessage ? ` — ${streakMessage}` : ""}
        </p>
      </div>

      {unlocked.length > 0 ? (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
          <p className="text-xs uppercase tracking-wider text-indigo-300">New achievement{unlocked.length > 1 ? "s" : ""}!</p>
          <ul className="mt-1 space-y-1 text-sm">
            {unlocked.map((a) => (
              <li key={a.id}><span className="mr-2 text-lg">{a.icon}</span><span className="font-bold">{a.name}</span> — <span className="text-gray-400">{a.desc}</span></li>
            ))}
          </ul>
          <Link href="/achievements" className="mt-2 inline-block text-xs text-indigo-300 hover:text-indigo-200">
            View all achievements →
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/${game}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">Play again</Link>
        <Link href={`/${NEXT_GAME[game]}`} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm">Try another game →</Link>
      </div>
    </div>
  );
}
