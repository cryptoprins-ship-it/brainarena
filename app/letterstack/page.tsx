"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isInWordList, dayIndex } from "@/lib/dailyWord";
import { useLocale } from "@/lib/i18n";
import { getName, submitScore } from "@/lib/scores";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import ScoreEndLeaderboard from "@/components/ScoreEndLeaderboard";
import HowToPlay from "@/components/HowToPlay";

const LETTER_BAG = "AAAABBCCDDDEEEEEEEEFFGGHHHIIIIIJKLLLMMNNNNOOOOPPQRRRRSSSSTTTTTUUUVVWWXYYZ";
const STACK_LIMIT = 10;
const POINTS = (len: number) => len < 3 ? 0 : len === 3 ? 10 : len === 4 ? 25 : len === 5 ? 50 : 100;

type Difficulty = "easy" | "medium" | "hard";

// Difficulty multipliers tune both the spawn cadence and the per-letter
// fall duration. Easy gives more reaction time across both axes; hard
// compresses both so the player has to chain words faster to keep up.
const SPAWN_MULT: Record<Difficulty, number> = { easy: 1.5, medium: 1.0, hard: 0.65 };
const FALL_MULT: Record<Difficulty, number> = { easy: 1.5, medium: 1.0, hard: 0.65 };

const DIFFICULTY_KEY = "brainarena-letterstack-difficulty";

type FallingLetter = { id: number; ch: string; x: number; t: number };

export default function LetterStackPage() {
  const { locale, t } = useLocale();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [stack, setStack] = useState<string[]>([]);
  const [falling, setFalling] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [over, setOver] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [input, setInput] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [slowMs, setSlowMs] = useState(0);
  const [wildAvailable, setWildAvailable] = useState(false);
  const [bombAvailable, setBombAvailable] = useState(false);
  const [milestones, setMilestones] = useState<number>(0);
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const idRef = useRef(0);
  const startRef = useRef<number>(Date.now());
  const todayIdx = useMemo(() => dayIndex(), []);
  const { attempts: dailyAttempts, record } = useDailyAttempts("letterstack", todayIdx, `${locale}-${difficulty}`);

  // Restore persisted difficulty preference on mount — without this a
  // hard-mode player would be silently downgraded to medium every new
  // tab. The localStorage write happens in the difficulty-change effect
  // below.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(DIFFICULTY_KEY);
    if (raw === "easy" || raw === "medium" || raw === "hard") {
      setDifficulty(raw);
    }
  }, []);

  // Persist + reset on difficulty change. A switch mid-game wipes the
  // current attempt (state, stack, falling letters, score) so the timer
  // and rate ramps start fresh — otherwise an "easy" prefix would
  // contaminate a "hard" attempt's score.
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch {}
    }
    setStack([]);
    setFalling([]);
    setScore(0);
    setMissed(0);
    setOver(false);
    setInput("");
    setSlowMs(0);
    setWildAvailable(false);
    setBombAvailable(false);
    setMilestones(0);
    setSubmitted(null);
    setEligibleToSubmit(false);
    recordedRef.current = false;
    startRef.current = Date.now();
  }, [difficulty]);


  // Spawn falling letters.
  useEffect(() => {
    if (over) return;
    const spawnMult = SPAWN_MULT[difficulty];
    const baseSpawn = Math.max(500, 1300 - Math.floor((Date.now() - startRef.current) / 8000) * 100);
    const id = window.setInterval(() => {
      idRef.current += 1;
      const ch = LETTER_BAG[Math.floor(Math.random() * LETTER_BAG.length)].toLowerCase();
      const x = Math.floor(Math.random() * 90) + 5;
      setFalling((f) => [...f, { id: idRef.current, ch, x, t: Date.now() }]);
    }, Math.max(300, Math.round(baseSpawn * spawnMult)));
    return () => window.clearInterval(id);
  }, [over, difficulty]);

  // Tick: advance falling, drop expired.
  useEffect(() => {
    if (over) return;
    const fallMult = FALL_MULT[difficulty];
    const id = window.setInterval(() => {
      const baseFall = slowMs > 0 ? 8000 : 5500 - Math.min(2500, Math.floor((Date.now() - startRef.current) / 5000) * 200);
      const fallDur = Math.max(1200, Math.round(baseFall * fallMult));
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
  }, [over, slowMs, difficulty]);

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

  // Stack overflow → game over (already handled in tryCatch). Submit on game
  // over, gated by the 3-attempt daily cap (per locale).
  useEffect(() => {
    if (!over) { recordedRef.current = false; return; }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "letterstack",
        name: getName() || "Anonymous",
        score,
        language: locale,
        meta: { missed, difficulty },
      }).then((r) => r && setSubmitted(r));
    }
  }, [difficulty, locale, missed, over, record, score, submitted]);

  const useBomb = () => {
    if (!bombAvailable) return;
    setStack([]);
    setBombAvailable(false);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="letterstack" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">LetterStack</h1>
          <p className="text-xs text-gray-400">
            {t("ls_controls")} · {locale.toUpperCase()} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (over ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} {t("ranked_label")}
            </span>
          </p>
        </div>
        <div className="flex gap-2 text-sm font-mono">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">★ {score}</span>
          <span className="rounded-md bg-red-500/20 px-3 py-1 text-red-200">{t("ls_missed", { n: missed })}</span>
        </div>
      </div>

      <div className="mt-3 inline-flex rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-xs">
        {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={
              "rounded px-3 py-1 capitalize " +
              (difficulty === d ? "bg-indigo-600 font-bold text-white" : "text-gray-400 hover:text-white")
            }
          >
            {t(d)}
          </button>
        ))}
      </div>

      <div className="mt-3 relative h-64 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]">
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
        {slowMs > 0 ? <div className="absolute right-2 top-2 rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">⏸️ {t("ls_slow")}</div> : null}
      </div>

      <div key={shakeKey} className={`mt-4 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3 ${shakeKey ? "shake" : ""}`}>
        <p className="text-xs uppercase tracking-wider text-gray-500">{t("ls_stack", { n: stack.length, max: STACK_LIMIT })}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {stack.length === 0 ? <span className="text-xs text-gray-600">{t("label_empty")}</span> : stack.map((c, i) => (
            <span key={i} className="rounded bg-[#0a0a0a] px-2 py-1 text-sm font-bold uppercase">{c}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase().slice(0, 16))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitWord(); } }}
          placeholder={t("ls_input_placeholder")}
          className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-base"
        />
        <button onClick={submitWord} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold">{t("submit")}</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={useBomb} disabled={!bombAvailable} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 disabled:opacity-40">💣 {t("ls_bomb")} {bombAvailable ? t("ls_ready") : ""}</button>
        <span className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 opacity-80">⏸️ {t("ls_slow")} {slowMs > 0 ? `${(slowMs/1000).toFixed(0)}s` : ""}</span>
        <span className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 opacity-80">⭐ {t("ls_wild")} {wildAvailable ? t("ls_ready") : ""}</span>
      </div>

      <p className="mt-3 text-xs text-gray-500">{t("ls_powerup_hint")}</p>

      {/* Mobile letter buttons */}
      <div className="mt-4 grid grid-cols-9 gap-1 md:hidden">
        {"abcdefghijklmnopqrstuvwxyz".split("").map((c) => (
          <button key={c} onClick={() => { tryCatch(c); setInput((i) => (i + c).slice(0, 16)); }} className="rounded bg-[#1a1a1a] py-2 text-sm font-bold uppercase border border-[#2a2a2a]">{c}</button>
        ))}
      </div>

      {over ? (
        <>
          <ScoreEndLeaderboard
            game="letterstack"
            playerName={getName()}
            playerScore={score}
            submittedRank={submitted?.rank}
          />
          <EndScreenAddon
            game="letterstack"
            score={score}
            rank={submitted?.rank}
            locale={locale}
            meta={{ missed }}
          />
        </>
      ) : null}

      {over ? (
        <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-black">{t("ls_game_over", { score })}</h2>
          {submitted ? (
            <p className="mt-2 text-sm text-emerald-300">
              <span className="font-bold">{getName() || "Anonymous"}</span> · {t("you_ranked", { rank: submitted.rank })}
            </p>
          ) : null}
          {!eligibleToSubmit && !submitted ? (
            <p className="mt-3 text-xs text-amber-300">
              {t("practice_play_used", { max: MAX_LEADERBOARD_ATTEMPTS })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
