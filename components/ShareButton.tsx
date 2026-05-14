"use client";

import { useCallback, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { GameKey } from "@/lib/scores";
import { shareResult, type SharePayload, type ShareOutcome } from "@/lib/share";

// Single share entry point for every game's end screen. Owns the toast
// feedback so individual games don't each reinvent it. Pass the played
// locale explicitly for per-locale games; otherwise it falls back to the
// active UI locale (the end screen shows immediately after play, so they
// match in practice).
type Props = {
  game: GameKey;
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
  rank?: number;
  locale?: string;
  className?: string;
  label?: string;
};

const TOAST: Partial<Record<ShareOutcome, string>> = {
  copied: "Copied!",
  prompted: "Copy your result from the dialog",
  failed: "Couldn't share — try again",
};

export default function ShareButton({
  game,
  score,
  time,
  meta,
  rank,
  locale,
  className,
  label = "Share",
}: Props) {
  const { locale: uiLocale } = useLocale();
  const [toast, setToast] = useState<string | null>(null);

  const onShare = useCallback(async () => {
    const payload: SharePayload = { score, time, meta, rank, locale: locale ?? uiLocale };
    const outcome = await shareResult(game, payload);
    const msg = TOAST[outcome];
    if (msg) {
      setToast(msg);
      window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 1600);
    }
  }, [game, score, time, meta, rank, locale, uiLocale]);

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        className={
          className ??
          "rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold hover:border-indigo-400/40"
        }
      >
        {label}
      </button>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
