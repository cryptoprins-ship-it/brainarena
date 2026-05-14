"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameKey } from "@/lib/scores";
import { recordGame, type Achievement } from "@/lib/achievements";
import { getComparisonMessage, percentileFor, rankBracketMessage } from "@/lib/benchmarks";
import { useLocale } from "@/lib/i18n";
import { pushAchievementToast } from "./AchievementToast";
import ShareButton from "./ShareButton";

type Props = {
  game: GameKey;
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
  rank?: number;
  // The locale the game was played in — forwarded to the share text for
  // per-locale games (Wordle, Boggle, Typing, Letter Stack).
  locale?: string;
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

export default function EndScreenAddon({ game, score, time, meta, rank, locale }: Props) {
  const { t } = useLocale();
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
        <p className="text-xs uppercase tracking-wider text-indigo-300">{t("end_social_comparison")}</p>
        <p className="mt-1 text-sm">{comparison}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">{t("end_todays_ranking")}</p>
        <p className="mt-1 text-sm">
          {rank ? `${t("end_rank_global", { rank })} ` : null}
          {rankBracketMessage(percentile, rank)}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">{t("end_streak_label")}</p>
        <p className="mt-1 text-sm">
          🔥 {t("end_streak_days", { days: streakDays })}{streakMessage ? ` — ${streakMessage}` : ""}
        </p>
      </div>

      {unlocked.length > 0 ? (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
          <p className="text-xs uppercase tracking-wider text-indigo-300">
            {t(unlocked.length > 1 ? "end_new_achievements" : "end_new_achievement")}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {unlocked.map((a) => (
              <li key={a.id}><span className="mr-2 text-lg">{a.icon}</span><span className="font-bold">{a.name}</span> — <span className="text-gray-400">{a.desc}</span></li>
            ))}
          </ul>
          <Link href="/achievements" className="mt-2 inline-block text-xs text-indigo-300 hover:text-indigo-200">
            {t("end_view_achievements")}
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/${game}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">{t("win_play_again")}</Link>
        <ShareButton game={game} score={score} time={time} meta={meta} rank={rank} locale={locale} />
        <Link href={`/${NEXT_GAME[game]}`} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm">{t("end_try_another")}</Link>
        <Link href="/leaderboard" className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm">{t("end_view_leaderboard")}</Link>
      </div>

      <p className="pt-1 text-xs text-gray-500">
        {t("end_missing_game")}{" "}
        <a
          href={`mailto:info@brainarena.fun?subject=${encodeURIComponent("Game suggestion")}&body=${encodeURIComponent("I'd love to see this game on BrainArena: ")}`}
          className="underline hover:text-indigo-300"
        >
          {t("end_let_us_know")}
        </a>
      </p>
    </div>
  );
}
