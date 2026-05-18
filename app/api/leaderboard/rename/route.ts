import { NextResponse } from "next/server";
import { z } from "zod";
import { apiLimit, clientKeyFromRequest, rateLimitResponse } from "@/lib/ratelimit";
import { verifyOrigin } from "@/lib/verifyOrigin";
import { logger } from "@/lib/logger";
import { GAMES, isGame, withinPeriod } from "@/lib/leaderboard/standings";
import { readScores, writeScores } from "@/lib/leaderboard/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const renameSchema = z.object({
  game: z.enum(GAMES),
  oldName: z.string().trim().min(1).max(24),
  newName: z.string().trim().min(1).max(24),
});

// POST /api/leaderboard/rename — rewrites every entry within today's
// window for a single game from oldName to newName. Players who mistype
// their name on a win screen ("marrc" instead of "marc") can fix the
// row without losing the leaderboard placement.
//
// Scope is intentionally limited to today's UTC window so an open
// endpoint can't be used to silently retitle historical rankings. Rate
// limiting + origin check keep automated abuse cheap to mitigate.
export async function POST(req: Request) {
  const forbidden = verifyOrigin(req);
  if (forbidden) return forbidden;

  const { success, reset } = await apiLimit.limit(clientKeyFromRequest(req));
  if (!success) return rateLimitResponse(reset);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = renameSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { game, oldName, newName } = parsed.data;
  if (!isGame(game)) {
    return NextResponse.json({ error: "invalid_game" }, { status: 400 });
  }
  if (oldName === newName) {
    return NextResponse.json({ ok: true, renamed: 0 });
  }

  const list = await readScores(game);
  let renamed = 0;
  const next = list.map((e) => {
    if (
      e.name === oldName &&
      withinPeriod(e.date, "today")
    ) {
      renamed += 1;
      return { ...e, name: newName };
    }
    return e;
  });
  if (renamed === 0) {
    return NextResponse.json({ ok: true, renamed: 0 });
  }

  try {
    await writeScores(game, next);
  } catch (err) {
    logger.error({ err, game }, "leaderboard_rename_failed");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, renamed });
}
