import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Individual file pages are ephemeral (auto-expiring, non-canonical
        // content) and shouldn't be crawled/indexed on a per-URL basis.
        // /dashboard is the admin login + dashboard, gated by its own
        // per-page "noindex" metadata already, but disallowed here too so
        // crawlers don't even fetch it.
        disallow: ["/files/", "/dashboard"]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
