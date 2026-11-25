export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.zigo.com.tr";

export const INDEXABLE_CREATOR_ROLES = [
  "teacher",
  "education_institution",
  "education_platform",
  "publisher",
  "platform",
] as const;

export type IndexableCreatorRole = (typeof INDEXABLE_CREATOR_ROLES)[number];

const INDEXABLE_ROLE_SET = new Set<string>(INDEXABLE_CREATOR_ROLES);

export function isIndexableCreatorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return INDEXABLE_ROLE_SET.has(role);
}

export function isIndexableProfile(p: {
  role?: string | null;
  is_private?: boolean | null;
}): boolean {
  return isIndexableCreatorRole(p.role) && p.is_private !== true;
}

export function isIndexablePost(p: {
  followers_only?: boolean | null;
  is_discoverable?: boolean | null;
  author?: { role?: string | null } | null;
}): boolean {
  if (p.followers_only === true) return false;
  if (p.is_discoverable === false) return false;
  return isIndexableCreatorRole(p.author?.role);
}

export const NOINDEX = { index: false, follow: false } as const;
