import { notFound } from "next/navigation";
import { SUPPORTED, type Locale } from "@/lib/locales";
import LocaleProvider from "@/lib/LocaleProvider";

// Only enumerate the locales whose per-route subtrees actually exist.
// Adding a locale here without the matching app/[locale]/<route>
// directories would 404; adding a route without listing it in
// LOCALIZED_PATHS (lib/seo/hreflang.ts) would orphan its hreflang.
export async function generateStaticParams() {
  return SUPPORTED.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(SUPPORTED as readonly string[]).includes(locale)) {
    notFound();
  }
  // Pass the URL locale into the client tree via context so useLocale's
  // first render matches the server-rendered HTML and avoids a hydration
  // mismatch on /nl, /de, /fr, /es, /hi, /pt-BR, /ja routes.
  return <LocaleProvider initialLocale={locale as Locale}>{children}</LocaleProvider>;
}

// Treat any locale not in SUPPORTED as a hard 404. Without this Next
// will happily server-render `/foobar/sudoku` with the param threaded
// through, which would create duplicate-content noise for the crawler.
export const dynamicParams = false;

export type LocaleParam = { locale: Locale };
