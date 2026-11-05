import type { MetadataRoute } from "next";

import { hasSupabaseEnv } from "@/lib/config";
import { slugifyEducationArea } from "@/lib/domain/education-area-slug";
import { getEducationAreas } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.zigo.com.tr";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/exams`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/explore`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/learn`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/questions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/duels`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/games`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/share/learning`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${base}/legal/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/kvkk`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  if (!hasSupabaseEnv()) {
    return [
      ...staticRoutes,
      {
        url: `${base}/areas/lgs-matematik`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      },
    ];
  }

  try {
    const supabase = await createClient();
    const areas = await getEducationAreas(supabase);
    const areaRoutes = areas.slice(0, 120).map((area) => ({
      url: `${base}/areas/${slugifyEducationArea(area.area_name)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
    return [...staticRoutes, ...areaRoutes];
  } catch {
    return staticRoutes;
  }
}
