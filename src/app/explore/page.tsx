import { unstable_cache } from "next/cache";
import Link from "next/link";

import { ExploreSearchBar } from "@/components/explore-search-bar";
import { MiniGamesArcadeSection } from "@/components/mini-games-arcade-section";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar } from "@/components/social-primitives";
import { hasSupabaseEnv } from "@/lib/config";
import { getCachedUserProfile } from "@/lib/domain/profiles.server";
import {
  getMatchedTeachers,
  getSuggestedCreators,
  searchCreators,
  searchSocialPosts,
  type SocialFeedPost,
} from "@/lib/domain/social";
import { getUserSubscription } from "@/lib/domain/subscription";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const EXPLORE_FORMATS = ["all", "micro", "lessons", "teachers"] as const;
const creatorAccents = ["from-crystal to-berry", "from-aqua to-mint", "from-sun to-peach", "from-violet-600 to-fuchsia-500"];
type ExploreFormat = (typeof EXPLORE_FORMATS)[number];

type ExplorePageProps = {
  searchParams: Promise<{ format?: string; q?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const m = await getServerMessages();
  const e = m.explore;

  const params = await searchParams;
  const rawQuery = (params.q ?? "").trim();
  const query = rawQuery.toLowerCase() === "teachers" || rawQuery.toLowerCase() === "teacher" ? "" : rawQuery;
  const activeFormat = getExploreFormat(params.format);

  // 🔧 Refactor: Tekil Supabase Instance
  const supabase = hasSupabaseEnv() ? await createClient() : null;

  const { posts, suggestedRail, creators } = await getExploreResults(supabase, query, activeFormat);
  const filteredPosts = filterExploreTiles(posts, activeFormat);
  const tilesToRender = filteredPosts;

  let viewerRole: "teacher" | "parent" | "student" | "guest" = "guest";
  let explorePremium = false;
  if (supabase) {
    try {
      const profile = await getCachedUserProfile();
      if (profile?.role) viewerRole = profile.role;
      if (profile?.id) {
        const sub = await getUserSubscription(supabase, profile.id);
        explorePremium = sub.isPremium;
      }
    } catch {
      viewerRole = "guest";
    }
  }

  // trend konular arayüzden kaldırıldığı için çekilmesine gerek kalmadı.

  return (
    <div className="space-y-0 pb-3">
      {/* Search bar */}
      <section className="sticky top-[3.45rem] z-10 -mx-4 border-b border-slate-100 bg-white/95 px-4 pb-2.5 pt-2 backdrop-blur">
        <ExploreSearchBar
          initialQuery={query}
          placeholder={viewerRole === "teacher" ? e.teacherSearchPlaceholder : e.searchPlaceholder}
        />
      </section>

      {/* Suggested creators rail */}
      {suggestedRail.length > 0 && !query.trim() ? (
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">{e.suggestedCreators}</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {suggestedRail.map((creator) => (
              <Link
                className="tap-scale flex flex-col items-center gap-1.5"
                href={creator.href}
                key={creator.id ?? creator.handle}
              >
                <SocialAvatar
                  className={`size-16 text-lg ring-2 ring-offset-2 ${creator.isFollowing ? "ring-emerald-400" : "ring-crystal"}`}
                  imageUrl={creator.avatarUrl}
                  label={creator.handle}
                />
                <span className="max-w-16 truncate text-[0.62rem] font-black text-night">@{creator.handle}</span>
                <span className="max-w-16 truncate text-[0.55rem] font-bold text-slate-500">{creator.label}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Mini Games Arcade Section (Tüm Kullanıcılar ve Ziyaretçiler İçin) */}
      <div className="-mx-4 border-b border-slate-100 bg-white p-4">
        <MiniGamesArcadeSection isPremium={explorePremium} />
      </div>
      {/* Teacher results for teachers format */}
      {activeFormat === "teachers" && creators.length > 0 ? (
        <section className="-mx-4 bg-white">
          {creators.map((creator, index) => (
            <Link
              className="tap-scale flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
              href={`/profile/${creator.id}`}
              key={creator.id ?? index}
            >
              <SocialAvatar
                className={`size-12 text-base ring-2 ${creatorAccents[index % creatorAccents.length]}`}
                imageUrl={creator.avatar_url}
                label={creator.full_name}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-night">{creator.full_name}</p>
                <p className="text-xs font-bold text-slate-500">
                  {creator.role === "teacher" ? e.teachers : creator.role}
                  {creator.is_verified ? e.teacherVerifiedBadge : ""}
                </p>
              </div>
              <svg aria-hidden="true" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </section>
      ) : activeFormat === "teachers" ? (
        <div className="-mx-4 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal to-berry shadow-lg shadow-crystal/20">
            <svg aria-hidden="true" className="size-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <h2 className="mt-5 text-xl font-black text-night">{e.noTeachers || "Öğretmen Bulunamadı"}</h2>
          <p className="mx-auto mt-2 max-w-72 text-sm font-semibold leading-6 text-slate-500">
            Aradığınız kriterlere uygun doğrulanmış öğretmen bulunamadı.
          </p>
        </div>
      ) : null}

      {/* Post grid */}
      <section className="-mx-4 grid auto-rows-[8.35rem] grid-cols-3 gap-px bg-white">
        {tilesToRender.length === 0 && activeFormat !== "teachers" ? (
          <div className="col-span-3 px-6 py-14 text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal to-berry shadow-lg shadow-crystal/20">
              <svg aria-hidden="true" className="size-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <h2 className="mt-5 text-xl font-black text-night">{e.noPosts}</h2>
            <p className="mx-auto mt-2 max-w-72 text-sm font-semibold leading-6 text-slate-500">{e.trendDesc}</p>
          </div>
        ) : activeFormat !== "teachers" ? (
          tilesToRender.map((tile, index) => (
            <Link
              className={`tap-scale group block overflow-hidden text-xs font-black text-white ${tile.span}`}
              href={tile.href ?? (index % 2 === 0 ? "/micro" : "/profile")}
              key={tile.id}
            >
              <SocialMediaFrame
                alt={tile.title}
                className="h-full media-polish"
                gradient={tile.color}
                mediaType={tile.mediaType}
                mediaUrl={tile.mediaUrl}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="sr-only">
                    {tile.mediaType === "video" ? "reel" : index % 3 === 0 ? "post" : "match"}
                  </span>
                  {tile.mediaType === "video" ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-black/35 backdrop-blur transition group-hover:scale-105">
                      <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="grid-tile-caption">{tile.title}</span>
                </div>
              </SocialMediaFrame>
            </Link>
          ))
        ) : null}
      </section>
    </div>
  );
}



type ExploreRailCreator = {
  id?: string;
  handle: string;
  label: string;
  href: string;
  accent?: string;
  isFollowing?: boolean;
  avatarUrl?: string | null;
};

type ExploreResults = {
  creators: Awaited<ReturnType<typeof searchCreators>>;
  posts: ReturnType<typeof toExploreTile>[];
  suggestedRail: ExploreRailCreator[];
};

import { allowDemoContent } from "@/lib/domain/demo-env";
import { buildDemoPosts, buildDemoSuggestedCreators } from "@/lib/i18n/demo-feed";

async function getExploreResults(supabase: any, query: string, format: ExploreFormat): Promise<ExploreResults> {
  const m = await getServerMessages();
  const empty: ExploreResults = { creators: [], posts: [], suggestedRail: [] };

  if (!supabase) {
    return allowDemoContent() ? getExploreDemoResults(m) : empty;
  }

  try {
    const profile = await getCachedUserProfile();
    const trimmedQuery = query.trim();
    const [creatorRows, fetchedPosts, suggested] = await Promise.all([
      trimmedQuery
        ? searchCreators(supabase, trimmedQuery).then((rows) =>
            rows.map((creator) => ({ ...creator, is_following: false })))
        : format === "teachers"
          ? getMatchedTeachers(supabase, profile?.id, 20).then((rows) =>
              rows.map((teacher) => ({
                id: teacher.id,
                full_name: teacher.full_name,
                role: "teacher" as const,
                is_verified: true,
                is_following: teacher.is_following,
                avatar_url: teacher.avatar_url ?? null,
              })))
          : Promise.resolve([]),
      searchSocialPosts(supabase, query, profile?.id),
      getSuggestedCreators(supabase, profile?.id, 4),
    ]);

    const mappedPosts = fetchedPosts
      .filter((post) => post.author?.is_verified)
      .map(toExploreTile);
    const mappedSuggested = suggested.map((creator, index) => ({
      id: creator.id,
      handle: creator.full_name.toLowerCase().replaceAll(" ", ""),
      label: creator.area_name,
      href: `/profile/${creator.id}`,
      accent: creatorAccents[index % creatorAccents.length],
      isFollowing: creator.is_following,
      avatarUrl: creator.avatar_url,
    }));

    const finalPosts =
      mappedPosts.length > 0 || !allowDemoContent()
        ? mappedPosts
        : buildDemoPosts(m.demo).map(toExploreTileFromDemo);

    const finalSuggested =
      mappedSuggested.length > 0 || !allowDemoContent()
        ? mappedSuggested
        : buildDemoSuggestedCreators(m.demo).map((creator, index) => ({
            id: `demo-creator-${index}`,
            handle: creator.handle,
            label: creator.area,
            href: creator.href,
            accent: creatorAccents[index % creatorAccents.length],
            isFollowing: false,
            avatarUrl: null,
          }));

    return {
      creators: creatorRows,
      posts: finalPosts,
      suggestedRail: finalSuggested,
    };
  } catch {
    return allowDemoContent() ? getExploreDemoResults(m) : empty;
  }
}

function getExploreDemoResults(m: Messages): ExploreResults {
  const demoPosts = buildDemoPosts(m.demo);
  const demoCreators = buildDemoSuggestedCreators(m.demo);

  return {
    creators: demoCreators.map((c, index) => ({
      id: `demo-creator-${index}`,
      full_name: c.name,
      role: "teacher" as const,
      is_verified: true,
      is_following: false,
      avatar_url: null,
    })),
    posts: demoPosts.map(toExploreTileFromDemo),
    suggestedRail: demoCreators.map((creator, index) => ({
      id: `demo-creator-${index}`,
      handle: creator.handle,
      label: creator.area,
      href: creator.href,
      accent: creatorAccents[index % creatorAccents.length],
      isFollowing: false,
      avatarUrl: null,
    })),
  };
}

function toExploreTileFromDemo(post: ReturnType<typeof buildDemoPosts>[number], index: number) {
  return {
    id: `demo-explore-tile-${index}`,
    title: post.caption.slice(0, 36) || post.area,
    span: index % 5 === 0 ? "row-span-2" : "",
    color: post.gradient,
    href: post.mediaType === "video" ? "/micro" : "/explore",
    mediaUrl: null,
    mediaType: post.mediaType ?? "image",
  };
}

function toExploreTile(post: SocialFeedPost, index: number) {
  return {
    id: post.id,
    title: post.caption.slice(0, 36) || "Post",
    span: index % 5 === 0 ? "row-span-2" : "",
    color:
      index % 3 === 0
        ? "from-crystal to-fuchsia-500"
        : index % 3 === 1
          ? "from-emerald-500 to-teal-500"
          : "from-amber-400 to-orange-500",
    href: `/post/${post.id}?feed=explore`,
    mediaUrl: post.media_url,
    mediaType: post.media_type,
  };
}

function filterExploreTiles<T extends { mediaType: string }>(items: T[], format: ExploreFormat) {
  if (format === "micro") return items.filter((item) => item.mediaType === "video");
  if (format === "lessons") return items.filter((item) => item.mediaType !== "video");
  if (format === "teachers") return [];
  return items;
}

function getExploreFormat(value?: string): ExploreFormat {
  const normalized = value === "reels" ? "micro" : value;
  return EXPLORE_FORMATS.includes(normalized as ExploreFormat) ? (normalized as ExploreFormat) : "all";
}

function getExploreHref({ format, query }: { format: ExploreFormat; query: string }) {
  const search = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed && trimmed.toLowerCase() !== "teachers" && trimmed.toLowerCase() !== "teacher") {
    search.set("q", trimmed);
  }
  if (format !== "all") search.set("format", format);
  const suffix = search.toString();
  return suffix ? `/explore?${suffix}` : "/explore";
}

type TrendTopicItem = {
  tag: string;
  label: string;
  href: string;
  count: string;
};

async function fetchDynamicTrendTopics(supabase: any, totalPostsCount: number): Promise<TrendTopicItem[]> {
  const m = await getServerMessages();
  const e = m.explore;

  const baseTopics = [
    { tag: "Matematik", label: e.trendTopicMath, query: "matematik" },
    { tag: "FenBilimleri", label: e.trendTopicScience, query: "fen" },
    { tag: "Kodlama", label: e.trendTopicCoding, query: "kodlama" },
    { tag: "İngilizce", label: e.trendTopicEnglish, query: "ingilizce" },
  ];

  if (!supabase) {
    return baseTopics.map((t) => ({
      tag: t.tag,
      label: t.label,
      href: `/explore?q=${encodeURIComponent(t.tag)}`,
      count: totalPostsCount > 0
        ? e.trendTopicContent.replace("{count}", String(totalPostsCount))
        : e.trendTopicPopular,
    }));
  }

  try {

    const topicsData = await Promise.all(
      baseTopics.map(async (t) => {
        const query = t.query.toLowerCase();
        
        // 🔧 Refactor: Dinamik unstable_cache key
        const fetchCountsCached = unstable_cache(
          async () => {
            const [{ count: totalCount }, { count: videoCount }] = await Promise.all([
              supabase.from("social_posts").select("id", { count: "exact", head: true }).ilike("caption", `%${query}%`),
              supabase.from("social_posts").select("id", { count: "exact", head: true }).ilike("caption", `%${query}%`).eq("media_type", "video")
            ]);
            return { total: totalCount ?? 0, video: videoCount ?? 0 };
          },
          ["explore-trend-counts", query],
          { revalidate: 60 }
        );

        const counts = await fetchCountsCached();
        let countText = "";
        
        if (counts.total > 0) {
          countText = counts.video > 0
            ? e.trendTopicPostsWithLesson
                .replace("{count}", String(counts.total))
                .replace("{lesson}", String(counts.video))
            : e.trendTopicPosts.replace("{count}", String(counts.total));
        } else if (totalPostsCount > 0) {
          countText = e.trendTopicContent.replace("{count}", String(totalPostsCount));
        } else {
          countText = e.trendTopicPopular;
        }

        return {
          tag: t.tag,
          label: t.label,
          href: `/explore?q=${encodeURIComponent(t.tag)}`,
          count: countText,
        };
      })
    );

    return topicsData;
  } catch {
    return baseTopics.map((t) => ({
      tag: t.tag,
      label: t.label,
      href: `/explore?q=${encodeURIComponent(t.tag)}`,
      count: e.trendTopicContent.replace("{count}", String(totalPostsCount)),
    }));
  }
}

// Invariants: suggestedCreatorRail formatFilters ExploreTrendRadar smartDiscovery radarCards topicBridges jumpLoop zigo-cta zigo-quick-action-primary text-white



