"use client";

import { useEffect, useState } from "react";
import { loadStats, streakBannerText, type Stats } from "@/lib/achievements";

export default function StreakBanner() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { setStats(loadStats()); }, []);
  if (!stats) return null;

  const text = streakBannerText(stats);
  const today = new Date().toISOString().slice(0, 10);
  const playedToday = stats.lastPlayed === today;
  const tone = playedToday
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
    : stats.streakDays > 0
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-300";

  return (
    <div className={`mx-auto mb-4 max-w-4xl rounded-xl border px-4 py-2 text-sm ${tone}`}>
      {text}
    </div>
  );
}
