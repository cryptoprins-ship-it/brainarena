"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { medalCount, loadStats } from "@/lib/achievements";
import { useLocale } from "@/lib/i18n";
import { getHowToPlay } from "@/lib/howToPlay";
import { localizedHref } from "@/lib/seo/hreflang";
import type { GameKey } from "@/lib/scores";

// Nav order for the game-link strip. Labels + hrefs come from
// lib/howToPlay.ts (translated in all 8 locales) so the strip
// re-localises when the language switches — keep this list purely the
// ordering.
const GAME_ORDER: GameKey[] = [
  "wordle", "boggle", "sudoku", "typing", "tiledrop", "colormatch",
  "letterstack", "vlakken", "verbind", "zonmaan", "kronen",
  "minesweeper", "connections",
];

export default function NavBar() {
  const { locale, t } = useLocale();
  const howTo = getHowToPlay(locale);
  const [medals, setMedals] = useState(0);
  useEffect(() => { setMedals(medalCount(loadStats())); }, []);

  // Mobile-aware layout: Logo + LanguageSwitcher stay on the top row
  // (justify-between gives logo left, switcher right). The big game-link
  // strip flips to a horizontally-scrollable row beneath on small screens
  // and inlines into the same row on md+ via `order` / `w-full` switches.
  return (
    <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href={localizedHref(locale, "/")} className="text-lg font-bold tracking-tight">
          <span className="text-white">Brain</span>
          <span className="text-indigo-400">Arena</span>
        </Link>
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 flex flex-wrap items-center justify-center gap-1 text-sm">
          {GAME_ORDER.map((g) => (
            <Link key={g} href={localizedHref(locale, howTo[g].href)} className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">
              {howTo[g].label}
            </Link>
          ))}
          <Link href="/leaderboard" className="rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]">{t("nav_leaderboard")}</Link>
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-[#1a1a1a]"
          >
            🏆 {t("nav_achievements")}
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
