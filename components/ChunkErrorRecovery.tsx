"use client";

import { useEffect } from "react";

const SENTINEL = "brainarena-chunk-recovery-reloaded";

// Catches chunk-loading failures that bypass React's error boundaries —
// e.g. dynamic import() rejections from event handlers, async effects,
// or third-party libs. React's app/error.tsx only sees errors thrown
// during render, so without this hook a player on a stale deploy can
// click around and silently get a no-op (failed module fetch swallowed
// by the event-handler queue) until they refresh manually.
//
// We listen for both window "error" (script tag failures) and
// "unhandledrejection" (Promise rejections from import()) and reload
// once when the message matches a chunk-load pattern. Sentinel in
// sessionStorage prevents an infinite loop if the reload also fails.
function isChunkErrorMessage(input: unknown): boolean {
  const msg =
    typeof input === "string"
      ? input
      : input instanceof Error
        ? `${input.name} ${input.message}`
        : "";
  if (!msg) return false;
  return (
    /ChunkLoadError/.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

function attemptReloadOnce() {
  let alreadyTried = false;
  try {
    alreadyTried = sessionStorage.getItem(SENTINEL) === "1";
    if (!alreadyTried) sessionStorage.setItem(SENTINEL, "1");
  } catch {
    alreadyTried = true;
  }
  if (!alreadyTried) {
    window.location.reload();
  }
}

export default function ChunkErrorRecovery() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      if (isChunkErrorMessage(e.message) || isChunkErrorMessage(e.error)) {
        attemptReloadOnce();
      }
    }
    function onRejection(e: PromiseRejectionEvent) {
      if (isChunkErrorMessage(e.reason)) {
        attemptReloadOnce();
      }
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
