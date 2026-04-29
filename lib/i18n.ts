"use client";

import { useEffect, useState, useCallback } from "react";

export type Locale = "en" | "nl" | "de" | "fr" | "es";

const STORAGE_KEY = "brainarena-locale";
export const SUPPORTED: Locale[] = ["en", "nl", "de", "fr", "es"];

export const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  nl: "🇳🇱",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
};

export const LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

let current: Locale = "en";
const subs = new Set<(l: Locale) => void>();

function detectFromBrowser(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || "en").slice(0, 2).toLowerCase();
  return (SUPPORTED as string[]).includes(lang) ? (lang as Locale) : "en";
}

function setLocale(l: Locale) {
  current = l;
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    document.documentElement.setAttribute("lang", l);
  }
  subs.forEach((fn) => fn(l));
}

export function useLocale() {
  const [locale, set] = useState<Locale>(current);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    const initial: Locale =
      stored && (SUPPORTED as string[]).includes(stored)
        ? stored
        : detectFromBrowser();
    if (initial !== current) {
      current = initial;
      document.documentElement.setAttribute("lang", initial);
      set(initial);
    } else {
      document.documentElement.setAttribute("lang", current);
    }
    const fn = (l: Locale) => set(l);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);

  const change = useCallback((l: Locale) => setLocale(l), []);
  return { locale, setLocale: change };
}
