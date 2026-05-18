"use client";

import Link from "next/link";
import { getHowToPlay, HOW_TO_PLAY_ORDER, UI_STRINGS } from "@/lib/howToPlay";
import { useLocale } from "@/lib/i18n";
import { localizedHref } from "@/lib/seo/hreflang";

export default function HowToPlayPage() {
  const { locale } = useLocale();
  const entries = getHowToPlay(locale);
  const ui = UI_STRINGS[locale] ?? UI_STRINGS.en;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">{ui.howToPlayHeading}</h1>
      <p className="mt-2 text-sm text-gray-400">{ui.howToPlaySubtitle}</p>

      <nav aria-label="Game jump links" className="mt-4 flex flex-wrap gap-2">
        {HOW_TO_PLAY_ORDER.map((g) => (
          <a
            key={g}
            href={`#${g}`}
            className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-xs hover:border-indigo-400/40 hover:text-indigo-300"
          >
            {entries[g].label}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-4">
        {HOW_TO_PLAY_ORDER.map((g) => {
          const e = entries[g];
          return (
            <section
              key={g}
              id={g}
              className="scroll-mt-20 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{e.label}</h2>
                <Link
                  href={localizedHref(locale, e.href)}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold hover:bg-indigo-500"
                >
                  {ui.play}
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
