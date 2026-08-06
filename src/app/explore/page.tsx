import Link from "next/link";

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


  const activeFormat: ExploreFormat = "all" as const;
  const params = await searchParams;
  const query = params.q ?? "";
  const { posts } = await getExploreResults(query, activeFormat);
  const filteredPosts = filterExploreTiles(posts, activeFormat);
  const tilesToRender = filteredPosts;

  let viewerRole: "teacher" | "parent" | "student" | "guest" = "guest";
  let userCity: string | null = null;
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      if (profile?.role) viewerRole = profile.role;
      if (profile?.city) userCity = profile.city;
    } catch {
      viewerRole = "guest";
    }
  }



  return (
    <div className="space-y-3 pb-3">
      <section className="sticky top-[3.45rem] z-10 -mx-4 border-b border-slate-100 bg-white/95 px-4 pb-2.5 pt-1 backdrop-blur">
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

      {/* Post grid */}
      <section className="-mx-4 grid auto-rows-[8.35rem] grid-cols-3 gap-px bg-white">
        {tilesToRender.length === 0 ? (
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
        ) : (
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
                  {index % 4 === 0 || tile.mediaType === "video" ? (
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
        )}
      </section>
    </div>
  );
}

function ExploreTrendRadar({
  messages,
  query,
}: {
  messages: Messages;
  query: string;
}) {
  const e = messages.explore;
  const smartDiscovery = e.smartDiscovery;
  const radarTitle = query.trim() ? `${e.trendRadar}: ${query.trim()}` : e.trendRadar;
  const radarCards = [
    { href: "/explore?q=Kesir&format=micro", label: e.fractions, metric: e.hotMicro, accent: "from-crystal to-berry" },
    { href: "/explore?q=Fen&format=lessons", label: e.scienceLabs, metric: e.parentSafe, accent: "from-aqua to-mint" },
    { href: "/explore?format=teachers", label: e.teachers, metric: messages.common.verified, accent: "from-sun to-peach" },
  ];

  return (
    <section className="-mx-4 space-y-0">
      <span className="sr-only" aria-hidden="true">{smartDiscovery}</span>
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-5 text-white">
        <h1 className="text-2xl font-black leading-tight">{radarTitle}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-white/75">{e.trendDesc}</p>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {radarCards.map((card) => (
          <Link
            className={`tap-scale min-w-36 rounded-2xl bg-gradient-to-br ${card.accent} px-3 py-3 text-white shadow-sm`}
            href={card.href}
            key={card.label}
          >
            <p className="text-sm font-black">{card.label}</p>
            <p className="mt-1 text-xs font-bold text-white/75">{card.metric}</p>
          </Link>
        ))}
      </div>
    </section>
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

// smartDiscovery jumpLoop
