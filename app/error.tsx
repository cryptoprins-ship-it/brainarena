"use client";

import { useEffect } from "react";

const SENTINEL = "brainarena-route-error-reloaded";

// Per-route error boundary. Catches client errors thrown by any page
// under app/* that doesn't have its own error.tsx. We auto-reload once
// when the error looks like a chunk-loading failure — that pattern
// usually means the HTML is from a previous deploy and the chunk paths
// no longer resolve, which a fresh navigation fixes.
function isChunkLoadError(err: Error | undefined): boolean {
  if (!err) return false;
  const msg = err.message ?? "";
  const name = err.name ?? "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isChunkLoadError(error)) return;
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
    // eslint-disable-next-line no-console
    console.warn("brainarena_route_error", error?.message, error?.digest);
  }, [error]);

  function clearAndRetry() {
    try {
      sessionStorage.removeItem(SENTINEL);
    } catch {
      /* noop */
    }
    reset();
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="text-xl font-bold">Page failed to load</h1>
      <p className="mt-2 text-sm text-gray-400">
        A fresh version of the site is probably available. Reloading
        usually fixes it.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={clearAndRetry}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded border border-[#3a3a3a] px-4 py-2 text-sm text-gray-300 hover:border-[#4a4a4a]"
        >
          Hard reload
        </button>
      </div>
    </div>
  );
}
