"use client";

import { useEffect } from "react";

const SENTINEL = "brainarena-global-error-reloaded";

// Top-level error boundary. Fires when the root layout itself crashes
// (anything below has its own app/error.tsx). On first failure we soft-
// reload once — a stale HTML page referencing chunks that no longer
// exist after a deploy is the most common cause and a reload picks up
// the fresh build. The sentinel in sessionStorage stops the page from
// looping if the reload also fails.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(SENTINEL) === "1";
      if (!alreadyTried) sessionStorage.setItem(SENTINEL, "1");
    } catch {
      // sessionStorage can throw under strict cookie blocking; in that
      // case skip auto-reload entirely so we don't loop the page.
      alreadyTried = true;
    }
    if (!alreadyTried) {
      window.location.reload();
    }
    // eslint-disable-next-line no-console
    console.error("brainarena_global_error", error?.message, error?.digest);
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
    <html lang="en" style={{ background: "#0a0a0a", colorScheme: "dark" }}>
      <body
        style={{
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            BrainArena
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: 16 }}>
            Something went wrong loading this page. We tried to reload
            automatically — if it persists, tap below.
          </p>
          <button
            type="button"
            onClick={clearAndRetry}
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "10px 20px",
              borderRadius: 6,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
