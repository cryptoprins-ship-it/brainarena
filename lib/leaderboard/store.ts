// Server-only persistence for leaderboard score files. Kept separate
// from lib/leaderboard/standings.ts (which is isomorphic and safe to
// import into the client leaderboard page) because this module touches
// the filesystem.

import path from "node:path";
import fs from "node:fs/promises";
import type { Game, ScoreEntry } from "./standings";

export const MAX_ENTRIES = 1000;

function fileFor(game: Game): string {
  return path.join(process.cwd(), "public", "scores", `${game}.json`);
}

export async function readScores(game: Game): Promise<ScoreEntry[]> {
  try {
    const raw = await fs.readFile(fileFor(game), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeScores(game: Game, list: ScoreEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(fileFor(game)), { recursive: true });
  await fs.writeFile(fileFor(game), JSON.stringify(list, null, 2), "utf8");
}
