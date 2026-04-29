import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAMES = [
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "wordbuild",
  "colormatch",
  "cityplanner",
  "letterstack",
] as const;
type Game = (typeof GAMES)[number];

export type ScoreEntry = {
  name: string;
  score: number;
  time?: number;
  language?: string;
  country?: string;
  date: string;          // ISO timestamp
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
  // Higher = better for everything except Sudoku (time-based) — there, lower time wins.
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const game = url.searchParams.get("game");
  const period = url.searchParams.get("period") ?? "alltime";
  if (!isGame(game)) {
    return NextResponse.json({ error: "invalid game" }, { status: 400 });
  }
  const list = await readScores(game);
  const filtered = list.filter((e) => withinPeriod(e.date, period));
  filtered.sort(sortFor(game));
  return NextResponse.json({ game, period, scores: filtered.slice(0, 50) });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = body as Partial<ScoreEntry> & { game?: string };
  if (!isGame(b.game ?? null)) {
    return NextResponse.json({ error: "invalid game" }, { status: 400 });
  }
  const game = b.game as Game;
  const name = String(b.name ?? "").slice(0, 24).trim() || "Anonymous";
  const score = Number.isFinite(b.score) ? Number(b.score) : 0;
  const time = b.time != null && Number.isFinite(b.time) ? Number(b.time) : undefined;
  const language = typeof b.language === "string" ? b.language.slice(0, 5) : undefined;
  const country = typeof b.country === "string" ? b.country.slice(0, 4) : undefined;
  const meta = b.meta && typeof b.meta === "object" ? (b.meta as Record<string, unknown>) : undefined;

  const entry: ScoreEntry = {
    name,
    score,
    time,
    language,
    country,
    meta,
    date: new Date().toISOString(),
  };

  const list = await readScores(game);
  list.push(entry);
  list.sort(sortFor(game));
  const trimmed = list.slice(0, MAX_ENTRIES);
  try {
    await writeScores(game, trimmed);
  } catch (e) {
    return NextResponse.json({ error: "write failed", detail: String(e) }, { status: 500 });
  }
  const rank = trimmed.findIndex((e) => e === entry) + 1;
  return NextResponse.json({ ok: true, rank });
}
