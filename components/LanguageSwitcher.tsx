"use client";

import { useEffect, useRef, useState } from "react";
import Flag from "./Flag";
import { LABEL, REVIEW_PENDING, SUPPORTED, useLocale, type Locale } from "@/lib/i18n";

// Locales that are still pending native review are visually marked and
// blocked from selection — see CLAUDE.md / project memory: "DO NOT ship
// hi/ja with raw machine translation visible." Flip BLOCK_REVIEW_PENDING
// to false for staging/QA so reviewers can preview the rendering.
const BLOCK_REVIEW_PENDING = true;

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape so the dropdown behaves like a real
  // menu without pulling in a heavy popover library.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (l: Locale) => {
    if (BLOCK_REVIEW_PENDING && REVIEW_PENDING.has(l)) return;
    setLocale(l);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${LABEL[locale]}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-1.5 hover:bg-[#222] transition"
      >
        <Flag locale={locale} className="h-4 w-6 rounded-[2px]" />
        <span className="text-sm">{LABEL[locale]}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className="text-gray-400">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-[#2a2a2a] bg-[#111] shadow-xl shadow-black/60 py-1 max-h-[80vh] overflow-y-auto"
        >
          {SUPPORTED.map((l) => {
            const pending = REVIEW_PENDING.has(l);
            const blocked = BLOCK_REVIEW_PENDING && pending;
            const isActive = locale === l;
            return (
              <li key={l} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  disabled={blocked}
                  title={blocked ? "Coming soon — translation under native review" : LABEL[l]}
                  onClick={() => handleSelect(l)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition ${
                    isActive ? "bg-indigo-600/30 text-white" : "hover:bg-[#1a1a1a] text-gray-200"
                  } ${blocked ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <Flag locale={l} className="h-4 w-6 rounded-[2px]" />
                    <span>{LABEL[l]}</span>
                  </span>
                  {pending && (
                    <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                      Coming&nbsp;soon
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
