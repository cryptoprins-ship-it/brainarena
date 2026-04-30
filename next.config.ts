import type { NextConfig } from "next";

// CSP for BrainArena — pure puzzle/word-game frontend. No external AI APIs.
// AdSense is the only third-party script we serve; Plausible is permitted
// for future analytics. If you later add Gemini/Anthropic/Supabase, extend
// connect-src/script-src here, NOT in component-level <Script> overrides.
const csp = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval' are required by Next.js' inline runtime
  // chunks and AdSense's loader. Keep until we adopt strict-dynamic + nonces.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://plausible.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 'data:' for inline SVG flags + favicon, 'blob:' for in-memory canvases,
  // 'https:' for AdSense ad-creative imagery.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://plausible.io https://*.googlesyndication.com https://*.doubleclick.net",
  "frame-src https://*.googlesyndication.com https://*.doubleclick.net",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // No source maps in production — keeps stack traces from leaking server
  // file paths and internal module structure to attackers.
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
