// Server-side score validation for the leaderboard POST handler.
//
// The leaderboard used to trust whatever score the client posted. That's
// fine for a cosmetic ranking but not once real prizes are attached — a
// `curl` with `score: 9999999` would top every board. This module is the
// first line of defence: for every game where the canonical score is a
// known function of verifiable evidence, the SERVER recomputes it and
// ignores the client's number entirely. Where the score can't yet be
// recomputed from what the client sends, we at least bounds-check it.
//
// What this does NOT do (yet): replay a full solution to prove the
// evidence itself is genuine. That needs each game to ship its solve
// proof in `meta` (Wordle already does — `states` + `target`; the logic
// puzzles would need their move list). Until then a determined attacker
// who fabricates *internally consistent* evidence can still get through;
// the trivial "post a huge number" attack cannot.

import { dailyWord } from "@/lib/dailyWord";
import type { Locale } from "@/lib/i18n";

export type ValidatableGame =
  | "wordle" | "boggle" | "sudoku" | "typing" | "tiledrop" | "colormatch"
  | "letterstack" | "vlakken" | "verbind" | "zonmaan" | "kronen"
  | "minesweeper" | "connections";

export type ValidateInput = {
  game: ValidatableGame;
  score: number;
  time?: number;
  language?: string;
  meta?: Record<string, unknown>;
};

// On success, `score`/`time` are the SERVER's canonical values — the
// caller must persist these, not the client's originals.
export type ValidateResult =
  | { ok: true; score: number; time?: number }
  | { ok: false; reason: string };

const SUPPORTED_LOCALES = new Set<string>([
  "en", "nl", "de", "fr", "es", "hi", "pt-BR", "ja",
]);

// Logic puzzles whose leaderboard score is exactly `max(1, 100000 - time)`
// — see each game's submitScore call. The score is fully determined by
// the time, so the server recomputes it and discards the client value.
const TIME_DECAY_GAMES = new Set<ValidatableGame>([
  "vlakken", "verbind", "zonmaan", "kronen", "minesweeper",
]);

// Minimum plausible solve time (seconds). Deliberately far below any real
// human pace — the point is only to kill `time: 0` (which would yield the
// maximum possible score), not to police fast solvers.
const MIN_SOLVE_TIME: Partial<Record<ValidatableGame, number>> = {
  vlakken: 4, verbind: 4, zonmaan: 4, kronen: 4, minesweeper: 4, sudoku: 10,
};

// Hard score ceilings for games we can't yet recompute. Generous — these
// only catch absurd values, not skilled play.
const SCORE_CEIL: Partial<Record<ValidatableGame, number>> = {
  boggle: 20_000,       // every word on a 4×4 grid found, max length
  typing: 320,          // current human WPM record is ~216
  tiledrop: 2_000_000,  // very high but reachable in a long endless run
  colormatch: 100_000,
  letterstack: 100_000,
  connections: 4,       // 0-4 groups solved
};

function metaNumber(meta: Record<string, unknown> | undefined, key: string): number | null {
  const v = meta?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function metaString(meta: Record<string, unknown> | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === "string" ? v : null;
}

export function validateScore(input: ValidateInput): ValidateResult {
  const { game, meta } = input;
  const time = input.time != null ? Math.floor(input.time) : undefined;

  // --- Logic puzzles: score is a pure function of time. Recompute it.
  if (TIME_DECAY_GAMES.has(game)) {
    if (time == null) return { ok: false, reason: "missing_time" };
    if (time < (MIN_SOLVE_TIME[game] ?? 1)) return { ok: false, reason: "implausible_time" };
    if (time > 86_400) return { ok: false, reason: "implausible_time" };
    return { ok: true, score: Math.max(1, 100_000 - time), time };
  }

  // --- Sudoku: score is always 1, the board is ranked by time.
  if (game === "sudoku") {
    if (time == null) return { ok: false, reason: "missing_time" };
    if (time < (MIN_SOLVE_TIME.sudoku ?? 10)) return { ok: false, reason: "implausible_time" };
    if (time > 86_400) return { ok: false, reason: "implausible_time" };
    return { ok: true, score: 1, time };
  }

  // --- Wordle: score is (7 - guesses); recompute from meta.guesses, and
  // verify the played target is actually today's (or yesterday's, to
  // tolerate a submission landing right after the UTC rollover) daily
  // word for the locale.
  if (game === "wordle") {
    const guesses = metaNumber(meta, "guesses");
    if (guesses == null || !Number.isInteger(guesses) || guesses < 1 || guesses > 6) {
      return { ok: false, reason: "bad_wordle_guesses" };
    }
    const target = metaString(meta, "target");
    const lang = input.language;
    if (target && lang && SUPPORTED_LOCALES.has(lang)) {
      const today = dailyWord(lang as Locale);
      const yesterday = dailyWord(lang as Locale, new Date(Date.now() - 86_400_000));
      if (target !== today && target !== yesterday) {
        return { ok: false, reason: "wrong_daily_target" };
      }
    }
    return { ok: true, score: 7 - guesses, time };
  }

  // --- Connections: can't recompute "groups solved" from mistakes alone,
  // so bounds-check both against their known 0-4 ranges.
  if (game === "connections") {
    const mistakes = metaNumber(meta, "mistakes");
    if (mistakes != null && (mistakes < 0 || mistakes > 4)) {
      return { ok: false, reason: "bad_connections_mistakes" };
    }
    if (input.score < 0 || input.score > 4) {
      return { ok: false, reason: "score_out_of_range" };
    }
    return { ok: true, score: Math.floor(input.score), time };
  }

  // --- Everything else: bounds-only until the game ships solve proof.
  const ceil = SCORE_CEIL[game];
  if (input.score < 0 || (ceil != null && input.score > ceil)) {
    return { ok: false, reason: "score_out_of_range" };
  }
  return { ok: true, score: Math.floor(input.score), time };
}
