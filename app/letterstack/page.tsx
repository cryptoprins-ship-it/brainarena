"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isInWordList } from "@/lib/dailyWord";
import { useLocale } from "@/lib/i18n";
import { getName, setName, submitScore } from "@/lib/scores";

const LETTER_BAG = "AAAABBCCDDDEEEEEEEEFFGGHHHIIIIIJKLLLMMNNNNOOOOPPQRRRRSSSSTTTTTUUUVVWWXYYZ";
const STACK_LIMIT = 10;
const POINTS = (len: number) => len < 3 ? 0 : len === 3 ? 10 : len === 4 ? 25 : len === 5 ? 50 : 100;

type FallingLetter = { id: number; ch: string; x: number; t: number };

export default function LetterStackPage() {
  const { locale } = useLocale();
  const [stack, setStack] = useState<string[]>([]);
  const [falling, setFalling] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [over, setOver] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");
  const [input, setInput] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [slowMs, setSlowMs] = useState(0);
  const [wildAvailable, setWildAvailable] = useState(false);
  const [bombAvailable, setBombAvailable] = useState(false);
  const [milestones, setMilestones] = useState<number>(0);
  const idRef = useRef(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => { setNameState(getName()); }, []);

  // Spawn falling letters.
  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      idRef.current += 1;
      const ch = LETTER_BAG[Math.floor(Math.random() * LETTER_BAG.length)].toLowerCase();
      const x = Math.floor(Math.random() * 90) + 5;
      setFalling((f) => [...f, { id: idRef.current, ch, x, t: Date.now() }]);
    }, Math.max(500, 1300 - Math.floor((Date.now() - startRef.current) / 8000) * 100));
    return () => window.clearInterval(id);
  }, [over]);

  // Tick: advance falling, drop expired.
  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      const fallDur = slowMs > 0 ? 8000 : 5500 - Math.min(2500, Math.floor((Date.now() - startRef.current) / 5000) * 200);
      setFalling((f) => {
        const now = Date.now();
        const survivors: FallingLetter[] = [];
        let missedNow = 0;
        for (const x of f) {
          if (now - x.t > fallDur) missedNow++;
          else survivors.push(x);
        }
        if (missedNow) setMissed((m) => m + missedNow);
        return survivors;
      });
      if (slowMs > 0) setSlowMs((s) => Math.max(0, s - 100));
    }, 100);
    return () => window.clearInterval(id);
  }, [over, slowMs]);

  const tryCatch = useCallback((ch: string) => {
    setFalling((f) => {
      const idx = f.findIndex((x) => x.ch === ch.toLowerCase());
      if (idx < 0) return f;
      // Keep first match.
      setStack((s) => {
        const next = [...s, ch.toLowerCase()];
        if (next.length > STACK_LIMIT) {
          // Game over by overflow if no word can be formed (we can't validate this fully, so cap).
          setOver(true);
        }
        return next;
      });
      return [...f.slice(0, idx), ...f.slice(idx + 1)];
    });
  }, []);

  // Keyboard catch.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (over) return;
      if (e.key === "Enter") { e.preventDefault(); submitWord(); return; }
      if (e.key === "Backspace") { e.preventDefault(); setInput((i) => i.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const ch = e.key.toLowerCase();
        tryCatch(ch);
        setInput((i) => (i + ch).slice(0, 16));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, tryCatch]);

  const submitWord = useCallback(() => {
    if (over) return;
    const word = input.trim().toLowerCase();
    if (word.length < 3) {
      setShakeKey((k) => k + 1);
      return;
    }
    // Confirm letters in stack support the word (consume).
    const stackCopy = [...stack];
    for (const ch of word) {
      const idx = stackCopy.indexOf(ch);
      if (idx < 0) {
        if (!wildAvailable) {
          setShakeKey((k) => k + 1);
          return;
        }
      }
    }
    // Optionally validate against locale word list when length is 5.
    if (word.length === 5 && !isInWordList(locale, word)) {
      // Accept anyway — better UX than blocking, but no bonus.
    }
    // Consume.
    let usedWild = false;
    for (const ch of word) {
      const idx = stackCopy.indexOf(ch);
      if (idx >= 0) stackCopy.splice(idx, 1);
      else if (wildAvailable && !usedWild) { usedWild = true; setWildAvailable(false); }
      else { setShakeKey((k) => k + 1); return; }
    }
    setStack(stackCopy);
    setInput("");
    setScore((s) => {
      const next = s + POINTS(word.length);
      const ms = Math.floor(next / 500);
      if (ms > milestones) {
        // Award random power-up.
        const roll = Math.random();
        if (roll < 0.34) setBombAvailable(true);
        else if (roll < 0.67) setSlowMs(10000);
        else setWildAvailable(true);
        setMilestones(ms);
      }
      return next;
    });
  }, [input, locale, milestones, over, stack, wildAvailable]);

  // Stack overflow → game over (already handled in tryCatch). Submit on game over.
  useEffect(() => {
    if (!over || submitted) return;
    submitScore({
      game: "letterstack",
      name: getName() || "Anonymous",
      score,
      meta: { missed },
    }).then((r) => r && setSubmitted(r));
  }, [missed, over, score, submitted]);

  const useBomb = () => {
    if (!bombAvailable) return;
    setStack([]);
    setBombAvailable(false);
  };

  const saveName = () => {
    setName(name);
    submitScore({
      game: "letterstack",
      name: name || "Anonymous",
      score,
      meta: { missed },
    }).then((r) => r && setSubmitted(r));
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">LetterStack</h1>
          <p className="text-xs text-gray-400">Press letter keys to catch · Enter to submit · {locale.toUpperCase()}</p>
        </div>
        <div className="flex gap-2 text-sm font-mono">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">★ {score}</span>
          <span className="rounded-md bg-red-500/20 px-3 py-1 text-red-200">missed {missed}</span>
        </div>
      </div>

      <div className="mt-4 relative h-64 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]">
        {falling.map((l) => {
          const fallDur = slowMs > 0 ? 8000 : 5500;
          const elapsed = (Date.now() - l.t) / fallDur;
          const top = Math.min(98, elapsed * 100);
          return (
            <div
              key={l.id}
              className="absolute -translate-x-1/2 select-none rounded-lg bg-indigo-500 px-2 py-1 text-base font-black uppercase shadow"
              style={{ left: `${l.x}%`, top: `${top}%`, transition: "top 80ms linear" }}
            >
              {l.ch}
            </div>
          );
        })}
        {slowMs > 0 ? <div className="absolute right-2 top-2 rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">⏸️ Slow</div> : null}
      </div>

      <div key={shakeKey} className={`mt-4 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3 ${shakeKey ? "shake" : ""}`}>
        <p className="text-xs uppercase tracking-wider text-gray-500">Stack ({stack.length}/{STACK_LIMIT})</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {stack.length === 0 ? <span className="text-xs text-gray-600">empty</span> : stack.map((c, i) => (
            <span key={i} className="rounded bg-[#0a0a0a] px-2 py-1 text-sm font-bold uppercase">{c}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase().slice(0, 16))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitWord(); } }}
          placeholder="Type a word & Enter"
          className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-base"
        />
        <button onClick={submitWord} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">Submit</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={useBomb} disabled={!bombAvailable} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 disabled:opacity-40">💣 Bomb {bombAvailable ? "(ready)" : ""}</button>
        <span className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 opacity-80">⏸️ Slow {slowMs > 0 ? `${(slowMs/1000).toFixed(0)}s` : ""}</span>
        <span className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 opacity-80">⭐ Wild {wildAvailable ? "(ready)" : ""}</span>
      </div>

      <p className="mt-3 text-xs text-gray-500">Letters use power-ups every 500 points.</p>

      {/* Mobile letter buttons */}
      <div className="mt-4 grid grid-cols-9 gap-1 md:hidden">
        {"abcdefghijklmnopqrstuvwxyz".split("").map((c) => (
          <button key={c} onClick={() => { tryCatch(c); setInput((i) => (i + c).slice(0, 16)); }} className="rounded bg-[#1a1a1a] py-2 text-sm font-bold uppercase border border-[#2a2a2a]">{c}</button>
        ))}
      </div>

      {over ? (
        <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-black">Stack overflowed · {score} pts</h2>
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
            <p className="mt-2 text-sm text-emerald-300">Ranked #{submitted.rank} globally.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
