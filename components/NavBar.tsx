"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { medalCount, loadStats } from "@/lib/achievements";

export default function NavBar() {
  const [medals, setMedals] = useState(0);
  useEffect(() => { setMedals(medalCount(loadStats())); }, []);

  // Mobile-aware layout: Logo + LanguageSwitcher stay on the top row
  // (justify-between gives logo left, switcher right). The big game-link
  // strip flips to a horizontally-scrollable row beneath on small screens
  // and inlines into the same row on md+ via `order` / `w-full` switches.
  return (
    <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-white">Brain</span>
          <span className="text-indigo-400">Arena</span>
        </Link>
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 flex flex-wrap items-center justify-center gap-1 text-sm">
          <Link href="/wordle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Wordle</Link>
          <Link href="/boggle" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Boggle</Link>
          <Link href="/sudoku" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Sudoku</Link>
          <Link href="/typing" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Typing</Link>
          <Link href="/tiledrop" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">TileDrop</Link>
          <Link href="/colormatch" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">ColorMatch</Link>
          <Link href="/letterstack" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">LetterStack</Link>
          <Link href="/vlakken" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Vlakken</Link>
          <Link href="/verbind" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Verbind</Link>
          <Link href="/zonmaan" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Zon &amp; Maan</Link>
          <Link href="/kronen" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Kronen</Link>
          <Link href="/minesweeper" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">Minesweeper</Link>
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
        <div className="order-2 ml-auto md:order-3 md:ml-0">
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
