"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dayIndex } from "@/lib/dailyWord";
import { getName, setName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";

const SIZE = 8;
const ROUNDS = 20;

type Tile = "house" | "park" | "shop" | "factory" | "road";

const ICON: Record<Tile, string> = {
  house: "🏠",
  park: "🌳",
  shop: "🏪",
  factory: "🏭",
  road: "🛣️",
};
const TILES: Tile[] = ["house", "park", "shop", "factory", "road"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailySequence(): Tile[] {
  const rng = mulberry32(dayIndex() + 0xc1ade);
  return Array.from({ length: ROUNDS }, () => TILES[Math.floor(rng() * TILES.length)]);
}

function neighbors(idx: number): number[] {
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const out: number[] = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr; const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) continue;
    out.push(nr * SIZE + nc);
  }
  return out;
}

function scorePlacement(grid: (Tile | null)[], idx: number, tile: Tile): number {
  let pts = 0;
  const adj = neighbors(idx).map((i) => grid[i]).filter(Boolean) as Tile[];
  if (tile === "house") {
    pts += adj.filter((t) => t === "park").length * 3;
    pts -= adj.filter((t) => t === "factory").length * 2;
  } else if (tile === "shop") {
    pts += adj.filter((t) => t === "road").length * 2;
  } else if (tile === "factory") {
    pts -= adj.filter((t) => t === "house").length * 2;
    if (!adj.some((t) => t === "house")) pts += 2;
  } else if (tile === "park") {
    // Parks have no direct points themselves but boost adjacent houses.
    pts += adj.filter((t) => t === "house").length * 3;
  }
  return pts;
}

function totalScore(grid: (Tile | null)[]): { total: number; bonus: number } {
  let total = 0;
  // Recompute as if each tile was placed last (relative bonuses); add road network bonus.
  grid.forEach((t, i) => {
    if (!t) return;
    const adj = neighbors(i).map((j) => grid[j]);
    if (t === "house") {
      total += adj.filter((x) => x === "park").length * 3;
      total -= adj.filter((x) => x === "factory").length * 2;
    } else if (t === "shop") {
      total += adj.filter((x) => x === "road").length * 2;
    } else if (t === "factory") {
      total -= adj.filter((x) => x === "house").length * 2;
      if (!adj.some((x) => x === "house")) total += 2;
    }
  });
  // Connected road bonus — count the largest connected component of roads × 2.
  const visited = new Array(grid.length).fill(false);
  let largest = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== "road" || visited[i]) continue;
    const stack = [i];
    let count = 0;
    while (stack.length) {
      const x = stack.pop()!;
      if (visited[x]) continue;
      visited[x] = true;
      if (grid[x] !== "road") continue;
      count++;
      for (const n of neighbors(x)) if (!visited[n] && grid[n] === "road") stack.push(n);
    }
    if (count > largest) largest = count;
  }
  const bonus = largest * 2;
  return { total: total + bonus, bonus };
}

function ratingFor(score: number): string {
  if (score >= 60) return "Metropolis";
  if (score >= 40) return "City";
  if (score >= 20) return "Town";
  if (score >= 5) return "Village";
  return "Slum";
}

export default function CityPlannerPage() {
  const sequence = useMemo(dailySequence, []);
  const [grid, setGrid] = useState<(Tile | null)[]>(() => Array(SIZE * SIZE).fill(null));
  const [round, setRound] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");

  useEffect(() => { setNameState(getName()); }, []);

  const place = useCallback((idx: number) => {
    if (done) return;
    if (grid[idx]) return;
    const tile = sequence[round];
    const next = grid.slice();
    next[idx] = tile;
    setGrid(next);
    const r = round + 1;
    setRound(r);
    if (r >= ROUNDS) setDone(true);
  }, [done, grid, round, sequence]);

  const { total, bonus } = useMemo(() => totalScore(grid), [grid]);

  // Submit on done.
  useEffect(() => {
    if (!done || submitted) return;
    submitScore({
      game: "cityplanner",
      name: getName() || "Anonymous",
      score: total,
      meta: { rating: ratingFor(total), bonus },
    }).then((r) => r && setSubmitted(r));
  }, [bonus, done, submitted, total]);

  const tilePreview = sequence[round];
  const previewPts = hover != null && tilePreview && !grid[hover] ? scorePlacement(grid, hover, tilePreview) : null;

  const saveName = () => {
    setName(name);
    submitScore({
      game: "cityplanner",
      name: name || "Anonymous",
      score: total,
      meta: { rating: ratingFor(total), bonus },
    }).then((r) => r && setSubmitted(r));
  };

  const share = async () => {
    const text = `My CityPlanner: ${ratingFor(total)} · ${total} pts. brainarena.fun`;
    try { await navigator.clipboard.writeText(text); alert("Copied to clipboard!"); } catch { prompt("Copy:", text); }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <StreakBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">CityPlanner</h1>
          <p className="text-xs text-gray-400">Daily challenge · Round {Math.min(round + 1, ROUNDS)}/{ROUNDS} · Score <span className="font-mono">{total}</span></p>
        </div>
        <div className="rounded-md bg-[#1a1a1a] px-3 py-1 text-sm">
          {done ? "Done" : <>Place: <span className="text-xl">{ICON[tilePreview]}</span></>}
        </div>
      </div>

      <div
        className="mt-5 mx-auto grid gap-px bg-[#3a3a3c] p-px rounded-xl"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 2.25rem)` }}
      >
        {grid.map((t, i) => (
          <button
            key={i}
            onClick={() => place(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            disabled={done || !!t}
            className={`flex h-9 w-9 items-center justify-center text-lg ${
              t ? "bg-[#1a1a1a]" : "bg-[#0a0a0a] hover:bg-[#222]"
            } ${hover === i && !t && !done ? "ring-2 ring-indigo-400" : ""}`}
          >
            {t ? ICON[t] : ""}
          </button>
        ))}
      </div>

      {!done && hover != null && previewPts != null ? (
        <p className="mt-2 text-center text-xs text-gray-400">
          Place here: <span className={previewPts > 0 ? "text-emerald-300" : previewPts < 0 ? "text-red-300" : "text-gray-300"}>
            {previewPts > 0 ? "+" : ""}{previewPts} pts
          </span>
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-400 md:grid-cols-5">
        <div>🏠 next to 🌳: +3</div>
        <div>🏪 next to 🛣️: +2</div>
        <div>🏭 away from 🏠: +2</div>
        <div>🏠 next to 🏭: −2</div>
        <div>Connected 🛣️ network: bonus</div>
      </div>

      {done ? (
        <EndScreenAddon
          game="cityplanner"
          score={total}
          rank={submitted?.rank}
          meta={{ rating: ratingFor(total), bonus }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <h2 className="text-xl font-black">Your city: <span className="text-indigo-300">{ratingFor(total)}</span> · {total} pts</h2>
          <p className="mt-1 text-xs text-gray-400">Road network bonus: +{bonus}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!submitted ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setNameState(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
                />
                <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">Submit</button>
              </>
            ) : (
              <p className="text-sm text-emerald-300">Ranked #{submitted.rank} globally.</p>
            )}
            <button onClick={share} className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm">Share</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
