"use client";

import { FLAG, LABEL, SUPPORTED, useLocale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 text-sm">
      {SUPPORTED.map((l) => (
        <button
          key={l}
          type="button"
          aria-label={LABEL[l]}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-1 transition ${
            locale === l ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          <span className="mr-1">{FLAG[l]}</span>
          <span className="uppercase">{l}</span>
        </button>
      ))}
    </div>
  );
}
