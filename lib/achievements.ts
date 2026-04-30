"use client";

import type { GameKey } from "./scores";

export type AchievementId =
  | "bronze" | "silver" | "gold" | "diamond"
  | "facadefall_master" | "word_wizard" | "speed_demon"
  | "color_expert" | "logic_master";

export type Achievement = {
  id: AchievementId;
  name: string;
  icon: string;
  desc: string;
  // For progress display:
  target?: number;
  progress?: number;
  unlocked?: boolean;
  unlockedAt?: string;
};

export type Stats = {
  lastPlayed: string | null;
  streakDays: number;
  bestStreak: number;
  totalGames: number;
  totalSeconds: number;
  gamesPerType: Partial<Record<GameKey, number>>;
  playDays: Record<string, true>;       // ISO date → true
  unlocked: Partial<Record<AchievementId, string>>;  // id → ISO date
  records: {
    bestTileDropScore: number;
    bestTypingWpm: number;
    bestWordleGuesses: number;          // lowest # of guesses to win
    bestColorMatchCorrect: number;
    logicGamesSolved: number;           // total Vlakken/Verbind/Zon&Maan/Kronen wins
  };
};

const STORAGE_KEY = "brainarena-stats-v1";

function defaults(): Stats {
  return {
    lastPlayed: null,
    streakDays: 0,
    bestStreak: 0,
    totalGames: 0,
    totalSeconds: 0,
    gamesPerType: {},
    playDays: {},
    unlocked: {},
    records: {
      bestTileDropScore: 0,
      bestTypingWpm: 0,
      bestWordleGuesses: 99,
      bestColorMatchCorrect: 0,
      logicGamesSolved: 0,
    },
  };
}

export function loadStats(): Stats {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return { ...defaults(), ...parsed, records: { ...defaults().records, ...(parsed.records ?? {}) } };
  } catch {
    return defaults();
  }
}

export function saveStats(stats: Stats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function isoDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// Build a fresh achievement list from stats; computes locked/unlocked + progress.
export function listAchievements(stats: Stats = loadStats()): Achievement[] {
  const unlocked = stats.unlocked;
  const total = stats.totalGames;
  const streak = Math.max(stats.streakDays, stats.bestStreak);

  const items: Achievement[] = [
    {
      id: "bronze",
      name: "Bronze Medal",
      icon: "🥉",
      desc: "3-day streak or 10 games played",
      target: Math.min(3, 10),
      progress: Math.max(streak / 3, total / 10),
    },
    {
      id: "silver",
      name: "Silver Medal",
      icon: "🥈",
      desc: "7-day streak or 50 games played",
      progress: Math.max(streak / 7, total / 50),
    },
    {
      id: "gold",
      name: "Gold Medal",
      icon: "🥇",
      desc: "30-day streak or 200 games played",
      progress: Math.max(streak / 30, total / 200),
    },
    {
      id: "diamond",
      name: "Diamond Medal",
      icon: "💎",
      desc: "100-day streak or 1000 games played",
      progress: Math.max(streak / 100, total / 1000),
    },
    {
      id: "facadefall_master",
      name: "FacadeFall Master",
      icon: "🏠",
      desc: "Score 10 000 in TileDrop",
      progress: stats.records.bestTileDropScore / 10_000,
    },
    {
      id: "word_wizard",
      name: "Word Wizard",
      icon: "🧙",
      desc: "Solve Wordle in 2 guesses",
      progress: stats.records.bestWordleGuesses <= 2 ? 1 : 0.5,
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      icon: "⚡",
      desc: "Type 100+ WPM",
      progress: stats.records.bestTypingWpm / 100,
    },
    {
      id: "color_expert",
      name: "Color Expert",
      icon: "🎨",
      desc: "10/10 in ColorMatch",
      progress: stats.records.bestColorMatchCorrect / 10,
    },
    {
      id: "logic_master",
      name: "Logic Master",
      icon: "🧩",
      desc: "Solve 10 logic puzzles (Vlakken / Verbind / Zon & Maan / Kronen)",
      progress: stats.records.logicGamesSolved / 10,
    },
  ];

  return items.map((a) => ({
    ...a,
    progress: Math.max(0, Math.min(1, a.progress ?? 0)),
    unlocked: !!unlocked[a.id],
    unlockedAt: unlocked[a.id],
  }));
}

export type RecordResult = {
  stats: Stats;
  newAchievements: Achievement[];
  streakMessage: string | null;
};

const STREAK_MESSAGES: Record<number, string> = {
  3: "3 day streak! Your brain is warming up 🔥",
  7: "One week! You're more dedicated than 92% of players!",
  14: "Two weeks! BrainArena is your daily habit 💪",
  30: "30 days! You're officially a BrainArena addict 🧠",
  100: "100 days! You're a legend. Less than 1% reach this!",
};

function bumpStreakInline(stats: Stats, today: string): { streakChanged: boolean; message: string | null } {
  if (stats.lastPlayed === today) return { streakChanged: false, message: null };
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = stats.lastPlayed === yesterday ? stats.streakDays + 1 : 1;
  stats.streakDays = newStreak;
  if (newStreak > stats.bestStreak) stats.bestStreak = newStreak;
  stats.lastPlayed = today;
  stats.playDays[today] = true;
  return { streakChanged: true, message: STREAK_MESSAGES[newStreak] ?? null };
}

export type GameResultPayload = {
  game: GameKey;
  score: number;          // raw score returned by the game
  secondsPlayed: number;
  meta?: Record<string, unknown>;
};

export function recordGame(payload: GameResultPayload): RecordResult {
  const stats = loadStats();
  const today = isoDay();
  const { message: streakMessage } = bumpStreakInline(stats, today);

  stats.totalGames += 1;
  stats.totalSeconds += Math.max(0, Math.round(payload.secondsPlayed));
  stats.gamesPerType[payload.game] = (stats.gamesPerType[payload.game] ?? 0) + 1;

  const r = stats.records;
  if (payload.game === "tiledrop") r.bestTileDropScore = Math.max(r.bestTileDropScore, payload.score);
  if (payload.game === "typing") r.bestTypingWpm = Math.max(r.bestTypingWpm, payload.score);
  if (payload.game === "wordle") {
    const guesses = (payload.meta as { guesses?: number } | undefined)?.guesses;
    const won = (payload.meta as { won?: boolean } | undefined)?.won;
    if (won && typeof guesses === "number") r.bestWordleGuesses = Math.min(r.bestWordleGuesses, guesses);
  }
  if (payload.game === "colormatch") {
    const c = (payload.meta as { correct?: number } | undefined)?.correct ?? 0;
    r.bestColorMatchCorrect = Math.max(r.bestColorMatchCorrect, c);
  }
  if (
    payload.game === "vlakken" ||
    payload.game === "verbind" ||
    payload.game === "zonmaan" ||
    payload.game === "kronen"
  ) {
    const won = (payload.meta as { won?: boolean } | undefined)?.won;
    if (won) r.logicGamesSolved += 1;
  }

  // Unlock checks.
  const checks: Array<[AchievementId, boolean]> = [
    ["bronze",   stats.streakDays >= 3   || stats.totalGames >= 10],
    ["silver",   stats.streakDays >= 7   || stats.totalGames >= 50],
    ["gold",     stats.streakDays >= 30  || stats.totalGames >= 200],
    ["diamond",  stats.streakDays >= 100 || stats.totalGames >= 1000],
    ["facadefall_master", r.bestTileDropScore >= 10_000],
    ["word_wizard",       r.bestWordleGuesses <= 2],
    ["speed_demon",       r.bestTypingWpm >= 100],
    ["color_expert",      r.bestColorMatchCorrect >= 10],
    ["logic_master",      r.logicGamesSolved >= 10],
  ];

  const before = { ...stats.unlocked };
  for (const [id, met] of checks) {
    if (met && !stats.unlocked[id]) stats.unlocked[id] = today;
  }
  saveStats(stats);

  const allAch = listAchievements(stats);
  const newAchievements = allAch.filter((a) => a.unlocked && !before[a.id]);

  return { stats, newAchievements, streakMessage };
}

type T = (key: string) => string;

function fillN(template: string, n: number): string {
  return template.replace(/\{n\}/g, String(n));
}

export function streakBannerText(t: T, stats: Stats = loadStats()): string {
  const today = isoDay();
  if (stats.streakDays === 0) {
    return stats.bestStreak > 0
      ? fillN(t("streak_start_best"), stats.bestStreak)
      : t("streak_start");
  }
  if (stats.lastPlayed === today) {
    return fillN(t("streak_active"), stats.streakDays);
  }
  return fillN(t("streak_lost"), stats.streakDays);
}

export function medalCount(stats: Stats = loadStats()): number {
  return Object.keys(stats.unlocked).length;
}
