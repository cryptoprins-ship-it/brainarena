"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dayIndex } from "@/lib/dailyWord";
import { getName, setName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";

type Category = "animals" | "colors" | "tools" | "food";

const CATEGORIES: Record<Category, string[]> = {
  animals: [
    "cat","dog","cow","fox","bee","owl","ant","bat","pig","rat","ape","elk","emu","yak","koi",
    "lion","bear","wolf","frog","duck","fish","crab","goat","deer","hawk","seal","swan","mole","mule","puma",
    "tiger","eagle","mouse","horse","sheep","whale","zebra","camel","koala","panda","raven","snake","squid","sloth","otter",
    "rabbit","monkey","badger","beaver","rooster","ostrich","penguin","leopard",
  ],
  colors: [
    "red","tan","jet","sky","ash","ink","ice","tea",
    "blue","cyan","gold","grey","navy","pink","plum","ruby","rose","teal","jade","mint","coal","sand",
    "amber","azure","beige","brown","coral","green","ivory","khaki","lemon","ochre","olive","peach","white","black",
    "violet","yellow","silver","maroon","indigo","salmon","crimson","scarlet","mustard","fuchsia","emerald","magenta","lavender","turquoise",
  ],
  tools: [
    "saw","axe","awl","jig","hex","nut","peg","pin","key",
    "drill","clamp","brush","plane","wedge","level","screw","gauge","pliers","ruler","spade",
    "anvil","auger","chisel","gimlet","hammer","hatchet","mallet","reamer","sander","shovel","sickle","wrench","mitre","spanner",
    "scraper","stapler","cutter","grinder","tweezer","calipers",
  ],
  food: [
    "egg","jam","pie","tea","fig","nut","oat","ham","rye","yam",
    "rice","milk","beef","fish","mint","corn","kale","lime","plum","pear","peas",
    "apple","bread","bacon","candy","cocoa","grape","honey","lemon","mango","melon","onion","pasta","peach","pizza","salad","sugar","tacos","toast","wafer","yogurt",
    "biscuit","cabbage","carrot","cheese","chicken","oatmeal","pancake","pumpkin","sausage","spinach","raspberry","blueberry","watermelon",
  ],
};

const CATEGORY_LABEL: Record<Category, string> = {
  animals: "Animals",
  colors: "Colors",
  tools: "Tools",
  food: "Food",
};

const ROUNDS = 10;

function pointsFor(len: number): number {
  if (len < 3) return 0;
  if (len <= 4) return 5;
  if (len === 5) return 10;
  if (len === 6) return 20;
  return 35;
}

type Block =
  | { kind: "foundation" | "wall" | "window" | "roof" | "chimney"; word: string };

function blockKindFor(len: number): Block["kind"] | null {
  if (len === 3) return "foundation";
  if (len === 4) return "wall";
  if (len === 5) return "window";
  if (len === 6) return "roof";
  if (len >= 7) return "chimney";
  return null;
}

function dailyCategory(): Category {
  const order: Category[] = ["animals", "colors", "tools", "food"];
  return order[dayIndex() % order.length];
}

export default function WordBuildPage() {
  const category = useMemo(dailyCategory, []);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [used, setUsed] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");

  useEffect(() => { setNameState(getName()); }, []);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (done) return;
    const word = input.trim().toLowerCase();
    if (!word) return;
    if (word.length < 3) { setError("Words must be 3+ letters"); return; }
    if (used.includes(word)) { setError("Already used that one"); return; }
    if (!CATEGORIES[category].includes(word)) { setError(`Not a "${CATEGORY_LABEL[category]}" word`); return; }
    setError(null);
    setUsed((u) => [word, ...u]);
    const kind = blockKindFor(word.length);
    if (kind) setBlocks((b) => [...b, { kind, word }]);
    setScore((s) => s + pointsFor(word.length));
    setInput("");
    const next = round + 1;
    setRound(next);
    if (next >= ROUNDS) setDone(true);
  }, [category, done, input, round, used]);

  // Submit on done.
  useEffect(() => {
    if (!done || submitted) return;
    submitScore({
      game: "wordbuild",
      name: getName() || "Anonymous",
      score,
      meta: { category, blocks },
    }).then((r) => r && setSubmitted(r));
  }, [blocks, category, done, score, submitted]);

  const saveName = () => {
    setName(name);
    submitScore({
      game: "wordbuild",
      name: name || "Anonymous",
      score,
      meta: { category, blocks },
    }).then((r) => r && setSubmitted(r));
  };

  const share = async () => {
    const text = `I built a house in WordBuild — ${score} points, ${blocks.length} blocks. brainarena.fun`;
    try { await navigator.clipboard.writeText(text); alert("Copied to clipboard!"); } catch { prompt("Copy:", text); }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <StreakBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">WordBuild</h1>
          <p className="text-xs text-gray-400">Daily category: <span className="text-indigo-300">{CATEGORY_LABEL[category]}</span> · Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</p>
        </div>
        <span className="rounded-md bg-indigo-500/20 px-3 py-1 text-sm font-bold text-indigo-200">★ {score}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <HouseSvg blocks={blocks} />
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <form onSubmit={onSubmit}>
            <label className="text-xs uppercase tracking-wider text-gray-500">Type a {CATEGORY_LABEL[category]} word</label>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={done}
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-base"
              placeholder="e.g. eagle"
            />
            {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
            <button type="submit" disabled={done} className="mt-3 w-full rounded-lg bg-indigo-600 py-2 font-bold disabled:opacity-50">Add block</button>
          </form>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Building blocks</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-3 text-sm">
              {used.map((w) => (
                <li key={w} className="flex justify-between"><span>{w}</span><span className="text-gray-500">+{pointsFor(w.length)}</span></li>
              ))}
              {used.length === 0 ? <li className="text-gray-600">No words yet.</li> : null}
            </ul>
          </div>

          <a
            href="https://renisual.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-xs text-gray-500 hover:text-indigo-300"
          >
            Like building? Try renisual.com →
          </a>
        </div>
      </div>

      {done ? (
        <EndScreenAddon
          game="wordbuild"
          score={score}
          rank={submitted?.rank}
          meta={{ category, blocks: blocks.length }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <h2 className="text-xl font-black">House built! · {score} pts</h2>
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

      <p className="mt-6 text-center text-[11px] text-gray-600">
        Powered by{" "}
        <a className="hover:text-indigo-300" href="https://renisual.com" target="_blank" rel="noopener noreferrer">Renisual</a>
      </p>
    </div>
  );
}

function HouseSvg({ blocks }: { blocks: Block[] }) {
  const foundations = blocks.filter((b) => b.kind === "foundation").length;
  const walls = blocks.filter((b) => b.kind === "wall").length;
  const windows = blocks.filter((b) => b.kind === "window").length;
  const roofs = blocks.filter((b) => b.kind === "roof").length;
  const chimneys = blocks.filter((b) => b.kind === "chimney").length;

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-3">
      <svg viewBox="0 0 200 220" className="mx-auto h-72 w-full max-w-xs">
        {/* Ground */}
        <rect x="0" y="200" width="200" height="20" fill="#1f2937" />
        {/* Foundation bricks */}
        {Array.from({ length: foundations }).map((_, i) => (
          <rect key={`f${i}`} x={20 + (i % 4) * 40} y={180} width="36" height="20" fill="#7c2d12" stroke="#000" />
        ))}
        {/* Walls */}
        {Array.from({ length: walls }).map((_, i) => (
          <rect key={`w${i}`} x={30 + (i % 3) * 50} y={120} width="46" height="60" fill="#a3a3a3" stroke="#000" />
        ))}
        {/* Windows */}
        {Array.from({ length: windows }).map((_, i) => (
          <rect key={`win${i}`} x={50 + (i % 3) * 40} y={140} width="22" height="22" fill="#22d3ee" stroke="#0e7490" />
        ))}
        {/* Roof */}
        {roofs > 0 && (
          <polygon
            points="20,120 100,60 180,120"
            fill="#dc2626"
            stroke="#000"
            opacity={Math.min(1, 0.4 + roofs * 0.2)}
          />
        )}
        {/* Chimney */}
        {chimneys > 0 && (
          <rect x={140} y={70} width="16" height={20 + chimneys * 6} fill="#374151" stroke="#000" />
        )}
        {!blocks.length && (
          <text x="100" y="120" textAnchor="middle" fill="#444" fontSize="11">Type a word to start building</text>
        )}
      </svg>
      <p className="text-center text-xs text-gray-500">
        {blocks.length === 0 ? "Empty plot" : `${blocks.length} block${blocks.length === 1 ? "" : "s"} built`}
      </p>
    </div>
  );
}
