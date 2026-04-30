import Link from "next/link";
import type { GameKey } from "@/lib/scores";
import { HOW_TO_PLAY } from "@/lib/howToPlay";

export default function HowToPlay({ game }: { game: GameKey }) {
  const entry = HOW_TO_PLAY[game];
  if (!entry) return null;
  return (
    <details className="group mb-4 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] open:border-indigo-400/40">
      <summary className="cursor-pointer list-none px-4 py-2 text-sm">
        <span className="font-semibold text-white">How to play {entry.label}</span>
        <span className="ml-2 text-gray-500 group-open:hidden">— {entry.summary}</span>
        <span className="float-right text-gray-500 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-[#2a2a2a] px-4 py-3 text-sm text-gray-300">
        <p>{entry.summary}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {entry.rules.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Want all the games?{" "}
          <Link href="/how-to-play" className="underline hover:text-indigo-300">See full guide →</Link>
        </p>
      </div>
    </details>
  );
}
