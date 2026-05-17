// Server-only persistence for leaderboard score files. Kept separate
// from lib/leaderboard/standings.ts (which is isomorphic and safe to
// import into the client leaderboard page) because this module touches
// external storage.
//
// Two backends with the same public API:
//   - Upstash Redis (production / preview on Vercel) — picked up
//     automatically when UPSTASH_REDIS_REST_URL and
//     UPSTASH_REDIS_REST_TOKEN are set. We piggyback on the same
//     Redis instance the rate-limiter already uses (lib/ratelimit.ts).
//   - Local JSON files in public/scores/ (dev / unit tests) — used
//     when no Upstash env vars are present.
//
// The fs backend is what shipped originally. It silently broke on
// Vercel: the serverless filesystem is read-only outside /tmp, so
// every writeScores call there returned EROFS, the route returned
// 500, and submitScore on the client got `null` — no leaderboard
// entries ever persisted in production.

import path from "node:path";
import fs from "node:fs/promises";
import { Redis } from "@upstash/redis";
import type { Game, ScoreEntry } from "./standings";

export const MAX_ENTRIES = 1000;

function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = buildRedis();

// `:brainarena:` segment matches the namespacing the rate-limiter
// already uses (`ratelimit:brainarena:...`) so a shared Upstash
// instance — Renisual also stores data here — never has two apps
// reaching for the same key.
function redisKey(game: Game): string {
  return `leaderboard:brainarena:scores:${game}`;
}

function fileFor(game: Game): string {
  return path.join(process.cwd(), "public", "scores", `${game}.json`);
}

export async function readScores(game: Game): Promise<ScoreEntry[]> {
  if (redis) {
    // @upstash/redis JSON-decodes automatically when the value was
    // stored with .set() of a non-string. An empty key returns null.
    const raw = await redis.get<ScoreEntry[] | null>(redisKey(game));
    return Array.isArray(raw) ? raw : [];
  }
  try {
    const raw = await fs.readFile(fileFor(game), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeScores(game: Game, list: ScoreEntry[]): Promise<void> {
  if (redis) {
    // SET-overwrite the whole list. Concurrent writes race (last write
    // wins) but realistic traffic — one POST per game finish — makes
    // collisions vanishingly rare; the existing fs path had the same
    // last-writer-wins property. If contention ever shows up we can
    // switch to a sorted-set per game, but that's a behaviour-changing
    // refactor and not needed to unblock production today.
    await redis.set(redisKey(game), list);
    return;
  }
  await fs.mkdir(path.dirname(fileFor(game)), { recursive: true });
  await fs.writeFile(fileFor(game), JSON.stringify(list, null, 2), "utf8");
}
