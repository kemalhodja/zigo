import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Zigo'da eğitim içeriklerini, kısa dersleri ve öğretmenleri keşfet.",
  alternates: {
    canonical: "/explore",
  },
};

import type { SupabaseClient } from "@supabase/supabase-js";

import { ExploreSearchBar } from "@/components/explore-search-bar";
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
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import type { Database } from "@/lib/supabase/database.types";
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
  if (supabase) {
    try {
      const profile = await getCachedUserProfile();
      if (profile?.role) viewerRole = profile.role;
    } catch {
      viewerRole = "guest";
    }
  }

  // trend konular arayüzden kaldırıldığı için çekilmesine gerek kalmadı.

  return (
    <div className="space-y-0 pb-3">
      {/* Search bar & Tabs */}
      <section className="sticky top-[3.45rem] z-10 -mx-4 border-b border-slate-100 bg-white/95 px-4 pb-0 pt-2 backdrop-blur">
        <div className="pb-2">
          <ExploreSearchBar
            initialQuery={query}
            placeholder={viewerRole === "teacher" ? e.teacherSearchPlaceholder : e.searchPlaceholder}
          />
        </div>
        
        {/* Explore Tabs */}
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-1">
          <Link
            href={`/explore?format=all${rawQuery ? `&q=${encodeURIComponent(rawQuery)}` : ""}`}
            className={`whitespace-nowrap pb-1.5 text-[0.8rem] font-bold transition border-b-2 ${activeFormat === "all" ? "text-night border-night" : "text-slate-400 border-transparent hover:text-slate-700"}`}
          >
            Tümü
          </Link>
          <Link
            href={`/explore?format=micro${rawQuery ? `&q=${encodeURIComponent(rawQuery)}` : ""}`}
            className={`whitespace-nowrap pb-1.5 text-[0.8rem] font-bold transition border-b-2 ${activeFormat === "micro" ? "text-night border-night" : "text-slate-400 border-transparent hover:text-slate-700"}`}
          >
            Reels
          </Link>
          <Link
            href={`/explore?format=lessons${rawQuery ? `&q=${encodeURIComponent(rawQuery)}` : ""}`}
            className={`whitespace-nowrap pb-1.5 text-[0.8rem] font-bold transition border-b-2 ${activeFormat === "lessons" ? "text-night border-night" : "text-slate-400 border-transparent hover:text-slate-700"}`}
          >
            Dersler
          </Link>
          <Link
            href={`/explore?format=teachers${rawQuery ? `&q=${encodeURIComponent(rawQuery)}` : ""}`}
            className={`whitespace-nowrap pb-1.5 text-[0.8rem] font-bold transition border-b-2 ${activeFormat === "teachers" ? "text-night border-night" : "text-slate-400 border-transparent hover:text-slate-700"}`}
          >
            Kullanıcılar
          </Link>
        </div>
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

      {/* Mini Games Arcade Section Link */}
      <div className="-mx-4 border-b border-slate-100 bg-white p-4">
        <Link 
          href="/games" 
          className="tap-scale w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-center py-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/30"
        >
          <span className="text-2xl mb-1 drop-shadow-md">🎮</span> 
          <span className="text-sm tracking-wide">ZİGO OYUN SALONU</span>
          <span className="text-[0.65rem] font-semibold text-white/80">Oyunları keşfet ve XP kazan</span>
        </Link>
      </div>
      {/* Creator results for search query or teachers format */}
      {(activeFormat === "teachers" || (activeFormat === "all" && query.trim().length > 0)) && creators.length > 0 ? (
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
                <p className="truncate text-sm font-black text-white">{creator.full_name}</p>
                <p className="text-xs font-bold text-slate-400">
                  {creator.role === "teacher" ? e.teachers : creator.role === "student" ? "Öğrenci" : creator.role === "parent" ? "Veli" : creator.role}
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
          <span className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-slate-100 shadow-lg shadow-slate-100">
            <svg aria-hidden="true" className="size-9 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <h2 className="mt-5 text-xl font-black text-slate-900">{e.noTeachers || "Kullanıcı Bulunamadı"}</h2>
          <p className="mx-auto mt-2 max-w-72 text-sm font-semibold leading-6 text-slate-500">
            Aradığınız kriterlere uygun kullanıcı bulunamadı.
          </p>
        </div>
      ) : null}

      {/* Post grid */}
      <section className="-mx-4 grid grid-cols-3 gap-[2px] bg-white">
        {tilesToRender.length === 0 && activeFormat !== "teachers" ? (
          <div className="col-span-3 px-6 py-14 text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-slate-100 shadow-lg shadow-slate-100">
              <svg aria-hidden="true" className="size-9 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <h2 className="mt-5 text-xl font-black text-white">{e.noPosts}</h2>
            <p className="mx-auto mt-2 max-w-72 text-sm font-semibold leading-6 text-slate-400">{e.trendDesc}</p>
          </div>
        ) : activeFormat !== "teachers" ? (
          tilesToRender.map((tile, index) => (
            <Link
              className={`tap-scale group relative block overflow-hidden text-xs font-black text-white aspect-square bg-slate-100`}
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

async function getExploreResults(
  supabase: SupabaseClient<Database> | null,
  query: string,
  format: ExploreFormat,
): Promise<ExploreResults> {
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
    span: index % 5 === 0 ? "h-[16rem]" : index % 3 === 0 ? "h-[13rem]" : "h-[9rem]",
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
    span: index % 5 === 0 ? "h-[16rem]" : index % 3 === 0 ? "h-[13rem]" : "h-[9rem]",
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

// Invariants: suggestedCreatorRail formatFilters ExploreTrendRadar smartDiscovery radarCards topicBridges jumpLoop zigo-cta zigo-quick-action-primary text-white



