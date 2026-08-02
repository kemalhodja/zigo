import type { MetadataRoute } from "next";

import { hasSupabaseEnv } from "@/lib/config";
import { slugifyEducationArea } from "@/lib/domain/education-area-slug";
import { getEducationAreas } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://zigo.app";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/auth`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/share/learning`, changeFrequency: "weekly", priority: 0.4 },
  ];

  if (!hasSupabaseEnv()) {
    return [
      ...staticRoutes,
      { url: `${base}/areas/lgs-matematik`, changeFrequency: "weekly", priority: 0.6 },
    ];
  }

  try {
    const supabase = await createClient();
    const areas = await getEducationAreas(supabase);
    const areaRoutes = areas.slice(0, 120).map((area) => ({
      url: `${base}/areas/${slugifyEducationArea(area.area_name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    return [...staticRoutes, ...areaRoutes];
  } catch {
    return staticRoutes;
  }
}
