import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import { apiLimit, scoreLimit, clientKeyFromRequest, rateLimitResponse } from "@/lib/ratelimit";
import { verifyOrigin } from "@/lib/verifyOrigin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAMES = [
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
type Game = (typeof GAMES)[number];

export type ScoreEntry = {
  name: string;
  score: number;
  time?: number;
  language?: string;
  country?: string;
  date: string;
  meta?: Record<string, unknown>;
};

const MAX_ENTRIES = 1000;

function isGame(g: string | null): g is Game {
  return !!g && (GAMES as readonly string[]).includes(g);
}

function fileFor(g: Game) {
  return path.join(process.cwd(), "public", "scores", `${g}.json`);
}

async function readScores(g: Game): Promise<ScoreEntry[]> {
  try {
    const raw = await fs.readFile(fileFor(g), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeScores(g: Game, list: ScoreEntry[]) {
  await fs.mkdir(path.dirname(fileFor(g)), { recursive: true });
  await fs.writeFile(fileFor(g), JSON.stringify(list, null, 2), "utf8");
}

function sortFor(g: Game) {
  return (a: ScoreEntry, b: ScoreEntry) =>
    g === "sudoku"
      ? (a.time ?? Infinity) - (b.time ?? Infinity)
      : b.score - a.score || (a.time ?? Infinity) - (b.time ?? Infinity);
}

function withinPeriod(date: string, period: string): boolean {
  if (period === "alltime" || !period) return true;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (period === "today") return now - t < 86_400_000;
  if (period === "week") return now - t < 7 * 86_400_000;
  return true;
}

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
  filtered.sort(sortFor(game));
  return NextResponse.json({ game, period, scores: filtered.slice(0, 50) });
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

  const entry: ScoreEntry = {
    name: data.name || "Anonymous",
    score: Math.floor(data.score),
    time: data.time != null ? Math.floor(data.time) : undefined,
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
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  const rank = trimmed.findIndex((e) => e === entry) + 1;
  return NextResponse.json({ ok: true, rank });
}
