"use client";

import { useEffect, useMemo, useState } from "react";
import { listAchievements, loadStats, type Achievement, type Stats } from "@/lib/achievements";
import type { GameKey } from "@/lib/scores";

const GAME_LABEL: Record<GameKey, string> = {
  wordle: "Wordle",
  boggle: "Boggle",
  sudoku: "Sudoku",
  typing: "Typing",
  tiledrop: "TileDrop",
  colormatch: "ColorMatch",
  letterstack: "LetterStack",
  vlakken: "Vlakken",
  verbind: "Verbind",
  zonmaan: "Zon & Maan",
  kronen: "Kronen",
  minesweeper: "Minesweeper",
  connections: "Connections",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${seconds}s`;
}

function calendarDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { setStats(loadStats()); }, []);

  const achievements = useMemo<Achievement[]>(() => stats ? listAchievements(stats) : [], [stats]);
  const days = useMemo(calendarDates, []);

  if (!stats) {
    return <div className="mx-auto max-w-4xl px-4 py-8 text-gray-400">Loading…</div>;
  }

  const favEntry = (Object.entries(stats.gamesPerType) as [GameKey, number][])
    .sort(([, a], [, b]) => b - a)[0];
  const favorite = favEntry ? GAME_LABEL[favEntry[0]] : "—";
  const medalsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black md:text-4xl">Achievements & Streaks</h1>
      <p className="mt-2 text-sm text-gray-400">Daily medals, streaks and stats — all stored on this device.</p>

      {/* Stats overview */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total games" value={stats.totalGames} />
        <Stat label="Favourite" value={favorite} />
        <Stat label="Best streak" value={`${stats.bestStreak} d`} />
        <Stat label="Time played" value={formatTime(stats.totalSeconds)} />
        <Stat label="Medals" value={medalsCount} />
      </section>

      {/* Streak calendar */}
      <section className="mt-8 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Last 90 days</h2>
        <div className="mt-3 grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridAutoColumns: "min-content" }}>
          {days.map((d) => {
            const played = !!stats.playDays[d];
            return (
              <div
                key={d}
                title={d + (played ? " — played" : "")}
                className={`h-3 w-3 rounded-sm ${played ? "bg-emerald-500" : "bg-[#2a2a2a]"}`}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Current streak: <span className="font-bold text-emerald-300">{stats.streakDays}</span> days · Best:{" "}
          <span className="font-bold">{stats.bestStreak}</span>
        </p>
      </section>

      {/* Achievements grid */}
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Medals</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {achievements.map((a) => {
            const pct = Math.min(100, Math.round((a.progress ?? 0) * 100));
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${
                  a.unlocked
                    ? "border-indigo-500/30 bg-indigo-500/10"
                    : "border-[#2a2a2a] bg-[#1a1a1a]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-3xl ${a.unlocked ? "" : "grayscale opacity-40"}`}>{a.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${a.unlocked ? "text-white" : "text-gray-500"}`}>{a.name}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                    {a.unlocked && a.unlockedAt ? (
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-300">
                        Unlocked {a.unlockedAt}
                      </p>
                    ) : (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
