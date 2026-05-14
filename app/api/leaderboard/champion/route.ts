// Monthly all-round champion standings.
//
// Reads every game's score file, filters to the requested period
// (default: this calendar month), and aggregates per-game placement
// into a single cross-game ranking — see computeChampion in
// lib/leaderboard/standings.ts for the points rule. This is the board
// the "all-round champion" prize is awarded from; the per-game monthly
// winners come from the main /api/leaderboard route with period=month.

import { NextResponse } from "next/server";
import { apiLimit, clientKeyFromRequest, rateLimitResponse } from "@/lib/ratelimit";
import { verifyOrigin } from "@/lib/verifyOrigin";
import {
  GAMES,
  type Game,
  type ScoreEntry,
  computeChampion,
  withinPeriod,
} from "@/lib/leaderboard/standings";
import { readScores } from "@/lib/leaderboard/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const forbidden = verifyOrigin(req);
  if (forbidden) return forbidden;

  const { success, reset } = await apiLimit.limit(clientKeyFromRequest(req));
  if (!success) return rateLimitResponse(reset);

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "month";

  // One read per game, in parallel. The files are small (≤1000 entries).
  const perGame: Partial<Record<Game, ScoreEntry[]>> = {};
  await Promise.all(
    GAMES.map(async (game) => {
      const list = await readScores(game);
      perGame[game] = list.filter((e) => withinPeriod(e.date, period));
    }),
  );

  const standings = computeChampion(perGame);
  return NextResponse.json({ period, standings: standings.slice(0, 50) });
}
