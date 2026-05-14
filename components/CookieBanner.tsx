"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useLocale } from "@/lib/i18n";

// Cookie / consent banner. Three categories:
//   - necessary: always on (game state, language, leaderboard submissions
//     the user explicitly initiates) — these aren't really cookies, they're
//     localStorage, but the consent UI groups them together for clarity.
//   - analytics: off by default. Reserved for future analytics integrations.
//   - advertising: off by default. Gates the Google AdSense loader.
//
// AdSense MUST NOT load until consent.advertising === true. That is the
// single most important behaviour in this file — it is what makes
// brainarena.fun GDPR/ePrivacy compliant for EU visitors.

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  ts: number;
};

const STORAGE_KEY = "brainarena-consent-v1";
const CONSENT_VERSION = 1;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState> & { v?: number };
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      advertising: !!parsed.advertising,
      ts: typeof parsed.ts === "number" ? parsed.ts : Date.now(),
    };
  } catch {
    return null;
  }
}

function writeConsent(c: ConsentState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...c, v: CONSENT_VERSION })
    );
  } catch {
    // localStorage quota / private mode — fail silent, banner re-shows next visit.
  }
  // Notify any listeners (e.g. settings page) that consent changed.
  window.dispatchEvent(new CustomEvent("brainarena:consent", { detail: c }));
}

// Tiny global so other components / pages can re-open the banner (e.g.
// a "Cookie settings" link in the footer). Set on window after mount.
declare global {
  interface Window {
    brainarenaOpenConsent?: () => void;
  }
}

export default function CookieBanner() {
  const { t } = useLocale();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [customise, setCustomise] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftAdvertising, setDraftAdvertising] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
      setDraftAnalytics(stored.analytics);
      setDraftAdvertising(stored.advertising);
    } else {
      setOpen(true);
    }
    window.brainarenaOpenConsent = () => {
      const cur = readConsent();
      if (cur) {
        setDraftAnalytics(cur.analytics);
        setDraftAdvertising(cur.advertising);
      }
      setCustomise(true);
      setOpen(true);
    };
    return () => {
      delete window.brainarenaOpenConsent;
    };
  }, []);

  function commit(next: ConsentState) {
    writeConsent(next);
    setConsent(next);
    setOpen(false);
    setCustomise(false);
  }

  function acceptAll() {
    commit({ necessary: true, analytics: true, advertising: true, ts: Date.now() });
  }
  function rejectAll() {
    commit({ necessary: true, analytics: false, advertising: false, ts: Date.now() });
  }
  function saveCustom() {
    commit({
      necessary: true,
      analytics: draftAnalytics,
      advertising: draftAdvertising,
      ts: Date.now(),
    });
  }

  return (
    <>
      {/* AdSense loader — only injected when the user has explicitly
          opted into advertising cookies. CSP must allow pagead2.googlesyndication.com
          in script-src, which next.config.ts already does. */}
      {hydrated && consent?.advertising && ADSENSE_CLIENT ? (
        <Script
          id="adsense-loader"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      ) : null}

      {hydrated && open ? (
        <div
          role="dialog"
          aria-label={t("cookie_settings")}
          aria-modal="false"
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 pt-2"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]/95 p-5 text-sm text-gray-200 shadow-2xl backdrop-blur">
            {!customise ? (
              <>
                <p className="font-bold text-white">{t("cookie_title")}</p>
                <p className="mt-1 text-gray-300">{t("cookie_body")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold hover:bg-indigo-500"
                  >
                    {t("cookie_accept_all")}
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm hover:bg-[#222]"
                  >
                    {t("cookie_reject_all")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomise(true)}
                    className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm hover:bg-[#222]"
                  >
                    {t("cookie_customise")}
                  </button>
                  <a
                    href="/privacy"
                    className="ml-auto self-center text-xs text-gray-400 underline hover:text-indigo-300"
                  >
                    {t("cookie_privacy")}
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-white">{t("cookie_settings")}</p>
                <p className="mt-1 text-xs text-gray-400">{t("cookie_settings_desc")}</p>
                <div className="mt-3 space-y-2">
                  <Row
                    title={t("cookie_cat_necessary")}
                    desc={t("cookie_desc_necessary")}
                    alwaysOnLabel={t("cookie_always_on")}
                    checked
                    locked
                    onChange={() => {}}
                  />
                  <Row
                    title={t("cookie_cat_analytics")}
                    desc={t("cookie_desc_analytics")}
                    alwaysOnLabel={t("cookie_always_on")}
                    checked={draftAnalytics}
                    onChange={setDraftAnalytics}
                  />
                  <Row
                    title={t("cookie_cat_advertising")}
                    desc={t("cookie_desc_advertising")}
                    alwaysOnLabel={t("cookie_always_on")}
                    checked={draftAdvertising}
                    onChange={setDraftAdvertising}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold hover:bg-indigo-500"
                  >
                    {t("cookie_save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomise(false)}
                    className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm hover:bg-[#222]"
                  >
                    {t("cookie_back")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Row({
  title,
  desc,
  checked,
  locked,
  alwaysOnLabel,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  alwaysOnLabel: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-indigo-500 disabled:opacity-60"
      />
      <span className="flex-1">
        <span className="font-bold text-white">{title}</span>
        {locked ? (
          <span className="ml-2 rounded bg-[#1f1f1f] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{alwaysOnLabel}</span>
        ) : null}
        <span className="mt-1 block text-xs text-gray-400">{desc}</span>
      </span>
    </label>
  );
}
