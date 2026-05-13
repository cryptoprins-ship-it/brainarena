// Locale constants split out of lib/i18n.ts so they're importable from
// server components. lib/i18n.ts is `"use client"` because it owns the
// useLocale hook and a module-level mutable `current` locale, which
// makes its named exports unusable from the server bundle (Turbopack
// proxies them as client-reference stubs). Anything purely static —
// the locale list, native labels, flag emoji, review-gating set —
// belongs here and can be re-exported by lib/i18n.ts for callers that
// want a single import site.

export type Locale =
  | "en" | "nl" | "de" | "fr" | "es"
  | "hi" | "pt-BR" | "ja";

export const SUPPORTED: readonly Locale[] = [
  "en", "nl", "de", "fr", "es", "hi", "pt-BR", "ja",
] as const;

// Locales gated by the "review pending" UX. Selectable in dev / preview
// builds; in production the LanguageSwitcher decorates them with a badge
// and (configurably) blocks selection. Toggle here once a native review
// is signed off.
export const REVIEW_PENDING: ReadonlySet<Locale> = new Set<Locale>([
  "hi", "ja",
]);

// Native names — what speakers of that language actually call it. Used
// in the dropdown switcher.
export const LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  hi: "हिन्दी",
  "pt-BR": "Português",
  ja: "日本語",
};

// Legacy emoji table — left for any places that still import FLAG by
// name. Inline SVGs in components/Flag.tsx are preferred (Windows
// renders most regional-indicator emoji as letter codes).
export const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  nl: "🇳🇱",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  hi: "🇮🇳",
  "pt-BR": "🇧🇷",
  ja: "🇯🇵",
};
