"use client";

import { Fragment, useEffect, type ReactNode } from "react";

// Shared end-of-game modal shell. Every game gets the same dialog
// chrome — backdrop + click-outside-to-close, ESC-to-close, the "×"
// affordance in the top-right, the rounded card on a dark inset — so
// the win flow reads the same across Wordle, Minesweeper, Zon & Maan,
// and any new game added later. Per-game body content (stats, share
// buttons, leaderboard previews) is passed in as children so each game
// keeps its own copy for the things that genuinely differ.
//
// status drives the title colour: "win" → emerald, "lose" → rose,
// undefined → neutral. The title itself is supplied by the caller so
// translations stay where they already live (lib/i18n.ts per-game keys).
export default function GameWinModal({
  open,
  onClose,
  title,
  status = "win",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  status?: "win" | "lose";
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleColor = status === "lose" ? "text-rose-300" : "text-emerald-300";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#13141c] p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
        >
          ×
        </button>
        <h2 className={`text-2xl font-black ${titleColor}`}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// dl/dt/dd stats grid that matches the existing Minesweeper / Zon & Maan
// layout. Values render right-aligned in a tabular font so per-game
// numbers visually line up between rows.
export function WinStatsGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
      {items.map((it, i) => (
        <Fragment key={i}>
          <dt className="text-gray-400">{it.label}</dt>
          <dd className="text-right font-mono text-white">{it.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

// Amber pill shown when the just-played game set a new personal best.
export function NewBestBanner({ label }: { label: string }) {
  return (
    <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-sm font-bold text-amber-300">
      ★ {label}
    </p>
  );
}

// Button row inside the modal. Children render in a flex-wrap row so
// short labels grow to equal width and long labels just keep their
// natural size. Each button retains its own colour / variant — the
// shared chrome here is only positioning + spacing.
export function WinActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap gap-2">{children}</div>;
}
