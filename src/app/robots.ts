import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://zigo.app";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/areas/", "/explore", "/share/learning", "/about", "/pricing", "/help", "/legal/"],
      disallow: ["/api/", "/admin", "/setup", "/moderation", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
