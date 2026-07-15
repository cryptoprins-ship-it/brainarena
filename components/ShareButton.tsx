"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { GameKey } from "@/lib/scores";
import {
  SHARE_TARGETS,
  buildShareParts,
  copyShareText,
  hasNativeShare,
  nativeShare,
  type SharePayload,
} from "@/lib/share";
import { buildShareCardBlob } from "@/lib/shareCard";

// Single share entry point for every game's end screen.
//
// On browsers with the Web Share API (mobile, some desktop) one tap
// opens the OS share sheet, which lists every app the user actually
// has. Everywhere else — most desktops — the button opens a small menu
// of explicit platform links (X, WhatsApp, Telegram, Facebook, Reddit,
// Email) plus Copy, so "share" is never reduced to clipboard-only.
//
// The menu is positioned `fixed` from the button's measured rect and
// clamped to the viewport, so it can't fall off-screen the way the
// language dropdown used to.
type Props = {
  game: GameKey;
  score: number;
  time?: number;
  meta?: Record<string, unknown>;
  rank?: number;
  locale?: string;
  className?: string;
  label?: string;
};

const MENU_WIDTH = 184;

export default function ShareButton({
  game,
  score,
  time,
  meta,
  rank,
  locale,
  className,
  label,
}: Props) {
  const { locale: uiLocale, t } = useLocale();
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ left: number; bottom: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const payload: SharePayload = { score, time, meta, rank, locale: locale ?? uiLocale };
  const parts = buildShareParts(game, payload);

  // Close the menu on outside click, Escape, or any scroll/resize (which
  // would leave the fixed position stale).
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  function flashToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 1600);
  }

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // Right-align the menu to the button, then clamp into the viewport
    // (8px gutters). The menu grows upward from just above the button.
    const left = Math.max(
      8,
      Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
    );
    setMenu({ left, bottom: window.innerHeight - r.top + 8 });
  }

  async function buildCardFile(): Promise<File | null> {
    const blob = await buildShareCardBlob(game, payload);
    if (!blob) return null;
    return new File([blob], `brainarena-${game}.png`, { type: "image/png" });
  }

  async function onShareClick() {
    // Web Share-capable browser: the OS sheet already covers every
    // installed app, so use it directly and skip the menu. The
    // share-card image rides along when the platform supports file
    // attachments (nativeShare re-checks navigator.canShare with the
    // concrete File — capability can't be tested without one).
    if (hasNativeShare()) {
      const file = await buildCardFile();
      const outcome = await nativeShare(game, payload, file);
      if (outcome === "shared" || outcome === "dismissed") return;
      // unavailable / failed → fall through to the explicit menu
    }
    if (menu) setMenu(null);
    else openMenu();
  }

  async function onCopy() {
    setMenu(null);
    const outcome = await copyShareText(game, payload);
    if (outcome === "copied") flashToast(t("share_copied"));
    else if (outcome === "prompted") flashToast(t("share_copy_dialog"));
    else flashToast(t("share_copy_failed"));
  }

  // Platform-intent links (X/WhatsApp/...) are URL-based and can only
  // carry text, never a file — downloading is the only way a desktop
  // visitor without Web Share gets the actual image.
  async function onDownload() {
    setMenu(null);
    const file = await buildCardFile();
    if (!file) {
      flashToast(t("share_copy_failed"));
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onShareClick}
        aria-haspopup="menu"
        aria-expanded={menu != null}
        className={
          className ??
          "rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold hover:border-indigo-400/40"
        }
      >
        {label ?? t("win_share")}
      </button>

      {menu ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t("share_to_aria")}
          style={{ left: menu.left, bottom: menu.bottom, width: MENU_WIDTH }}
          className="fixed z-[60] max-h-[60vh] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#111] py-1 shadow-xl shadow-black/60"
        >
          {SHARE_TARGETS.map((tgt) => (
            <a
              key={tgt.id}
              role="menuitem"
              href={tgt.href(parts)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className="block px-3 py-2 text-sm text-gray-200 hover:bg-[#1a1a1a]"
            >
              {tgt.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={onCopy}
            className="block w-full border-t border-[#2a2a2a] px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#1a1a1a]"
          >
            {t("share_copy_text")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDownload}
            className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#1a1a1a]"
          >
            {t("share_download_image")}
          </button>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
