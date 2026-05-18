"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

// Shared "leave this game" affordance for game control bars.
// Rendered alongside undo / hint / reset / new-game so a player can
// exit mid-play without going through the browser back button or
// the nav bar.
export default function EndGameLink() {
  const { t } = useLocale();
  return (
    <Link
      href="/"
      className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm hover:border-rose-400 hover:text-rose-200"
    >
      {t("end_game_now")}
    </Link>
  );
}
