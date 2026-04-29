"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { medalCount, loadStats } from "@/lib/achievements";

export default function NavBar() {
  const [medals, setMedals] = useState(0);
  useEffect(() => { setMedals(medalCount(loadStats())); }, []);

  return (
    <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-white">Brain</span>
          <span className="text-indigo-400">Arena</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/wordle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Wordle</Link>
          <Link href="/boggle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Boggle</Link>
          <Link href="/sudoku" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Sudoku</Link>
          <Link href="/typing" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Typing</Link>
          <Link href="/tiledrop" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">TileDrop</Link>
          <Link href="/wordbuild" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">WordBuild</Link>
          <Link href="/colormatch" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">ColorMatch</Link>
          <Link href="/cityplanner" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">CityPlanner</Link>
          <Link href="/letterstack" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">LetterStack</Link>
          <Link href="/leaderboard" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Leaderboard</Link>
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]"
          >
            🏆 Achievements
            {medals > 0 ? (
              <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                🥇 {medals}
              </span>
            ) : null}
          </Link>
        </div>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
