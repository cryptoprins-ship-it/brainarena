"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { Game, ScoreEntry } from "@/lib/leaderboard/standings";
import { flagOf } from "@/lib/leaderboard/flag";
import { setName as persistName } from "@/lib/scores";

const TOP_N = 10;

type Props = {
  // Which time-based game's daily board to render — drives the GET
  // /api/leaderboard?game=… request and is the key for player-row
  // matching.
  game: Game;
  // What the local player just submitted, so the table can find and
  // highlight their row even if there are duplicate names. `playerName`
  // may be empty (anonymous play, no leaderboard entry); in that case
  // we just render the public top.
  playerName: string;
  playerTime: number;
  // Rank returned by POST /api/leaderboard at submit. Used as a
  // refetch trigger so the table reflects the freshly appended entry
  // once the server has acknowledged it; the value itself is not read.
  submittedRank?: number;
  // False when the player's score was not submitted — typically because
  // they hit the daily attempt cap for this difficulty. We still surface
  // a synthetic local row so the player sees their result on this screen.
  playerEligible?: boolean;
  // Optional client-side filter — sudoku uses this to scope the board
  // to plays at the current difficulty so easy and hard times don't
  // mix into one ranking.
  metaFilter?: (entry: ScoreEntry) => boolean;
};

export default function TimeEndLeaderboard({
  game,
  playerName,
  playerTime,
  submittedRank,
  playerEligible,
  metaFilter,
}: Props) {
  const { t } = useLocale();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Local copy of the player's displayed name so an inline rename
  // updates the table without waiting for the parent game page to
  // re-render. The prop seeds it; rename mutations replace it.
  const [displayName, setDisplayName] = useState(playerName);
  useEffect(() => {
    setDisplayName(playerName);
  }, [playerName]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=${game}&period=today`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const all: ScoreEntry[] = Array.isArray(data?.scores) ? data.scores : [];
        const filtered = metaFilter ? all.filter(metaFilter) : all;
        setScores(filtered);
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
    // submittedRank flips from undefined → number once POST /api/leaderboard
    // resolves; refetch then so the table reflects the row the server just
    // appended for this player. refreshTick is bumped after a rename so
    // the renamed row appears. metaFilter is intentionally not in the
    // dep array — callers pass a fresh closure each render, which would
    // cause an infinite refetch loop; the values it captures (current
    // difficulty etc.) change at the game-level remount anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, submittedRank, refreshTick]);

  // Locate the player's row in the filtered+sorted list. Match on
  // name + time; ties on (name, time) are rare enough on a daily board
  // that the first hit is the right one. The server substitutes
  // "Anonymous" for empty submissions, so mirror that mapping when the
  // local player has no saved name.
  const effectiveName = displayName || "Anonymous";
  const playerIndex = scores.findIndex(
    (e) => e.name === effectiveName && (e.time ?? -1) === playerTime,
  );

  const top = scores.slice(0, TOP_N);
  // If the player ranked below the visible top, append their row with
  // a separator so they always see where they stand.
  const showPlayerBelow = playerIndex >= TOP_N;

  const hasPlayerResult = displayName.length > 0 && playerTime > 0;
  const playerOnBoard = playerIndex >= 0;
  const showLocalRow = !loading && !playerOnBoard && hasPlayerResult;
  const firstToday = !loading && scores.length === 0 && hasPlayerResult;

  const synthEntry: ScoreEntry = useMemo(
    () => ({ name: effectiveName, score: 0, time: playerTime, date: "" }),
    [effectiveName, playerTime],
  );
  const synthTag =
    playerEligible === false ? t("time_lb_local_capped") : t("time_lb_local_pending");

  // Show the rename affordance whenever the player has a result on
  // this screen — covers both ranked submissions and cap-blocked local
  // rows. Hidden when name is empty (anonymous play didn't enter a
  // name) since there's nothing to rename.
  const canEditName = hasPlayerResult && !loading;

  function startEdit() {
    setDraft(displayName);
    setRenameError(null);
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
    setDraft("");
    setRenameError(null);
  }
  async function saveEdit() {
    const trimmed = draft.trim().slice(0, 24);
    if (!trimmed || trimmed === displayName) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setRenameError(null);
    try {
      const res = await fetch("/api/leaderboard/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, oldName: displayName, newName: trimmed }),
      });
      if (!res.ok) {
        setRenameError(t("name_edit_error"));
        setSaving(false);
        return;
      }
      persistName(trimmed);
      setDisplayName(trimmed);
      setEditing(false);
      setDraft("");
      setRefreshTick((n) => n + 1);
    } catch {
      setRenameError(t("name_edit_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 text-left">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {t("time_lb_title")}
        </p>
        {canEditName && !editing ? (
          <button
            type="button"
            onClick={startEdit}
            aria-label={t("name_edit_aria")}
            className="rounded border border-[#3a3a3a] px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-300 hover:border-indigo-400 hover:text-indigo-200"
          >
            ✏️ {t("name_edit_button")}
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-2 rounded-md border border-indigo-500/40 bg-indigo-500/5 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={24}
              autoFocus
              placeholder={t("name_edit_placeholder")}
              className="flex-1 min-w-0 rounded border border-[#3a3a3a] bg-[#0a0a0a] px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveEdit();
                else if (e.key === "Escape") cancelEdit();
              }}
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={saving || !draft.trim() || draft.trim() === displayName}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "…" : t("name_edit_save")}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded border border-[#3a3a3a] px-3 py-1 text-xs text-gray-300 hover:border-[#4a4a4a]"
            >
              {t("name_edit_cancel")}
            </button>
          </div>
          {renameError ? (
            <p className="mt-1 text-[10px] text-red-300">{renameError}</p>
          ) : null}
        </div>
      ) : null}
      {firstToday ? (
        <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t("time_lb_first_today")}
        </div>
      ) : null}
      <div className="mt-2 overflow-hidden rounded-md border border-[#2a2a2a]">
        <table className="w-full text-xs">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-center w-6"></th>
              <th className="px-2 py-1.5 text-left">{t("lb_col_name")}</th>
              <th className="px-2 py-1.5 text-right">
                {t("wordle_lb_col_time")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  {t("home_loading")}
                </td>
              </tr>
            ) : scores.length === 0 && !hasPlayerResult ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  {t("time_lb_empty")}
                </td>
              </tr>
            ) : (
              <>
                {scores.length === 0 && hasPlayerResult ? (
                  <Row
                    entry={synthEntry}
                    rank={1}
                    isPlayer
                    youLabel={t("wordle_lb_you")}
                    extraTag={synthTag}
                  />
                ) : (
                  top.map((e, i) => (
                    <Row
                      key={`${e.date}-${i}`}
                      entry={e}
                      rank={i + 1}
                      isPlayer={i === playerIndex}
                      youLabel={t("wordle_lb_you")}
                    />
                  ))
                )}
                {showPlayerBelow ? (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-1 text-center text-gray-600"
                      >
                        …
                      </td>
                    </tr>
                    <Row
                      entry={scores[playerIndex]}
                      rank={playerIndex + 1}
                      isPlayer
                      youLabel={t("wordle_lb_you")}
                    />
                  </>
                ) : showLocalRow && scores.length > 0 ? (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-1 text-center text-gray-600"
                      >
                        …
                      </td>
                    </tr>
                    <Row
                      entry={synthEntry}
                      rank={null}
                      isPlayer
                      youLabel={t("wordle_lb_you")}
                      extraTag={synthTag}
                    />
                  </>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  entry,
  rank,
  isPlayer,
  youLabel,
  extraTag,
}: {
  entry: ScoreEntry;
  rank: number | null;
  isPlayer: boolean;
  youLabel: string;
  extraTag?: string;
}) {
  return (
    <tr
      className={
        isPlayer
          ? "bg-[#538d4e]/25 font-bold"
          : rank === 1
            ? "bg-amber-500/10"
            : "odd:bg-[#161616]"
      }
    >
      <td className="px-2 py-1.5 tabular-nums text-gray-400">{rank ?? "—"}</td>
      <td className="px-1 py-1.5 text-center text-base leading-none">
        {flagOf(entry.country)}
      </td>
      <td className="px-2 py-1.5 truncate max-w-[8rem]">
        {entry.name}
        {isPlayer ? (
          <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-300">
            · {youLabel}
          </span>
        ) : null}
        {extraTag ? (
          <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-300">
            · {extraTag}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
        {entry.time != null ? `${entry.time}s` : "—"}
      </td>
    </tr>
  );
}
