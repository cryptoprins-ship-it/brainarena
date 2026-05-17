import HomeClient from "./HomeClient";

// Force the homepage to render on every request instead of being baked
// at build time. Hostinger's CDN held onto the prerendered HTML for
// 4+ hours after deploys (the default Next.js `s-maxage=31536000` is a
// year) so freshly-shipped game cards didn't appear until the cache
// expired or got purged. A tiny perf cost here is fine at our traffic.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeClient />;
}
