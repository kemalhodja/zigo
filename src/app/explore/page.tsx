import Link from "next/link";

import { SocialAvatar } from "@/components/social-primitives";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  getMatchedTeachers,
  getSuggestedCreators,
  searchCreators,
  searchSocialPosts,
  type SocialFeedPost,
} from "@/lib/domain/social";
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
  const query = params.q ?? "";
  const activeFormat = getExploreFormat(params.format);
  const { posts, suggestedRail, creators } = await getExploreResults(query, activeFormat);
  const filteredPosts = filterExploreTiles(posts, activeFormat);
  const tilesToRender = filteredPosts;

  let viewerRole: "teacher" | "parent" | "student" | "guest" = "guest";
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      if (profile?.role) viewerRole = profile.role;
    } catch {
      viewerRole = "guest";
    }
  }

  return (
    <div className="space-y-0 pb-3">
      {/* Search bar */}
      <section className="sticky top-[3.45rem] z-10 -mx-4 border-b border-slate-100 bg-white/95 px-4 pb-2.5 pt-2 backdrop-blur">
        <form action="/explore" className="relative">
          <svg aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            className="block w-full rounded-lg bg-slate-100 px-9 py-2.5 text-sm font-bold text-night outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-slate-200"
            defaultValue={query}
            name="q"
            placeholder={viewerRole === "teacher" ? e.teacherSearchPlaceholder : e.searchPlaceholder}
          />
        </form>
      </section>

      {/* Format filter tabs */}
      <section className="-mx-4 border-b border-slate-100 bg-white">
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2">
          {EXPLORE_FORMATS.map((format) => (
            <Link
              className={`tap-scale whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-black transition ${
                activeFormat === format
                  ? "border-crystal bg-crystal/10 text-crystal"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
              href={getExploreHref({ format, query })}
              key={format}
            >
              {format === "all" ? e.allLabel ?? "Hepsi"
                : format === "micro" ? e.microLabel ?? "Micro"
                : format === "lessons" ? e.lessonsLabel ?? "Dersler"
                : e.teachersLabel ?? "Öğretmenler"}
            </Link>
          ))}
        </div>
      </section>

      {/* Suggested creators rail */}
      {suggestedRail.length > 0 && !query.trim() ? (
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">{e.suggestedCreators ?? "Önerilen Yaratıcılar"}</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {suggestedRail.map((creator) => (
              <Link
                className="tap-scale flex flex-col items-center gap-1.5"
                href={creator.href}
                key={creator.id ?? creator.handle}
              >
                <SocialAvatar
                  className={`size-16 text-lg ring-2 ring-offset-2 ${creator.isFollowing ? "ring-emerald-400" : "ring-crystal"}`}
                  label={creator.handle}
                />
                <span className="max-w-16 truncate text-[0.62rem] font-black text-night">@{creator.handle}</span>
                <span className="max-w-16 truncate text-[0.55rem] font-bold text-slate-500">{creator.label}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
                label={creator.full_name}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-night">{creator.full_name}</p>
                <p className="text-xs font-bold text-slate-500">
                  {creator.role === "teacher" ? "Öğretmen" : creator.role}
                  {creator.is_verified ? " · ✓ Doğrulanmış" : ""}
                </p>
              </div>
              <svg aria-hidden="true" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </section>
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
};

type ExploreResults = {
  creators: Awaited<ReturnType<typeof searchCreators>>;
  posts: ReturnType<typeof toExploreTile>[];
  suggestedRail: ExploreRailCreator[];
};

async function getExploreResults(query: string, format: ExploreFormat): Promise<ExploreResults> {
  const empty: ExploreResults = { creators: [], posts: [], suggestedRail: [] };
  if (!hasSupabaseEnv()) return empty;

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const trimmedQuery = query.trim();
  const [creatorRows, posts, suggested] = await Promise.all([
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
            })))
        : Promise.resolve([]),
    searchSocialPosts(supabase, query, profile?.id),
    getSuggestedCreators(supabase, profile?.id, 4),
  ]);

  return {
    creators: creatorRows,
    posts: posts.map(toExploreTile),
    suggestedRail: suggested.map((creator, index) => ({
      id: creator.id,
      handle: creator.full_name.toLowerCase().replaceAll(" ", ""),
      label: creator.area_name,
      href: `/profile/${creator.id}`,
      accent: creatorAccents[index % creatorAccents.length],
      isFollowing: creator.is_following,
    })),
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
    href: `/post/${post.id}`,
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
  if (query.trim()) search.set("q", query.trim());
  if (format !== "all") search.set("format", format);
  const suffix = search.toString();
  return suffix ? `/explore?${suffix}` : "/explore";
}
