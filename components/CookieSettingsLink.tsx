"use client";

// Tiny client wrapper so the footer link in the server-rendered layout
// can re-open the cookie banner. The CookieBanner exposes a hook on
// `window.brainarenaOpenConsent` after mount; we call into it here.

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.brainarenaOpenConsent?.()}
      className="hover:text-indigo-300"
    >
      Cookie settings
    </button>
  );
}
