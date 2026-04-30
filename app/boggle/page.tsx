"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayIndex } from "@/lib/dailyWord";
import { getName, setName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";

const SIZE = 4;
const DURATION = 180; // seconds

// Standard letter frequency-weighted bag (English-leaning, works across our 5 langs).
const BAG = "AAAABBCCDDDEEEEEEEEFFGGHHHIIIIIJKLLLMMNNNNOOOOPPQRRRRSSSSTTTTTUUUVVWWXYYZ";

function pointsFor(len: number): number {
  if (len < 3) return 0;
  if (len === 3) return 1;
  if (len === 4) return 2;
  if (len === 5) return 4;
  if (len === 6) return 7;
  return 11;
}

function neighbors(idx: number): number[] {
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr; const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) continue;
      out.push(nr * SIZE + nc);
    }
  }
  return out;
}

// Seeded PRNG so the daily grid is identical for everyone.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(seed: number): string[] {
  const rng = mulberry32(seed);
  const out: string[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    out.push(BAG[Math.floor(rng() * BAG.length)]);
  }
  return out;
}

export default function BogglePage() {
  const [grid, setGrid] = useState<string[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [time, setTime] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");
  const startedAt = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => { setGrid(makeGrid(dayIndex())); setNameState(getName()); }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = DURATION - Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000);
      if (remaining <= 0) { setTime(0); setRunning(false); setDone(true); return; }
      setTime(remaining);
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (running || done) return;
    startedAt.current = Date.now();
    setRunning(true);
  }, [done, running]);

  const word = path.map((i) => grid[i]).join("").toLowerCase();

  const tryCommit = useCallback(() => {
    if (!running) { setPath([]); return; }
    if (path.length >= 3 && !found.includes(word)) {
      setFound((f) => [word, ...f]);
    } else if (path.length >= 1) {
      setShakeKey((k) => k + 1);
    }
    setPath([]);
  }, [found, path.length, running, word]);

  const score = useMemo(() => found.reduce((s, w) => s + pointsFor(w.length), 0), [found]);

  const onCell = useCallback((idx: number, fromDrag: boolean) => {
    if (!running || done) return;
    setPath((p) => {
      if (p.includes(idx)) {
        if (!fromDrag && p[p.length - 1] === idx) {
          // Click last to confirm: handled by mouseUp instead, but keep behavior safe.
          return p;
        }
        return p;
      }
      if (p.length === 0) return [idx];
      const last = p[p.length - 1];
      if (!neighbors(last).includes(idx)) return p;
      return [...p, idx];
    });
  }, [done, running]);

  // Submit on game end.
  useEffect(() => {
    if (!done || submitted) return;
    submitScore({
      game: "boggle",
      name: getName() || "Anonymous",
      score,
      time: DURATION,
      meta: { found },
    }).then((r) => r && setSubmitted(r));
  }, [done, found, score, submitted]);

  const saveName = () => {
    setName(name);
    if (done) {
      submitScore({
        game: "boggle",
        name: name || "Anonymous",
        score,
        time: DURATION,
        meta: { found },
      }).then((r) => r && setSubmitted(r));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="boggle" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Boggle</h1>
          <p className="text-xs text-gray-400">Daily 4×4 · find words 3+ letters · {DURATION}s</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1 text-sm font-mono">⏱ {time}s</span>
          <span className="rounded-md bg-indigo-500/20 px-3 py-1 text-sm font-bold text-indigo-200">★ {score}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div
            key={shakeKey}
            className="mx-auto grid w-full max-w-sm grid-cols-4 gap-2 select-none"
            onMouseUp={() => { dragging.current = false; tryCommit(); }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchEnd={() => { dragging.current = false; tryCommit(); }}
          >
            {grid.map((ch, i) => {
              const inPath = path.includes(i);
              const isLast = path[path.length - 1] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => { if (running) { dragging.current = true; setPath([i]); } else { start(); dragging.current = true; setPath([i]); } }}
                  onMouseEnter={() => { if (dragging.current) onCell(i, true); }}
                  onTouchStart={() => { if (running) { dragging.current = true; setPath([i]); } else { start(); dragging.current = true; setPath([i]); } }}
                  className={`aspect-square rounded-xl border-2 text-2xl font-black uppercase transition ${
                    inPath
                      ? isLast
                        ? "border-emerald-300 bg-emerald-500/30"
                        : "border-indigo-300 bg-indigo-500/30"
                      : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3c]"
                  }`}
                >
                  {ch}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Word: <span className="font-mono uppercase text-white">{word || "—"}</span></span>
            {!running && !done ? (
              <button onClick={start} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">Start</button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Found ({found.length})</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 text-sm">
            {found.map((w) => (
              <li key={w} className="flex justify-between">
                <span className="uppercase">{w}</span>
                <span className="text-gray-500">+{pointsFor(w.length)}</span>
              </li>
            ))}
            {found.length === 0 ? <li className="text-gray-600">Drag to build words.</li> : null}
          </ul>
        </div>
      </div>

      {done ? (
        <EndScreenAddon
          game="boggle"
          score={score}
          time={DURATION}
          rank={submitted?.rank}
          meta={{ found: found.length }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-black">Time! Final score: <span className="text-indigo-300">{score}</span></h2>
          <p className="mt-1 text-sm text-gray-400">{found.length} words found.</p>
          {!submitted ? (
            <div className="mt-3 flex gap-2">
              <input
                value={name}
                onChange={(e) => setNameState(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
              />
              <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">Submit</button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-300">You ranked #{submitted.rank} globally.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
