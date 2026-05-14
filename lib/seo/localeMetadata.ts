import type { Metadata } from "next";
import { SUPPORTED, type Locale } from "@/lib/locales";
import { canonicalUrlFor, generateHreflangAlternates } from "./hreflang";

// Per-route layouts under app/[locale]/<route>/layout.tsx all need the
// same three things: validate the locale param, build a self-referencing
// canonical, and emit the full hreflang cluster for the path. Wrapping
// that in one helper keeps each route's layout to the metadata that's
// actually unique (title + description).
export async function buildLocaleMetadata({
  params,
  path,
  title,
  description,
}: {
  params: Promise<{ locale: string }>;
  path: string;
  title: string;
  description: string;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = (SUPPORTED as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrlFor(path, safeLocale),
      languages: generateHreflangAlternates(path),
    },
  };
}
