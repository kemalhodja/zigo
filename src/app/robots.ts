import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.zigo.com.tr";
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/lgs-puan-hesaplama",
          "/yks-puan-hesaplama",
          "/exams",
          "/explore",
          "/learn",
          "/questions",
          "/duels",
          "/games",
          "/areas/",
          "/share/learning",
          "/about",
          "/pricing",
          "/help",
          "/legal/",
        ],
        disallow: [
          "/api/",
          "/admin",
          "/setup",
          "/moderation",
          "/auth/",
          "/billing/",
          "/notifications",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/lgs-puan-hesaplama",
          "/yks-puan-hesaplama",
          "/exams",
          "/explore",
          "/learn",
          "/questions",
          "/duels",
          "/games",
          "/areas/",
          "/about",
          "/pricing",
        ],
        disallow: [
          "/api/",
          "/admin",
          "/setup",
          "/moderation",
          "/auth/",
          "/billing/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
