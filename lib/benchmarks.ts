import type { GameKey } from "./scores";

// Per-profession percentile baselines (0–100): "this profession scores
// at this level on average". Used purely for entertainment / social comparison.
export const benchmarks: Partial<Record<GameKey, Record<string, number>>> = {
  wordle: {
    "CEOs": 65,
    "Teachers": 72,
    "Software developers": 78,
    "Doctors": 61,
    "Students": 58,
  },
  typing: {
    "CEOs": 55,
    "Software developers": 82,
    "Secretaries": 75,
    "Journalists": 68,
  },
  sudoku: {
    "Mathematicians": 71,
    "Accountants": 68,
    "Engineers": 74,
  },
  colormatch: {
    "Interior designers": 81,
    "Architects": 79,
    "Painters": 85,
    "CEOs": 52,
  },
  vlakken: {
    "Architects": 78,
    "Tilers": 82,
    "CEOs": 60,
  },
  verbind: {
    "Logisticians": 80,
    "Programmers": 84,
    "Students": 62,
  },
  zonmaan: {
    "Mathematicians": 85,
    "Logicians": 81,
    "Engineers": 76,
  },
  kronen: {
    "Chess players": 88,
    "Mathematicians": 82,
    "Software developers": 76,
  },
  boggle: {
    "Linguists": 78,
    "Crossword fans": 81,
    "Editors": 74,
  },
  letterstack: {
    "Gamers": 75,
    "Stenographers": 80,
  },
  tiledrop: {
    "Gamers": 79,
    "Engineers": 70,
  },
};

// Map raw game results → a coarse 0–100 percentile so we can compare against
// the baselines above. These are deliberately simple — calibrate when real
// leaderboard data is available.
type Score = {
  game: GameKey;
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
};

export function percentileFor(s: Score): number {
  switch (s.game) {
    case "wordle": {
      // Score is encoded as (ROWS - guesses + 1) → 6 = solved in 1 guess.
      const v = s.score;
      if (v >= 6) return 99;
      if (v >= 5) return 92;
      if (v >= 4) return 78;
      if (v >= 3) return 55;
      if (v >= 2) return 32;
      if (v >= 1) return 12;
      return 5;
    }
    case "boggle": {
      const v = s.score;
      if (v >= 100) return 96;
      if (v >= 60) return 88;
      if (v >= 30) return 72;
      if (v >= 10) return 50;
      return 25;
    }
    case "sudoku": {
      const t = s.time ?? Infinity;
      const diff = (s.meta as { difficulty?: string } | undefined)?.difficulty ?? "easy";
      const target = diff === "hard" ? 900 : diff === "medium" ? 600 : 400;
      const ratio = target / t;
      if (ratio >= 1.4) return 96;
      if (ratio >= 1.0) return 85;
      if (ratio >= 0.7) return 65;
      if (ratio >= 0.5) return 45;
      return 20;
    }
    case "typing": {
      const w = s.score;
      if (w >= 120) return 99;
      if (w >= 100) return 95;
      if (w >= 80) return 88;
      if (w >= 60) return 75;
      if (w >= 40) return 55;
      if (w >= 20) return 30;
      return 10;
    }
    case "tiledrop": {
      const v = s.score;
      if (v >= 10000) return 96;
      if (v >= 5000) return 88;
      if (v >= 2000) return 72;
      if (v >= 500) return 50;
      return 25;
    }
    case "colormatch": {
      const correct = (s.meta as { correct?: number } | undefined)?.correct ?? 0;
      if (correct === 10) return 97;
      if (correct >= 7) return 82;
      if (correct >= 4) return 55;
      return 25;
    }
    case "vlakken":
    case "verbind":
    case "zonmaan":
    case "kronen": {
      // Logic puzzles: score = time-based (lower = better; encoded as 100000 - seconds).
      const t = s.time ?? Infinity;
      const diff = (s.meta as { difficulty?: string } | undefined)?.difficulty ?? "easy";
      const target = diff === "hard" ? 600 : diff === "medium" ? 360 : 240;
      const ratio = target / t;
      if (ratio >= 1.4) return 96;
      if (ratio >= 1.0) return 85;
      if (ratio >= 0.7) return 65;
      if (ratio >= 0.5) return 45;
      return 20;
    }
    case "letterstack": {
      const v = s.score;
      if (v >= 5000) return 95;
      if (v >= 2000) return 80;
      if (v >= 500) return 55;
      return 30;
    }
  }
}

export function getComparisonMessage(game: GameKey, percentile: number): string {
  const dict = benchmarks[game];
  if (!dict) return percentile >= 50 ? "Above average — nice work!" : "Keep practising!";
  const professions = Object.keys(dict);
  const profession = professions[Math.floor(Math.random() * professions.length)];
  const baseline = dict[profession];
  const beat = percentile - baseline;
  if (beat >= 5) {
    return `You scored better than ${Math.round(percentile)}% of ${profession} who play BrainArena!`;
  }
  if (beat >= -5) {
    return `You're right on par with the average ${profession.replace(/s$/, "")}!`;
  }
  return `You're catching up to ${profession} — keep going!`;
}

export function rankBracketMessage(percentile: number, ranked?: number): string {
  if (percentile >= 90) {
    return ranked
      ? `You're in the elite! Only ${Math.max(0, ranked - 1)} players beat you today.`
      : "You're in the elite! Top 10% globally.";
  }
  if (percentile >= 75) return "Impressive! You're better than 3 out of 4 players.";
  if (percentile >= 50) return "Above average! Keep playing to climb higher.";
  return "Practice makes perfect — come back tomorrow!";
}
