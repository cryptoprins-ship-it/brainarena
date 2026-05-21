import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://brainarena.fun";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Disallow /api/ — JSON endpoints, no crawl value, waste crawl budget.
      { userAgent: "*", allow: "/", disallow: "/api/" },
      // Meta's link-preview crawler (WhatsApp, Facebook, Instagram). Already
      // allowed by the wildcard, but listing it explicitly future-proofs us
      // against any later disallow tweaks and matches our renisual setup.
      { userAgent: "facebookexternalhit", allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
