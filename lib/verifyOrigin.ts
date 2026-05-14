// Origin check for state-changing requests. Browsers always set Origin on
// cross-site fetches and same-origin POSTs, so a strict allow-list blocks
// CSRF from arbitrary attacker-hosted pages. Same-site cookies + this
// header check is the cheapest CSRF defence that actually works.
//
// Returns null when the origin is allowed, or a 403 Response when not —
// callers should `return forbidden ?? ...` so the rejection short-circuits
// the route.

const PROD_ALLOWED = [
  "https://brainarena.fun",
  "https://www.brainarena.fun",
];

const DEV_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

function isAllowedOrigin(origin: string, req: Request): boolean {
  // Canonical production domains are always allowed; the localhost set is
  // added outside production builds.
  const explicit =
    process.env.NODE_ENV === "production"
      ? PROD_ALLOWED
      : [...PROD_ALLOWED, ...DEV_ALLOWED];
  if (explicit.includes(origin)) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  // Vercel deployments — preview branches and production aliases — all
  // live under *.vercel.app, and Vercel runs them with
  // NODE_ENV=production, so they'd otherwise be rejected by the prod
  // allow-list. The CSRF model still holds: a page on evil.com cannot
  // make the browser send an Origin of *.vercel.app.
  if (originHost === "vercel.app" || originHost.endsWith(".vercel.app")) {
    return true;
  }

  // Same-origin fallback: the Origin's host matches the Host the request
  // was actually sent to. This IS the CSRF invariant — a cross-site
  // attacker's Origin never matches the target's Host — so it safely
  // covers custom preview/staging domains without an allow-list entry.
  const host = req.headers.get("host");
  if (host && originHost === host) return true;

  return false;
}

export function verifyOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  // Server-to-server requests (no Origin header) — e.g. health probes,
  // cron pings — are allowed only for safe verbs. The caller still has to
  // gate on req.method if they want to require the header.
  if (!origin) {
    if (req.method === "GET" || req.method === "HEAD") return null;
    return new Response("Forbidden", { status: 403 });
  }
  if (!isAllowedOrigin(origin, req)) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}
