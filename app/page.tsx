"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { livePlayerCount, type GameKey } from "@/lib/scores";
import { listAchievements, loadStats, type Achievement, type Stats } from "@/lib/achievements";
import { useLocale } from "@/lib/i18n";
import { getHowToPlay } from "@/lib/howToPlay";

// Game cards — title + blurb come from lib/howToPlay.ts (already translated
// in 8 locales) at render time. Keep this array purely structural: the
// route, the visual preview, and the gradient accent. Anything user-facing
// goes through useLocale().
const GAMES: {
  href: string;
  game: GameKey;
  preview: React.ReactNode;
  accent: string;
  desktopOnly?: boolean;
}[] = [
  {
    href: "/wordle",
    game: "wordle",
    accent: "from-emerald-500/20 to-emerald-500/0",
    preview: (
      <div className="flex gap-1">
        <div className="h-7 w-7 rounded bg-[#538d4e] text-center text-sm font-bold leading-7">B</div>
        <div className="h-7 w-7 rounded bg-[#b59f3b] text-center text-sm font-bold leading-7">R</div>
        <div className="h-7 w-7 rounded bg-[#3a3a3c] text-center text-sm font-bold leading-7">A</div>
        <div className="h-7 w-7 rounded bg-[#538d4e] text-center text-sm font-bold leading-7">I</div>
        <div className="h-7 w-7 rounded bg-[#3a3a3c] text-center text-sm font-bold leading-7">N</div>
      </div>
    ),
  },
  {
    href: "/boggle",
    game: "boggle",
    accent: "from-amber-500/20 to-amber-500/0",
    preview: (
      <div className="grid grid-cols-4 gap-1">
        {["A","R","E","N","O","B","I","T","P","L","Y","S","M","U","K","D"].map((c, i) => (
          <div key={i} className="h-6 w-6 rounded bg-[#2a2a2a] text-center text-[11px] font-bold leading-6">{c}</div>
        ))}
      </div>
    ),
  },
  {
    href: "/sudoku",
    game: "sudoku",
    accent: "from-sky-500/20 to-sky-500/0",
    preview: (
      <div className="grid grid-cols-3 gap-px bg-[#3a3a3c] p-px text-[10px] leading-5 font-bold">
        {[5,3,1,7,9,4,6,8,2].map((n, i) => (
          <div key={i} className="h-5 w-5 bg-[#1a1a1a] text-center">{n}</div>
        ))}
      </div>
    ),
  },
  {
    href: "/typing",
    game: "typing",
    accent: "from-pink-500/20 to-pink-500/0",
    // Typing requires a physical keyboard — hide the card on mobile so
    // the home grid doesn't tease something the visitor can't comfortably
    // play. The route stays reachable by URL.
    desktopOnly: true,
    preview: (
      <div className="text-2xl font-black tabular-nums">
        72<span className="text-xs font-medium text-gray-400 ml-1">WPM</span>
      </div>
    ),
  },
  {
    href: "/tiledrop",
    game: "tiledrop",
    accent: "from-fuchsia-500/20 to-fuchsia-500/0",
    preview: (
      <div className="grid grid-cols-4 gap-px">
        {[0,1,2,3].flatMap((r) =>
          [0,1,2,3].map((k) => {
            const filled = r === 3 || (r === 2 && (k === 1 || k === 2));
            const colors = ["#22d3ee","#fb7185","#fbbf24","#34d399"];
            return (
              <div
                key={`${r}-${k}`}
                className="h-3 w-3 rounded-sm"
                style={{ background: filled ? colors[r] : "#2a2a2a" }}
              />
            );
          })
        )}
      </div>
    ),
  },
  {
    href: "/colormatch",
    game: "colormatch",
    accent: "from-rose-500/20 to-rose-500/0",
    preview: (
      <div className="flex gap-1">
        <div className="h-7 w-7 rounded" style={{ background: "#642424" }} />
        <div className="h-7 w-7 rounded" style={{ background: "#0E294B" }} />
        <div className="h-7 w-7 rounded" style={{ background: "#114232" }} />
      </div>
    ),
  },
  {
    href: "/letterstack",
    game: "letterstack",
    accent: "from-violet-500/20 to-violet-500/0",
    preview: (
      <div className="text-2xl font-black">A B<br />C D</div>
    ),
  },
  {
    href: "/vlakken",
    game: "vlakken",
    accent: "from-orange-500/20 to-orange-500/0",
    preview: (
      <div className="grid grid-cols-3 gap-px bg-[#3a3a3c] p-px">
        <div className="h-5 w-5 bg-[#c97b63]" />
        <div className="h-5 w-5 bg-[#c97b63]" />
        <div className="h-5 w-5 bg-[#7a8d6c]" />
        <div className="h-5 w-5 bg-[#c97b63]" />
        <div className="h-5 w-5 bg-[#c97b63] grid place-items-center text-[10px] font-bold text-white">4</div>
        <div className="h-5 w-5 bg-[#7a8d6c]" />
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#7a8d6c] grid place-items-center text-[10px] font-bold text-white">3</div>
      </div>
    ),
  },
  {
    href: "/verbind",
    game: "verbind",
    accent: "from-cyan-500/20 to-cyan-500/0",
    preview: (
      <div className="grid grid-cols-3 gap-px bg-[#3a3a3c] p-px">
        <div className="h-5 w-5 bg-[#1a1a1a] grid place-items-center text-[10px] font-bold text-cyan-300">1</div>
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a]" />
        <div className="h-5 w-5 bg-[#1a1a1a] grid place-items-center text-[10px] font-bold text-cyan-300">3</div>
      </div>
    ),
  },
  {
    href: "/zonmaan",
    game: "zonmaan",
    accent: "from-yellow-500/20 to-indigo-500/0",
    preview: (
      <div className="flex gap-1 text-xl">
        <span>☀</span><span>🌙</span><span>☀</span><span>🌙</span>
      </div>
    ),
  },
  {
    href: "/kronen",
    game: "kronen",
    accent: "from-rose-500/20 to-rose-500/0",
    preview: (
      <div className="grid grid-cols-3 gap-px bg-[#3a3a3c] p-px">
        <div className="h-5 w-5 bg-[#c97b63] grid place-items-center text-[11px]">♛</div>
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#7a8d6c]" />
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#7a8d6c] grid place-items-center text-[11px]">♛</div>
        <div className="h-5 w-5 bg-[#7a8d6c]" />
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#bca06a]" />
        <div className="h-5 w-5 bg-[#c97b63]" />
      </div>
    ),
  },
];

export default function HomePage() {
  const { locale } = useLocale();
  const howTo = useMemo(() => getHowToPlay(locale), [locale]);
  const [players, setPlayers] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setPlayers(livePlayerCount());
    setStats(loadStats());
    const id = window.setInterval(() => setPlayers(livePlayerCount()), 6000);
    return () => window.clearInterval(id);
  }, []);

  const recentMedals = useMemo<Achievement[]>(() => {
    if (!stats) return [];
    return listAchievements(stats)
      .filter((a) => a.unlocked && a.unlockedAt)
      .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
      .slice(0, 3);
  }, [stats]);

  const showWelcome = stats && stats.streakDays > 0;
  const today = new Date().toISOString().slice(0, 10);
  const playedToday = stats?.lastPlayed === today;

  const BASE = "https://brainarena.fun";
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "BrainArena games",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: GAMES.length,
    itemListElement: GAMES.map((g, i) => {
      const entry = howTo[g.game];
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "VideoGame",
          name: entry.label,
          url: `${BASE}${g.href}`,
          description: entry.summary,
          genre: "Puzzle",
          gamePlatform: "Web",
          applicationCategory: "Game",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
        },
      };
    }),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div id="adsense-top" className="w-full h-24 bg-gray-900 rounded-xl flex items-center justify-center text-gray-600 text-xs">
        Advertisement
      </div>

      {showWelcome ? (
        <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="font-bold">Welcome back!</span>{" "}
          <span className="text-amber-200">🔥 {stats!.streakDays} day streak</span>{" "}
          {playedToday ? "— locked in for today." : "— play any game today to keep it alive."}
        </section>
      ) : null}

      {stats && stats.totalGames > 0 ? (
        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Mini label="Games today" value={Object.values(stats.gamesPerType).reduce((a, b) => a + b, 0) - (stats.totalGames - (playedToday ? 1 : 0))} />
          <Mini label="Total games" value={stats.totalGames} />
          <Mini label="Best streak" value={`${stats.bestStreak} d`} />
          <Mini label="Medals" value={recentMedals.length === 0 ? Object.keys(stats.unlocked).length : Object.keys(stats.unlocked).length} />
        </section>
      ) : null}

      {recentMedals.length > 0 ? (
        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-3">
          <span className="text-xs uppercase tracking-wider text-gray-500">Latest medals</span>
          <div className="flex flex-wrap items-center gap-2">
            {recentMedals.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-[#0a0a0a] border border-indigo-500/30 px-2 py-1 text-xs">
                <span className="text-base">{m.icon}</span>
                {m.name}
              </span>
            ))}
          </div>
          <Link href="/achievements" className="ml-auto text-xs text-indigo-300 hover:text-indigo-200">All →</Link>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-[#2a2a2a] bg-gradient-to-br from-indigo-500/15 to-transparent p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-indigo-300">Daily Challenge</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          New puzzles every day. <span className="text-indigo-400">Beat them all.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-gray-300 md:text-base">
          Eleven free puzzle and word games. Same daily challenge for everyone — race the world.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500 mr-2 align-middle" />
          {players ? `${players.toLocaleString()} players today` : "Loading…"}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          🎮 11 Games <span className="mx-2">|</span> 🏆 Global Leaderboard <span className="mx-2">|</span> ✅ Free Forever
        </p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {GAMES.map((g) => {
          const entry = howTo[g.game];
          return (
            <Link
              key={g.href}
              href={g.href}
              className={`group relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/40 ${
                g.desktopOnly ? "hidden md:flex" : ""
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.accent}`} />
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex items-center justify-center rounded-xl bg-[#0a0a0a] p-3">
                  {g.preview}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{entry.label}</h2>
                  <p className="mt-1 text-xs text-gray-400">{entry.summary}</p>
                </div>
                <span className="mt-auto text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500">Today</p>
          <h3 className="mt-1 text-xl font-bold">11 daily puzzles</h3>
          <p className="mt-2 text-sm text-gray-400">Synced worldwide. Beat your streak.</p>
        </div>
        <Link href="/leaderboard" className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 hover:border-indigo-400/40">
          <p className="text-xs uppercase tracking-widest text-gray-500">Compete</p>
          <h3 className="mt-1 text-xl font-bold">Global Leaderboard →</h3>
          <p className="mt-2 text-sm text-gray-400">Can you beat #1 today?</p>
        </Link>
      </section>

      <div id="adsense-bottom" className="mt-8 w-full h-24 bg-gray-900 rounded-xl flex items-center justify-center text-gray-600 text-xs">
        Advertisement
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
