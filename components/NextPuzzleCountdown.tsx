"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional client-only init: the countdown reads the clock, which must happen post-hydration; a lazy useState initializer would run on the server and cause a hydration mismatch */

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { formatCountdown, msUntilNextUtcMidnight } from "@/lib/games/wordleState";

// Counts down to the next UTC midnight, which is when every game's
// daily seed rolls over (dayIndex() uses UTC day-of-year). Re-anchoring
// on local midnight would make the countdown lie to players in eastern
// time zones whose puzzle changed hours before the clock hit 0.
// Time math and HH:MM:SS formatting come from lib/games/wordleState so
// this pill can never drift from the in-game wordle countdown.
export default function NextPuzzleCountdown() {
  const { t } = useLocale();
  // Hydration-safe initial state: render the placeholder until the effect
  // computes a real value on the client. Without this guard, the
  // server-rendered countdown text would always differ from the first
  // client paint (different clock) and trip the same hydration mismatch
  // class of bug we just fixed for locale strings.
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    setMs(msUntilNextUtcMidnight());
    const id = window.setInterval(() => setMs(msUntilNextUtcMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
      <span aria-hidden="true">⏳</span>
      <span className="tabular-nums">
        {ms === null
          ? "--:--:--"
          : t("home_next_puzzle_in", { time: formatCountdown(ms) })}
      </span>
    </div>
  );
}
