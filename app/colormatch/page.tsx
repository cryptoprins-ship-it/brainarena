"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RAL } from "@/lib/ralColors";
import { dayIndex } from "@/lib/dailyWord";
import { getName, setName, submitScore } from "@/lib/scores";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";

const ROUNDS = 10;
const ROUND_MS = 5000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Question = { answerIdx: number; choices: number[] };

function buildQuestions(seed: number): Question[] {
  const rng = mulberry32(seed);
  const indexes = [...RAL.keys()];
  // Shuffle indexes.
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  const picked = indexes.slice(0, ROUNDS);
  return picked.map((answerIdx) => {
    const distractors = indexes.filter((i) => i !== answerIdx);
    for (let i = distractors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
    }
    const three = distractors.slice(0, 3);
    const choices = [answerIdx, ...three];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { answerIdx, choices };
  });
}

function ratingFor(correct: number): string {
  if (correct === 10) return "RAL Master!";
  if (correct >= 7) return "Professional";
  if (correct >= 4) return "Painter";
  return "Beginner";
}

export default function ColorMatchPage() {
  const todayIdx = useMemo(() => dayIndex(), []);
  const questions = useMemo(() => buildQuestions(todayIdx), [todayIdx]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState<{ pickedIdx: number; remaining: number } | null>(null);
  const [remaining, setRemaining] = useState(ROUND_MS);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const { attempts: dailyAttempts, record } = useDailyAttempts("colormatch", todayIdx);

  useEffect(() => { setNameState(getName()); }, []);

  // Timer per round.
  useEffect(() => {
    if (done || answered) return;
    startedAt.current = Date.now();
    setRemaining(ROUND_MS);
    const id = window.setInterval(() => {
      const left = ROUND_MS - (Date.now() - (startedAt.current ?? Date.now()));
      if (left <= 0) {
        setRemaining(0);
        // Time out → wrong answer.
        setAnswered({ pickedIdx: -1, remaining: 0 });
        window.setTimeout(() => advance(), 700);
        window.clearInterval(id);
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, answered, done]);

  const advance = useCallback(() => {
    setAnswered(null);
    setRound((r) => {
      const next = r + 1;
      if (next >= ROUNDS) setDone(true);
      return next;
    });
  }, []);

  const pick = (choiceIdx: number) => {
    if (answered) return;
    const q = questions[round];
    const left = ROUND_MS - (Date.now() - (startedAt.current ?? Date.now()));
    setAnswered({ pickedIdx: choiceIdx, remaining: left });
    if (choiceIdx === q.answerIdx) {
      const speedBonus = Math.max(0, Math.floor((left / ROUND_MS) * 50));
      setScore((s) => s + 100 + speedBonus);
      setCorrect((c) => c + 1);
    }
    window.setTimeout(advance, 800);
  };

  // Submit on done, gated by the daily attempt cap.
  useEffect(() => {
    if (!done) { recordedRef.current = false; return; }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "colormatch",
        name: getName() || "Anonymous",
        score,
        meta: { correct, rating: ratingFor(correct) },
      }).then((r) => r && setSubmitted(r));
    }
  }, [correct, done, record, score, submitted]);

  const saveName = () => {
    setName(name);
    if (!eligibleToSubmit || submitted) return;
    submitScore({
      game: "colormatch",
      name: name || "Anonymous",
      score,
      meta: { correct, rating: ratingFor(correct) },
    }).then((r) => r && setSubmitted(r));
  };

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <StreakBanner />
        <h1 className="text-3xl font-black">Final score: {score}</h1>
        <p className="mt-1 text-sm text-gray-300">{correct}/{ROUNDS} correct · <span className="text-indigo-300">{ratingFor(correct)}</span></p>

        <div className="mt-4 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          {!submitted && eligibleToSubmit ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setNameState(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
              />
              <button onClick={saveName} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold">Submit</button>
            </div>
          ) : null}
          {submitted ? (
            <p className="text-sm text-emerald-300">Ranked #{submitted.rank} globally.</p>
          ) : null}
          {!submitted && !eligibleToSubmit ? (
            <p className="text-xs text-amber-300">
              Practice play — you&apos;ve used your {MAX_LEADERBOARD_ATTEMPTS} ranked attempts today. Tomorrow resets the counter.
            </p>
          ) : null}
        </div>

        <EndScreenAddon
          game="colormatch"
          score={score}
          rank={submitted?.rank}
          meta={{ correct, rating: ratingFor(correct) }}
        />

        <a
          href="https://renisual.com/render"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm hover:border-indigo-400"
        >
          <p className="font-bold text-indigo-200">Test your color knowledge — used by facade professionals.</p>
          <p className="mt-1 text-xs text-gray-400">Visualise any RAL color on a real building → renisual.com/render</p>
        </a>

        <p className="mt-4 text-center text-[11px] text-gray-600">
          Powered by{" "}
          <a className="hover:text-indigo-300" href="https://renisual.com" target="_blank" rel="noopener noreferrer">Renisual</a>
        </p>
      </div>
    );
  }

  const q = questions[round];
  if (!q) return null;
  const target = RAL[q.answerIdx];

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <StreakBanner />
      <HowToPlay game="colormatch" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">ColorMatch</h1>
          <p className="text-xs text-gray-400">
            Round {round + 1}/{ROUNDS} · ★ {score} ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + 1, MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <div className="text-sm font-mono">⏱ {(remaining / 1000).toFixed(1)}s</div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
        <div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${(remaining / ROUND_MS) * 100}%` }} />
      </div>

      <div
        className="mt-5 aspect-square w-full rounded-2xl border border-[#2a2a2a] shadow-inner"
        style={{ background: target.hex }}
      />

      <p className="mt-3 text-center text-xs uppercase tracking-widest text-gray-500">Which RAL is this?</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {q.choices.map((idx) => {
          const c = RAL[idx];
          const isCorrect = answered && idx === q.answerIdx;
          const isWrongPick = answered && answered.pickedIdx === idx && idx !== q.answerIdx;
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              disabled={!!answered}
              className={`rounded-lg border px-3 py-3 text-left text-sm ${
                isCorrect ? "border-emerald-500 bg-emerald-500/20" :
                isWrongPick ? "border-red-500 bg-red-500/20" :
                "border-[#2a2a2a] bg-[#1a1a1a] hover:border-indigo-400/40"
              }`}
            >
              <div className="font-mono font-bold">{c.code}</div>
              <div className="text-xs text-gray-400">{c.name}</div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] text-gray-600">
        Powered by{" "}
        <a className="hover:text-indigo-300" href="https://renisual.com" target="_blank" rel="noopener noreferrer">Renisual</a>
      </p>
    </div>
  );
}
