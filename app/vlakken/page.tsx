"use client";

import { useEffect, useMemo, useState } from "react";
import HowToPlay from "@/components/HowToPlay";
import StreakBanner from "@/components/StreakBanner";
import { useLocale } from "@/lib/i18n";

type Difficulty = "easy" | "medium" | "hard";
const SIZE_FOR: Record<Difficulty, number> = { easy: 6, medium: 7, hard: 9 };
const BEST_KEY = (d: Difficulty) => `brainarena-vlakken-best-${d}`;

export default function VlakkenPage() {
  const { t, locale } = useLocale();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);

  const size = SIZE_FOR[difficulty];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(BEST_KEY(difficulty));
    setBestSeconds(raw ? Number(raw) : null);
  }, [difficulty]);

  const placeholderCells = useMemo(() => Array.from({ length: size * size }, (_, i) => i), [size]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <StreakBanner />
      <HowToPlay game="vlakken" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("game_vlakken")}</h1>
          <p className="text-xs text-gray-400">{t("game_vlakken_desc")} · {locale.toUpperCase()}</p>
        </div>
        <DifficultyToggle value={difficulty} onChange={setDifficulty} />
      </div>

      <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Generator coming up next — the playable grid will fill this slot.
      </p>

      <div
        className="mx-auto mt-5 grid gap-px rounded-md border border-[#3a3a3c] bg-[#3a3a3c] p-px"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {placeholderCells.map((i) => (
          <div
            key={i}
            className="aspect-square bg-[#1a1a1a]"
          />
        ))}
      </div>

      <Controls bestSeconds={bestSeconds} disabled />
    </div>
  );
}

function DifficultyToggle({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const { t } = useLocale();
  const items: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-xs">
      {items.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1.5 capitalize ${value === d ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"}`}
        >
          {t(d)}
        </button>
      ))}
    </div>
  );
}

function Controls({ bestSeconds, disabled }: { bestSeconds: number | null; disabled: boolean }) {
  const { t } = useLocale();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <button disabled={disabled} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold disabled:opacity-40">{t("new_game")}</button>
        <button disabled={disabled} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40">{t("hint")}</button>
        <button disabled={disabled} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40">{t("undo")}</button>
        <button disabled={disabled} className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm disabled:opacity-40">{t("reset")}</button>
      </div>
      <p className="text-xs text-gray-500">
        {t("best_time")}: <span className="font-mono text-gray-300">{bestSeconds ? `${bestSeconds}s` : "—"}</span>
      </p>
    </div>
  );
}
