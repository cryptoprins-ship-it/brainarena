import { NextResponse } from "next/server";
import { z } from "zod";
import { apiLimit, scoreLimit, clientKeyFromRequest, rateLimitResponse } from "@/lib/ratelimit";
import { verifyOrigin } from "@/lib/verifyOrigin";
import { logger } from "@/lib/logger";
import { validateScore } from "@/lib/leaderboard/validate";
import {
  GAMES,
  type ScoreEntry,
  isGame,
  sortFor,
  withinPeriod,
  bestPerPlayer,
} from "@/lib/leaderboard/standings";
import { MAX_ENTRIES, readScores, writeScores } from "@/lib/leaderboard/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-exported for back-compat; the canonical definition lives in
// lib/leaderboard/standings.ts now.
export type { ScoreEntry } from "@/lib/leaderboard/standings";

// Schema validates BEFORE we touch the filesystem so a malformed POST can
// never wedge the JSON file. `meta` is intentionally permissive — game
// pages pass through arbitrary contextual telemetry there.
const scoreSchema = z.object({
  game: z.enum(GAMES),
  name: z.string().trim().min(1).max(24).default("Anonymous"),
  score: z.number().finite().min(0).max(10_000_000),
  time: z.number().finite().min(0).max(86400).optional(),
  language: z.string().max(5).optional(),
  country: z.string().max(4).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  const forbidden = verifyOrigin(req);
  if (forbidden) return forbidden;

  const { success, reset } = await apiLimit.limit(clientKeyFromRequest(req));
  if (!success) return rateLimitResponse(reset);

  const url = new URL(req.url);
  const game = url.searchParams.get("game");
  const period = url.searchParams.get("period") ?? "alltime";
  if (!isGame(game)) {
    return NextResponse.json({ error: "invalid_game" }, { status: 400 });
  }
  const list = await readScores(game);
  const filtered = list.filter((e) => withinPeriod(e.date, period));
  // The monthly board is the prize-bearing one — collapse it to one row
  // per player (their best result) so a single player's repeat plays
  // can't fill the top of the standings. Other periods stay raw.
  const ranked =
    period === "month"
      ? bestPerPlayer(filtered, game)
      : filtered.sort(sortFor(game));
  return NextResponse.json({ game, period, scores: ranked.slice(0, 50) });
}

export async function POST(req: Request) {
  const forbidden = verifyOrigin(req);
  if (forbidden) return forbidden;

  const ip = clientKeyFromRequest(req);
  const { success, reset } = await scoreLimit.limit(ip);
  if (!success) return rateLimitResponse(reset);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = scoreSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const game = data.game;

  // Zod proved the payload is well-formed; validateScore proves it's
  // *plausible* — and, where the canonical score is a known function of
  // verifiable evidence, recomputes it server-side. We persist the
  // returned score/time, never the client's originals.
  const verdict = validateScore({
    game,
    score: data.score,
    time: data.time,
    language: data.language,
    meta: data.meta,
  });
  if (!verdict.ok) {
    logger.warn(
      { game, reason: verdict.reason, ip, clientScore: data.score, clientTime: data.time },
      "leaderboard_score_rejected",
    );
    return NextResponse.json(
      { error: "rejected", reason: verdict.reason },
      { status: 422 },
    );
  }

  const entry: ScoreEntry = {
    name: data.name || "Anonymous",
    score: verdict.score,
    time: verdict.time,
    language: data.language,
    country: data.country,
    meta: data.meta,
    date: new Date().toISOString(),
  };

  const list = await readScores(game);
  list.push(entry);
  list.sort(sortFor(game));
  const trimmed = list.slice(0, MAX_ENTRIES);
  try {
    await writeScores(game, trimmed);
  } catch (err) {
    logger.error({ err, game }, "leaderboard_write_failed");
    // TEMPORARY DIAGNOSTIC — to be reverted once the Vercel env-var
    // visibility issue is pinned down. Surfaces just enough state in
    // the response to distinguish fs-fallback (EROFS, env-vars not
    // reaching the function) from a real Upstash error (401/NOAUTH/
    // network). Only emits booleans for env-var *presence* — never
    // the secret values.
    const e = err as { message?: string; code?: string };
    return NextResponse.json(
      {
        error: "internal_error",
        debug: {
          errMessage: e?.message ?? String(err),
          errCode: e?.code,
          hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
          hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        },
      },
      { status: 500 },
    );
  }
  const rank = trimmed.findIndex((e) => e === entry) + 1;
  return NextResponse.json({ ok: true, rank });
}
