"use client";

import Link from "next/link";
import CookieSettingsLink from "./CookieSettingsLink";
import { useLocale } from "@/lib/i18n";
import { localizedHref } from "@/lib/seo/hreflang";

// Locale-aware footer nav. The outer `app/layout.tsx` is a server
// component, so we render the language-dependent links from here where
// useLocale() has access to the active locale.
export default function FooterNav() {
  const { locale, t } = useLocale();
  return (
    <nav className="flex flex-wrap items-center gap-4">
      <Link href={localizedHref(locale, "/how-to-play")} className="hover:text-indigo-300">{t("nav_how_to_play")}</Link>
      <Link href={localizedHref(locale, "/about")} className="hover:text-indigo-300">{t("nav_about")}</Link>
      <Link href="/privacy" className="hover:text-indigo-300">{t("nav_privacy")}</Link>
      <Link href="/contact" className="hover:text-indigo-300">{t("nav_contact")}</Link>
      <Link href="/leaderboard" className="hover:text-indigo-300">{t("nav_leaderboard")}</Link>
      <Link href="/achievements" className="hover:text-indigo-300">{t("nav_achievements")}</Link>
      <CookieSettingsLink />
    </nav>
  );
}
