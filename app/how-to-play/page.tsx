import Link from "next/link";
import { HOW_TO_PLAY, HOW_TO_PLAY_ORDER } from "@/lib/howToPlay";

export default function HowToPlayPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">How to play</h1>
      <p className="mt-2 text-sm text-gray-400">
        Quick rules for each of the nine BrainArena games. Pick one and dive in.
      </p>

      <nav aria-label="Game jump links" className="mt-4 flex flex-wrap gap-2">
        {HOW_TO_PLAY_ORDER.map((g) => (
          <a
            key={g}
            href={`#${g}`}
            className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-xs hover:border-indigo-400/40 hover:text-indigo-300"
          >
            {HOW_TO_PLAY[g].label}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-4">
        {HOW_TO_PLAY_ORDER.map((g) => {
          const e = HOW_TO_PLAY[g];
          return (
            <section
              key={g}
              id={g}
              className="scroll-mt-20 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{e.label}</h2>
                <Link
                  href={e.href}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold hover:bg-indigo-500"
                >
                  Play →
                </Link>
              </div>
              <p className="mt-2 text-sm text-gray-300">{e.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-300">
                {e.rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
