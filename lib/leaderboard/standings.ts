// Shared leaderboard logic — period filtering, per-game sort, player
// dedup, and the monthly all-round champion aggregation. Lives in lib/
// so both the per-game route and the champion route use one definition
// of "this month" and one ranking rule.

export const GAMES = [
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "colormatch",
  "letterstack",
  "vlakken",
  "verbind",
  "zonmaan",
  "kronen",
  "minesweeper",
  "connections",
] as const;
export type Game = (typeof GAMES)[number];

export type Period = "today" | "week" | "month" | "alltime";

export type ScoreEntry = {
  name: string;
  score: number;
  time?: number;
  language?: string;
  country?: string;
  date: string;
  meta?: Record<string, unknown>;
};

export function isGame(g: string | null | undefined): g is Game {
  return !!g && (GAMES as readonly string[]).includes(g);
}

// "month" is the current calendar month in UTC — it resets on the 1st,
// which is what a monthly prize competition needs (a rolling 30-day
// window would never have a clean reset point).
export function withinPeriod(date: string, period: string): boolean {
  if (period === "alltime" || !period) return true;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (period === "today") return now - t < 86_400_000;
  if (period === "week") return now - t < 7 * 86_400_000;
  if (period === "month") {
    const d = new Date(t);
    const n = new Date(now);
    return (
      d.getUTCFullYear() === n.getUTCFullYear() &&
      d.getUTCMonth() === n.getUTCMonth()
    );
  }
  return true;
}

// Sudoku ranks by fastest time; every other game ranks by highest score,
// time as the tiebreak.
export function sortFor(game: Game) {
  return (a: ScoreEntry, b: ScoreEntry) =>
    game === "sudoku"
      ? (a.time ?? Infinity) - (b.time ?? Infinity)
      : b.score - a.score || (a.time ?? Infinity) - (b.time ?? Infinity);
}

// Collapse a game's entries to one per player — their single best
// result. A monthly prize board has to show each player once; without
// this one strong player's repeat submissions would fill the top 10.
// Players are grouped case-insensitively on the trimmed name so
// "Alex" and "alex " count as the same person.
export function bestPerPlayer(entries: ScoreEntry[], game: Game): ScoreEntry[] {
  const sort = sortFor(game);
  const best = new Map<string, ScoreEntry>();
  for (const e of entries) {
    const key = e.name.trim().toLowerCase();
    const prev = best.get(key);
    if (!prev || sort(e, prev) < 0) best.set(key, e);
  }
  return [...best.values()].sort(sort);
}

// Rank → points for the monthly all-round championship. F1-style: depth
// past the podium still rewards being competitive in many games, which
// is the whole point of an "all-round" title.
export const RANK_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const;

export type ChampionStanding = {
  name: string;
  points: number;
  // Number of games the player placed in the points (top 10) for.
  gamesPlaced: number;
  // Games where the player is currently #1 this period.
  wins: number;
};

// Aggregate per-game monthly boards into an all-round standing. Input is
// each game's entries already filtered to the period; this function
// dedups per player, ranks, and awards RANK_POINTS to the top 10 of
// every game, then sums per player.
export function computeChampion(
  perGame: Partial<Record<Game, ScoreEntry[]>>,
): ChampionStanding[] {
  const totals = new Map<string, ChampionStanding>();
  for (const game of GAMES) {
    const entries = perGame[game];
    if (!entries || entries.length === 0) continue;
    const ranked = bestPerPlayer(entries, game);
    for (let i = 0; i < ranked.length && i < RANK_POINTS.length; i++) {
      const e = ranked[i];
      const key = e.name.trim().toLowerCase();
      const cur =
        totals.get(key) ??
        { name: e.name.trim(), points: 0, gamesPlaced: 0, wins: 0 };
      cur.points += RANK_POINTS[i];
      cur.gamesPlaced += 1;
      if (i === 0) cur.wins += 1;
      totals.set(key, cur);
    }
  }
  return [...totals.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || b.gamesPlaced - a.gamesPlaced,
  );
}
