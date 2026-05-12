"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { pickText } from "@/lib/typingTexts";
import { getName, setName, submitScore } from "@/lib/scores";
import { dayIndex } from "@/lib/dailyWord";
import { MAX_LEADERBOARD_ATTEMPTS, useDailyAttempts } from "@/lib/dailyLock";
import StreakBanner from "@/components/StreakBanner";
import EndScreenAddon from "@/components/EndScreenAddon";
import HowToPlay from "@/components/HowToPlay";

const DURATION = 60;

export default function TypingPage() {
  const { locale } = useLocale();
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [time, setTime] = useState(DURATION);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [submitted, setSubmitted] = useState<{ rank: number } | null>(null);
  const [name, setNameState] = useState("");
  const [eligibleToSubmit, setEligibleToSubmit] = useState(false);
  const recordedRef = useRef(false);
  const todayIdx = useMemo(() => dayIndex(), []);
  // Typing has no daily seed but we cap per locale — texts differ per language.
  const { attempts: dailyAttempts, record } = useDailyAttempts("typing", todayIdx, locale);

  const reset = useCallback(() => {
    setText(pickText(locale));
    setTyped("");
    setTime(DURATION);
    setDone(false);
    setSubmitted(null);
    setNameState(getName());
    startedAt.current = null;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [locale]);

  useEffect(() => { reset(); }, [reset]);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (!startedAt.current) return;
      const remaining = DURATION - Math.floor((Date.now() - startedAt.current) / 1000);
      if (remaining <= 0) { setTime(0); setDone(true); return; }
      setTime(remaining);
    }, 250);
    return () => window.clearInterval(id);
  }, [done]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (done) return;
    if (!startedAt.current) startedAt.current = Date.now();
    const v = e.target.value;
    setTyped(v.slice(0, text.length));
    if (v.length >= text.length) setDone(true);
  }, [done, text.length]);

  const stats = useMemo(() => {
    const elapsedSec = startedAt.current ? Math.min(DURATION, (Date.now() - startedAt.current) / 1000) : 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    const wpm = elapsedSec > 0 ? Math.round((correct / 5) / (elapsedSec / 60)) : 0;
    return { accuracy, wpm, correct, elapsed: Math.round(elapsedSec) };
  }, [text, typed]);

  // Recompute live stats every second.
  const [, force] = useState(0);
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => force((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, [done]);

  // Submit on done, gated by the 3-attempt daily cap (per locale).
  useEffect(() => {
    if (!done) { recordedRef.current = false; return; }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const { shouldSubmit } = record();
    setEligibleToSubmit(shouldSubmit);
    if (shouldSubmit && !submitted) {
      submitScore({
        game: "typing",
        name: getName() || "Anonymous",
        score: stats.wpm,
        time: stats.elapsed,
        language: locale,
        meta: { accuracy: stats.accuracy },
      }).then((r) => r && setSubmitted(r));
    }
  }, [done, locale, record, stats.accuracy, stats.elapsed, stats.wpm, submitted]);

  const saveName = () => {
    setName(name);
    if (done && eligibleToSubmit && !submitted) {
      submitScore({
        game: "typing",
        name: name || "Anonymous",
        score: stats.wpm,
        time: stats.elapsed,
        language: locale,
        meta: { accuracy: stats.accuracy },
      }).then((r) => r && setSubmitted(r));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {/* Typing requires a physical keyboard. Mobile gets a short notice
          instead of the playable UI; the route stays accessible (SEO,
          deep links, locale switcher) but is unplayable. */}
      <div className="md:hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
        <h1 className="text-xl font-black">Typing Speed</h1>
        <p className="mt-2 text-amber-100">
          This game needs a physical keyboard. Open BrainArena on a laptop
          or desktop to play.
        </p>
      </div>

      <div className="hidden md:block">
      <StreakBanner />
      <HowToPlay game="typing" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Typing Speed</h1>
          <p className="text-xs text-gray-400">
            {locale.toUpperCase()} · {DURATION}s test ·{" "}
            <span className={dailyAttempts >= MAX_LEADERBOARD_ATTEMPTS ? "text-amber-300" : ""}>
              {Math.min(dailyAttempts + (done ? 0 : 1), MAX_LEADERBOARD_ATTEMPTS)}/{MAX_LEADERBOARD_ATTEMPTS} ranked
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-mono">
          <span className="rounded-md bg-[#1a1a1a] px-3 py-1">⏱ {time}s</span>
          <span className="rounded-md bg-indigo-500/20 px-3 py-1 text-indigo-200">★ {stats.wpm} WPM</span>
          <span className="rounded-md bg-emerald-500/20 px-3 py-1 text-emerald-200">{stats.accuracy}%</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-lg leading-relaxed font-mono tracking-tight" onClick={() => inputRef.current?.focus()}>
        {text.split("").map((ch, i) => {
          const t = typed[i];
          const cls =
            i < typed.length
              ? t === ch
                ? "text-white"
                : "text-red-400 underline decoration-red-500"
              : i === typed.length
                ? "text-white bg-indigo-500/40 rounded-sm"
                : "text-gray-500";
          return <span key={i} className={cls}>{ch}</span>;
        })}
      </div>

      <input
        ref={inputRef}
        autoFocus
        value={typed}
        onChange={onChange}
        disabled={done}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="mt-3 w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-base font-mono"
        placeholder="Click here and start typing…"
      />

      <button onClick={reset} className="mt-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 text-sm">
        Restart
      </button>

      {done ? (
        <EndScreenAddon
          game="typing"
          score={stats.wpm}
          time={stats.elapsed}
          rank={submitted?.rank}
          meta={{ accuracy: stats.accuracy }}
        />
      ) : null}

      {done ? (
        <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-black">Result</h2>
          <p className="mt-1 text-sm text-gray-300">
            <span className="font-bold text-indigo-300">{stats.wpm} WPM</span> · {stats.accuracy}% accuracy · {stats.correct} correct chars
          </p>
          {!submitted && eligibleToSubmit ? (
            <div className="mt-3 flex gap-2">
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
            <p className="mt-2 text-sm text-emerald-300">Ranked #{submitted.rank} globally.</p>
          ) : null}
          {!eligibleToSubmit && !submitted ? (
            <p className="mt-3 text-xs text-amber-300">
              Practice play — you&apos;ve used your {MAX_LEADERBOARD_ATTEMPTS} ranked attempts today. Tomorrow resets the counter.
            </p>
          ) : null}
        </div>
      ) : null}
      </div>
    </div>
  );
}
