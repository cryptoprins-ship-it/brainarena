import type { GameKey } from "@/lib/scores";

// Contextual cross-promo to Renisual. The pattern works only when the link
// flows logically from what the player just did — e.g. RAL quiz → facade
// renderer. Forced or generic links read as ads and the player closes the
// tab. Only register a game here if there's a real skill/topic bridge.
//
// `?ref=brainarena-<game>` lets us see in Plausible / server logs which
// game funnel actually drives clicks, instead of guessing.
const PROMO: Partial<Record<GameKey, { headline: string; sub: string; href: string }>> = {
  colormatch: {
    headline: "Test your color knowledge — used by facade professionals.",
    sub: "Visualise any RAL color on a real building →",
    href: "https://renisual.com/render?ref=brainarena-colormatch",
  },
  vlakken: {
    headline: "Same skill, real walls.",
    sub: "Calculate facade panel counts for any project →",
    href: "https://renisual.com/gevelcalc?ref=brainarena-vlakken",
  },
  tiledrop: {
    headline: "From tile puzzle to real facade.",
    sub: "Visualise panels and colors on actual buildings →",
    href: "https://renisual.com/render?ref=brainarena-tiledrop",
  },
};

export default function CrossPromoCard({ game }: { game: GameKey }) {
  const entry = PROMO[game];
  if (!entry) return null;
  return (
    <a
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm transition-colors hover:border-indigo-400"
    >
      <p className="font-bold text-indigo-200">{entry.headline}</p>
      <p className="mt-1 text-xs text-gray-400">{entry.sub}</p>
    </a>
  );
}
