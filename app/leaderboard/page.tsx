"use client";

import { useEffect, useState } from "react";
import type {
  Game,
  Period,
  ScoreEntry,
  ChampionStanding,
} from "@/lib/leaderboard/standings";
import { useLocale } from "@/lib/i18n";
import { getHowToPlay } from "@/lib/howToPlay";

// Tab order only — display labels come from lib/howToPlay.ts so they
// re-localise with the language switcher.
const GAME_ORDER: Game[] = [
  "wordle", "boggle", "sudoku", "typing", "tiledrop", "colormatch",
  "letterstack", "vlakken", "verbind", "zonmaan", "kronen",
  "minesweeper", "connections",
];

const PERIOD_ORDER: Period[] = ["today", "week", "month", "alltime"];

// Period → translation key for its tab label. `today` reuses the
// existing home_today key.
function periodTKey(p: Period) {
  return p === "today"
    ? "home_today"
    : p === "week"
    ? "lb_period_week"
    : p === "month"
    ? "lb_period_month"
    : "lb_period_alltime";
}

function monthLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function flagOf(country?: string) {
  if (!country) return "🌍";
  const cc = country.trim().toUpperCase();
  if (cc.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

function scoreCell(game: Game, e: ScoreEntry): string {
  if (game === "sudoku" && e.time != null) return `${e.time}s`;
  if (game === "typing") return `${e.score} WPM`;
  return String(e.score);
}

// Monthly all-round championship — aggregates per-game placement into a
// single cross-game ranking. This is the board the all-round prize is
// awarded from; per-game monthly winners are just #1 of each game's
// "This Month" board.
function ChampionPanel() {
  const { t } = useLocale();
  const [standings, setStandings] = useState<ChampionStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/leaderboard/champion?period=month")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setStandings(Array.isArray(data?.standings) ? data.standings : []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setStandings([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const champ = standings[0];

  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-black text-amber-200">
          🏆 {t("lb_champion_title")} — {monthLabel()}
        </h2>
      </div>
      <p className="mt-1 text-xs text-gray-400">{t("lb_champion_desc")}</p>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">{t("home_loading")}</p>
      ) : standings.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{t("lb_champion_empty")}</p>
      ) : (
        <>
          {champ ? (
            <p className="mt-3 text-sm">
              {t("lb_champion_leading")}{" "}
              <span className="font-bold text-amber-100">{champ.name}</span>{" "}
              {t("lb_with")} <span className="font-mono">{champ.points} {t("lb_pts")}</span>
              {champ.wins > 0 ? (
                <span className="text-gray-400">
                  {" "}
                  ({t("lb_games_won", { wins: champ.wins })})
                </span>
              ) : null}
            </p>
          ) : null}
          <ol className="mt-3 space-y-1 text-sm">
            {standings.slice(0, 10).map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 ${
                  i === 0 ? "bg-amber-500/15" : "bg-[#1a1a1a]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 tabular-nums text-gray-500">{i + 1}</span>
                  <span className="font-medium">{s.name}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{t("lb_games_count", { n: s.gamesPlaced })}</span>
                  <span className="font-mono text-sm text-amber-200">
                    {s.points} {t("lb_pts")}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { locale, t } = useLocale();
  const howTo = getHowToPlay(locale);
  const [game, setGame] = useState<Game>("wordle");
  const [period, setPeriod] = useState<Period>("today");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=${game}&period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setScores(Array.isArray(data?.scores) ? data.scores : []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setScores([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [game, period]);

  const top = scores[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black md:text-4xl">{t("lb_title")}</h1>
      <p className="mt-2 text-sm text-gray-400">{t("lb_subtitle")}</p>

      {/* Monthly all-round championship — only shown on the monthly view,
          which is the period it's scoped to. */}
      {period === "month" ? <ChampionPanel /> : null}

      {top ? (
        <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm">
          <span className="font-bold">
            #1 ({t(periodTKey(period))}): {top.name}
          </span>{" "}
          {t("lb_with")} <span className="font-mono">{scoreCell(game, top)}</span> {flagOf(top.country)} —{" "}
          <span className="text-indigo-300">{t("lb_beat_no1")}</span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {GAME_ORDER.map((g) => (
          <button
            key={g}
            onClick={() => setGame(g)}
            className={`rounded-lg px-3 py-1.5 text-sm border transition ${
              game === g
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-300 hover:border-[#3a3a3c]"
            }`}
          >
            {howTo[g].label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PERIOD_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1 text-xs uppercase tracking-wider border ${
              period === p
                ? "border-white/40 bg-white/10 text-white"
                : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-400"
            }`}
          >
            {t(periodTKey(p))}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">{t("lb_col_name")}</th>
              <th className="px-4 py-2 text-right">{t("lb_col_score")}</th>
              <th className="px-4 py-2 text-center">{t("lb_col_country")}</th>
              <th className="px-4 py-2 text-right">{t("lb_col_date")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t("home_loading")}</td></tr>
            ) : scores.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t("lb_no_scores")}</td></tr>
            ) : (
              scores.map((e, i) => (
                <tr key={`${e.date}-${i}`} className={i === 0 ? "bg-indigo-500/10" : "hover:bg-[#222]"}>
                  <td className="px-4 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2 text-right font-mono">{scoreCell(game, e)}</td>
                  <td className="px-4 py-2 text-center">{flagOf(e.country)}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
