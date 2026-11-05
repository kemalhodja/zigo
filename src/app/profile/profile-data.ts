import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getChildProfiles } from "@/lib/domain/children";
import {
  getCurrentProfile,
  getUserInterestAreaNames,
  type UserProfile,
} from "@/lib/domain/profiles";
import {
  getProfileSocialStats,
  getSavedSocialPosts,
  getSuggestedCreators,
  getUserSocialPosts,
  getUserSocialReels,
  type ProfileSocialStats,
  type SuggestedCreator,
} from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import type { SocialPostRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProfileSuggestedCreator = {
  id?: string;
  name: string;
  handle: string;
  area: string;
  href: string;
  isFollowing?: boolean;
};

export type ProfileDataResult = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  role: UserProfile["role"] | "guest";
  organization_type: string | null;
  isVerified: boolean;
  branches: string[];
  stats: ProfileSocialStats;
  posts: { id: string; label: string; href: string; mediaUrl: string | null; mediaType: string }[];
  suggestedCreators: ProfileSuggestedCreator[];
  isPreview: boolean;
  isSignedOut: boolean;
  avatarUrl: string | null;
  cover_url: string | null;
  userCreatedAt?: string | undefined;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  childrenCount: number;
  city?: string | null;
  district?: string | null;
  grade_level?: string | null;
};

const demoSuggestedCreators = [
  { id: undefined, name: "Aylin", handle: "aylinmath", area: "Math", href: "/explore?format=teachers" },
  { id: undefined, name: "Mert", handle: "mertlab", area: "Science", href: "/explore?format=teachers" },
  { id: undefined, name: "Code Club", handle: "codeclub", area: "Coding", href: "/explore?format=teachers" },
] as const;

function allowDemoContent(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_DEMO === "true";
}

export async function getProfileData(
  activeTab: "posts" | "reels" | "saved" | "market" | "agenda",
): Promise<ProfileDataResult> {
  const signedOutMessages = await getServerMessages();
  const pf = signedOutMessages.profile;
  const demo = signedOutMessages.demo;
  const roles = signedOutMessages.roles;

  const fallback: ProfileDataResult = {
    id: "demo-creator",
    name: pf.fallbackCreatorName,
    handle: "zigocreator",
    bio: pf.fallbackCreatorBio,
    role: "teacher" as UserProfile["role"] | "guest",
    organization_type: "egitim_platformu" as string | null,
    isVerified: true,
    branches: ["LGS Matematik", "5-8. Sınıf Fen Bilimleri"],
    stats: { posts: 48, followers: 18200, following: 214 },
    posts: [
      demo.areaMath,
      demo.areaScience,
      demo.areaCoding,
      demo.badgePost,
      signedOutMessages.zigo.spark,
      roles.parent,
      demo.badgeMicro,
      demo.areaEnglish,
    ].map((item) => ({
      id: item,
      label: item,
      href: "/micro",
      mediaUrl: null,
      mediaType: "image",
    })),
    suggestedCreators: demoSuggestedCreators.map((creator) => ({
      ...creator,
      isFollowing: false,
    })),
    isPreview: true,
    isSignedOut: false,
    avatarUrl: null,
    cover_url: null,
    userCreatedAt: undefined,
    website_url: null,
    youtube_url: null,
    instagram_url: null,
    childrenCount: 2,
    city: null,
    district: null,
    grade_level: null,
  };

  if (!hasSupabaseEnv()) {
    if (allowDemoContent()) return fallback;
    return getSignedOutFallback();
  }

  const previewFallback: ProfileDataResult = allowDemoContent()
    ? fallback
    : await getSignedOutFallback();

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return getSignedOutFallback();
    }

    const [stats, posts, suggested, branches, children] = await Promise.all([
      getProfileSocialStats(supabase, profile.id),
      getProfileGridPosts(
        supabase,
        profile.id,
        activeTab === "market" || activeTab === "agenda" ? "posts" : activeTab,
      ),
      getProfileSuggestedCreators(supabase, profile.id),
      profile.role === "teacher" ? getUserInterestAreaNames(supabase, profile.id) : Promise.resolve([]),
      profile.role === "parent" ? getChildProfiles(supabase).catch(() => []) : Promise.resolve([]),
    ]);

    return {
      ...toProfileData(profile, stats, posts, branches),
      suggestedCreators: suggested,
      childrenCount: children.length,
    };
  }, previewFallback);
}

async function getSignedOutFallback(): Promise<ProfileDataResult> {
  const signedOutMessages = await getServerMessages();
  return {
    id: "signin",
    name: signedOutMessages.common.signIn,
    handle: "signin",
    bio: signedOutMessages.profile.signInDesc,
    role: "guest" as UserProfile["role"] | "guest",
    organization_type: null,
    isVerified: false,
    branches: [],
    stats: { posts: 0, followers: 0, following: 0 },
    posts: [],
    suggestedCreators: [],
    isPreview: false,
    isSignedOut: true,
    avatarUrl: null,
    cover_url: null,
    userCreatedAt: undefined,
    website_url: null,
    youtube_url: null,
    instagram_url: null,
    childrenCount: 0,
    city: null,
    district: null,
    grade_level: null,
  };
}

async function getProfileSuggestedCreators(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ProfileSuggestedCreator[]> {
  try {
    const creators = await getSuggestedCreators(supabase, userId, 6);
    if (creators.length === 0) {
      return [];
    }
    return mapSuggestedCreators(creators);
  } catch {
    return [];
  }
}

function mapSuggestedCreators(creators: SuggestedCreator[]): ProfileSuggestedCreator[] {
  return creators.map((creator) => ({
    id: creator.id,
    name: creator.full_name,
    handle: creator.full_name.toLowerCase().replaceAll(" ", ""),
    area: creator.area_name,
    href: `/profile/${creator.id}`,
    isFollowing: creator.is_following,
  }));
}

function getProfileGridPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activeTab: "posts" | "reels" | "saved",
) {
  if (activeTab === "reels") return getUserSocialReels(supabase, userId);
  if (activeTab === "saved") return getSavedSocialPosts(supabase, userId);
  return getUserSocialPosts(supabase, userId);
}

function toProfileData(
  profile: UserProfile,
  stats: ProfileSocialStats,
  posts: Pick<SocialPostRow, "id" | "caption" | "media_url" | "media_type">[],
  branches: string[],
): Omit<ProfileDataResult, "suggestedCreators" | "childrenCount"> {
  return {
    id: profile.id,
    name: profile.full_name,
    handle: profile.full_name.toLowerCase().replaceAll(" ", ""),
    bio: profile.bio || "",
    role: profile.role as UserProfile["role"] | "guest",
    organization_type: profile.organization_type as string | null,
    isVerified: profile.is_verified,
    branches,
    stats,
    posts:
      posts.length > 0
        ? posts.map((post) => {
            let parsedMediaUrl = post.media_url;
            if (post.media_type === "carousel" && post.media_url) {
              try {
                const urls = JSON.parse(post.media_url);
                if (Array.isArray(urls) && urls.length > 0) {
                  parsedMediaUrl = urls[0];
                }
              } catch {
                // fallback
              }
            }
            return {
              id: post.id,
              label: post.caption.slice(0, 28) || "Post",
              href: post.media_type === "video" ? `/micro?reelId=${post.id}` : `/post/${post.id}`,
              mediaUrl: parsedMediaUrl,
              mediaType: post.media_type,
            };
          })
        : [],
    isPreview: false,
    isSignedOut: false,
    avatarUrl: profile.avatar_url || null,
    cover_url: (profile as unknown as { cover_url?: string | null }).cover_url ?? null,
    userCreatedAt: profile.created_at ?? undefined,
    website_url: (profile as unknown as { website_url?: string | null }).website_url ?? null,
    youtube_url: (profile as unknown as { youtube_url?: string | null }).youtube_url ?? null,
    instagram_url: (profile as unknown as { instagram_url?: string | null }).instagram_url ?? null,
    city: (profile as unknown as { city?: string | null }).city ?? null,
    district: (profile as unknown as { district?: string | null }).district ?? null,
    grade_level: (profile as unknown as { grade_level?: string | null }).grade_level ?? null,
  };
}
