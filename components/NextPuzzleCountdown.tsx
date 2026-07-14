"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional client-only init (localStorage reads / daily-puzzle generation on mount) that must run post-hydration; a lazy useState initializer would run on the server and cause hydration mismatches */

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

// Counts down to the next UTC midnight, which is when every game's
// daily seed rolls over (dayIndex() uses UTC day-of-year). Re-anchoring
// on local midnight would make the countdown lie to players in eastern
// time zones whose puzzle changed hours before the clock hit 0.
function msUntilMidnightUTC(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  return next - now.getTime();
}

// Digital-clock form ("7:04:09" / "12:33"): locale-neutral, so no English
// unit letters ("3h 07m") leak into the 8 translated labels this value is
// interpolated into — and the output changes every tick, so the 1s
// interval never paints an identical frame.
function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function NextPuzzleCountdown() {
  const { t } = useLocale();
  // Hydration-safe initial state: render nothing until the effect
  // computes a real value on the client. Without this guard, the
  // server-rendered countdown text would always differ from the first
  // client paint (different clock) and trip the same hydration mismatch
  // class of bug we just fixed for locale strings.
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    setMs(msUntilMidnightUTC());
    const id = window.setInterval(() => setMs(msUntilMidnightUTC()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
      <span aria-hidden="true">⏳</span>
      <span className="tabular-nums">
        {ms === null ? "--:--" : t("home_next_puzzle_in", { time: fmt(ms) })}
      </span>
    </div>
  );
}
