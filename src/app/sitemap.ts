import type { MetadataRoute } from "next";

import { hasSupabaseEnv } from "@/lib/config";
import { slugifyEducationArea } from "@/lib/domain/education-area-slug";
import { getEducationAreas } from "@/lib/domain/profiles";
import { INDEXABLE_CREATOR_ROLES, SITE_URL } from "@/lib/domain/seo-indexing";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/lgs-puan-hesaplama`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.98,
    },
    {
      url: `${base}/yks-puan-hesaplama`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.98,
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

  const db = (hasServiceRoleEnv() ? createAdminClient() : null) ?? (await createClient());

  let areaRoutes: MetadataRoute.Sitemap = [];
  try {
    const areas = await getEducationAreas(db);
    areaRoutes = areas.slice(0, 120).map((area) => ({
      url: `${base}/areas/${slugifyEducationArea(area.area_name)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    areaRoutes = [];
  }

  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const creatorRoles = [...INDEXABLE_CREATOR_ROLES];
    let { data, error } = await db
      .from("users")
      .select("id, created_at")
      .in("role", creatorRoles)
      .eq("account_status", "active")
      .or("is_private.is.null,is_private.eq.false")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      const retry = await db
        .from("users")
        .select("id, created_at")
        .in("role", creatorRoles)
        .eq("account_status", "active")
        .order("created_at", { ascending: false })
        .limit(2000);
      data = retry.data;
      error = retry.error;
    }

    if (!error && Array.isArray(data)) {
      profileRoutes = (data as unknown as Array<{ id: string; created_at: string | null }>).map(
        (user) => ({
          url: `${base}/profile/${user.id}`,
          lastModified: user.created_at ? new Date(user.created_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }),
      );
    }
  } catch {
    profileRoutes = [];
  }

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const creatorRoles = [...INDEXABLE_CREATOR_ROLES];
    const { data, error } = await db
      .from("social_posts")
      .select("id, created_at, author:users!author_id!inner(role)")
      .eq("followers_only", false)
      .eq("is_discoverable", true)
      .in("author.role", creatorRoles)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (!error && Array.isArray(data)) {
      postRoutes = (data as unknown as Array<{ id: string; created_at: string | null }>).map(
        (post) => ({
          url: `${base}/post/${post.id}`,
          lastModified: post.created_at ? new Date(post.created_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }),
      );
    }
  } catch {
    postRoutes = [];
  }

  return [...staticRoutes, ...areaRoutes, ...profileRoutes, ...postRoutes];
}
