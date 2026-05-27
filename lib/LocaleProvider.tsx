"use client";

import type { Locale } from "./locales";
import { LocaleContext, seedCurrentLocale } from "./i18n";

// Server layouts wrap their localized subtree in this provider so the
// first client render observes the URL locale via React context instead
// of the module-level "en" default. That eliminates the hydration
// mismatch where server HTML carried Dutch labels while the first client
// render fell back to English until useEffect re-detected the path.
export default function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  seedCurrentLocale(initialLocale);
  return (
    <LocaleContext.Provider value={initialLocale}>
      {children}
    </LocaleContext.Provider>
  );
}
