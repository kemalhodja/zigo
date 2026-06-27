import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
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

const suggestedCreatorRail = (d: Messages["exploreDemo"]) => [
  { accent: "from-crystal to-berry", handle: "aylinmath", label: d.mathMicro, href: "/micro" },
  { accent: "from-aqua to-mint", handle: "mertlab", label: d.scienceLab, href: "/micro" },
  { accent: "from-sun to-peach", handle: "codeclub", label: d.codingClub, href: "/profile" },
] as const;

function buildExploreDemoTiles(d: Messages["exploreDemo"]) {
  const tiles = [
    { title: d.tileFractions, span: "row-span-2", color: "from-crystal to-fuchsia-500", scene: "math" as const },
    { title: d.tileScienceReel, span: "", color: "from-emerald-500 to-teal-500", scene: "science" as const },
    { title: d.tileCoding, span: "", color: "from-sky-500 to-indigo-500", scene: "coding" as const },
    { title: d.tileParentPicks, span: "col-span-2", color: "from-amber-400 to-orange-500", scene: "profile" as const },
    { title: d.tileDailyQuiz, span: "row-span-2", color: "from-pink-500 to-rose-500", scene: "quiz" as const },
    { title: d.tileCreatorTips, span: "", color: "from-slate-700 to-night", scene: "profile" as const },
    { title: d.tileEnglish, span: "", color: "from-violet-600 to-indigo-500", scene: "english" as const },
    { title: d.tileSafeSocial, span: "", color: "from-mint to-emerald-400", scene: "profile" as const },
  ];
  return tiles.map((tile, index) => ({
    ...tile,
    id: `demo-${index}`,
    href: index % 2 === 0 ? "/micro" : "/profile",
    mediaUrl: null,
    mediaType: index % 3 === 1 ? "video" : "image",
  }));
}

type ExplorePageProps = {
  searchParams: Promise<{ format?: string; q?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const m = await getServerMessages();
  const e = m.explore;
  const demoTiles = buildExploreDemoTiles(m.exploreDemo);
  const categories = [
    { label: e.forYou, query: "" },
    { label: m.zigo.micro, query: "Kısa ders" },
    { label: e.teachers, query: "Öğretmen" },
    { label: e.preschool, query: "Okul Öncesi" },
    { label: e.primaryGrades, query: "1-4. Sınıf" },
    { label: e.middleGrades, query: "5-8. Sınıf" },
    { label: e.highGrades, query: "9-12. Sınıf" },
    { label: e.mathBranch, query: "Matematik" },
    { label: e.scienceBranch, query: "Fen" },
    { label: e.turkishBranch, query: "Türkçe" },
    { label: e.englishBranch, query: "İngilizce" },
    { label: e.codingBranch, query: "Kodlama" },
    { label: e.lgsCoachingBranch, query: "LGS Koçluk" },
    { label: e.yksCoachingBranch, query: "YKS Koçluk" },
    { label: e.guidanceTeacherBranch, query: "Rehber Öğretmen" },
    { label: e.bursulukBranch, query: "Bursluluk" },
    { label: e.studySkillsBranch, query: "Çalışma Teknikleri" },
    { label: e.socialBranch, query: "Sosyal" },
    { label: e.artBranch, query: "Sanat" },
    { label: e.parentCategory, query: "Veli" },
  ];
  const formatFilters = [
    { label: e.allFormats, value: "all" as const },
    { label: m.zigo.micro, value: "micro" as const },
    { label: e.postsFilter, value: "lessons" as const },
    { label: e.teachers, value: "teachers" as const },
  ];
  const params = await searchParams;
  const query = params.q ?? "";
  const activeFormat = getExploreFormat(params.format);
  const { creators, posts, suggestedRail } = await getExploreResults(query, activeFormat);
  const filteredPosts = filterExploreTiles(posts, activeFormat);
  const hasResults = filteredPosts.length > 0;
  const hasQuery = query.trim().length > 0;
  const isPreview = !hasSupabaseEnv() && allowDemoContent();
  const previewTiles = filterExploreTiles(demoTiles, activeFormat);
  const tilesToRender = hasResults ? filteredPosts : hasQuery || activeFormat === "teachers" ? [] : isPreview ? previewTiles : [];
  const showSuggestedCreators = !hasQuery && creators.length === 0 && activeFormat !== "teachers";

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
            placeholder={e.searchPlaceholder}
          />
        </form>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {categories.map((category) => (
            <Link
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                query.toLowerCase() === category.query.toLowerCase() || (!hasQuery && category.query === "")
                  ? "zigo-tab-active-pill"
                  : "zigo-tab-inactive-pill"
              }`}
              href={category.query === "" ? "/explore" : `/explore?q=${encodeURIComponent(category.query)}`}
              key={category.label}
            >
              {category.label}
            </Link>
          ))}
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {formatFilters.map((filter) => (
            <Link
              className={`rounded-full border px-3 py-1.5 text-[0.68rem] font-black ${
                activeFormat === filter.value ? "zigo-tab-active-pill" : "zigo-tab-inactive-pill"
              }`}
              href={getExploreHref({ format: filter.value, query })}
              key={filter.value}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      {hasQuery ? <p className="zigo-body px-0 font-black text-night">{e.matchedResults}: “{query}”</p> : null}

      <ExploreTrendRadar messages={m} query={query} />

      {showSuggestedCreators && (suggestedRail.length > 0 || allowDemoContent()) ? (
        <section className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto border-y border-slate-100 bg-white px-4 py-3">
          {(suggestedRail.length > 0
            ? suggestedRail
            : allowDemoContent()
              ? suggestedCreatorRail(m.exploreDemo).map((creator) => ({ ...creator, id: undefined, isFollowing: false }))
              : []
          ).map((creator, index) => (
            <div className="tap-scale min-w-24 text-center text-night" key={creator.id ?? creator.handle}>
              <Link href={creator.href}>
                <SocialAvatar
                  accent={creator.accent ?? creatorAccents[index % creatorAccents.length]}
                  className="mx-auto size-14 border border-white/25"
                  label={creator.handle}
                />
                <p className="zigo-fit-text mt-1.5 text-xs font-bold">@{creator.handle}</p>
                <p className="zigo-fit-text mt-0.5 text-[0.65rem] font-semibold text-slate-500">{creator.label}</p>
              </Link>
              {creator.id ? (
                <div className="mt-2 flex justify-center">
                  <FollowButton followingId={creator.id} initialFollowing={creator.isFollowing} variant="compact" />
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <ExploreTopicBridges messages={m} />

      {creators.length > 0 || activeFormat === "teachers" ? (
        <section className="-mx-4 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-2.5 text-sm font-black text-night">
            {e.creators} <span className="sr-only">{m.profile.verifiedTeachers}</span>
          </h2>
          <div className="divide-y divide-slate-100">
            {creators.length === 0 && activeFormat === "teachers" ? (
              isPreview ? (
                suggestedCreatorRail(m.exploreDemo).map((creator) => (
                  <article className="flex items-center gap-3 px-4 py-3" key={creator.handle}>
                    <Link className="flex min-w-0 flex-1 items-center gap-3" href={creator.href}>
                      <SocialAvatar className="size-11" label={creator.handle} />
                      <div className="min-w-0">
                        <p className="zigo-fit-text text-sm font-black text-night">@{creator.handle}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">{creator.label}</p>
                      </div>
                    </Link>
                    <div className="w-28">
                      <FollowButton />
                    </div>
                  </article>
                ))
              ) : (
                <p className="px-4 py-6 text-sm font-bold leading-6 text-slate-500">
                  {e.noTeachers}{" "}
                  <Link className="font-black text-crystal" href="/onboarding">
                    {e.pickAreas}
                  </Link>
                </p>
              )
            ) : creators.map((creator) => (
              <article
                className="flex items-center gap-3 px-4 py-3"
                key={creator.id}
              >
                <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/profile/${creator.id}`}>
                  <SocialAvatar className="size-11" label={creator.full_name} />
                  <div className="min-w-0">
                    <p className="zigo-fit-text text-sm font-black text-night">{creator.full_name}</p>
                    <div className="mt-1">
                      <TeacherTrustBadges
                        branches={
                          "area_name" in creator && typeof creator.area_name === "string"
                            ? [creator.area_name]
                            : []
                        }
                        moreLabel={m.teacherBadges.moreAreas}
                        verified={Boolean(creator.is_verified)}
                        verifiedLabel={m.teacherBadges.verifiedTeacher}
                      />
                    </div>
                  </div>
                </Link>
                <div className="w-28">
                  <FollowButton
                    followingId={creator.id}
                    initialFollowing={"is_following" in creator ? Boolean(creator.is_following) : false}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{e.masonry}</p>
          <h2 className="mt-1 text-lg font-black text-night">
            {hasQuery ? e.matchedResults : activeFormat === "all" ? e.title : `${activeFormat} discovery`}
          </h2>
        </div>
        <span className="rounded-lg bg-gradient-to-r from-crystal to-berry px-3 py-2 text-xs font-black text-white">
          {tilesToRender.length} {m.common.posts}
        </span>
      </section>

      <section className="-mx-4 grid auto-rows-[8.35rem] grid-cols-3 gap-px bg-white">
        {tilesToRender.length === 0 ? (
          <div className="col-span-3 px-6 py-14 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg border-2 border-night text-night">
              <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-black text-night">
              {hasQuery ? e.noResults : e.noPosts}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {hasQuery ? e.tryAnother : e.trendDesc}
            </p>
            <Link className="tap-scale mt-5 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href={hasQuery || activeFormat !== "all" ? "/explore" : "/onboarding"}>
              {hasQuery || activeFormat !== "all" ? m.common.clearFilters : e.chooseInterests}
            </Link>
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
                scene={"scene" in tile ? tile.scene : undefined}
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
  const radarTitle = query.trim() ? `${e.trendRadar}: ${query.trim()}` : e.trendRadar;
  const radarCards = [
    { href: "/explore?q=Kesir&format=micro", label: e.fractions, metric: e.hotMicro, accent: "from-crystal to-berry" },
    { href: "/explore?q=Fen&format=lessons", label: e.scienceLabs, metric: e.parentSafe, accent: "from-aqua to-mint" },
    { href: "/explore?format=teachers", label: e.teachers, metric: messages.common.verified, accent: "from-sun to-peach" },
  ];

  return (
    <section className="-mx-4 space-y-0">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{e.smartDiscovery}</p>
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

function ExploreTopicBridges({ messages }: { messages: Messages }) {
  const e = messages.explore;
  const topicBridges = [
    { href: "/explore?q=5-8. Sınıf", label: e.middleGrades, meta: e.stemMeta },
    { href: "/questions", label: e.askTeacher, meta: e.qaMeta },
    { href: "/learn", label: e.learningHub, meta: e.hubMeta },
    { href: "/collections", label: e.savedPosts, meta: e.savedMeta },
  ];

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-night">{e.topicBridges}</h2>
          <p className="mt-0.5 text-xs font-bold text-slate-500">{e.jumpLoop}</p>
        </div>
        <Link className="text-xs font-black text-crystal" href="/onboarding">
          {e.pickAreas}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {topicBridges.map((topic) => (
          <Link
            className="tap-scale min-w-36 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 px-3 py-3"
            href={topic.href}
            key={topic.label}
          >
            <p className="zigo-fit-text text-sm font-black text-night">{topic.label}</p>
            <p className="zigo-fit-text mt-1 text-xs font-bold text-crystal">{topic.meta}</p>
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

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const trimmedQuery = query.trim();
  const [creatorRows, posts, suggested] = await Promise.all([
    trimmedQuery
      ? searchCreators(supabase, trimmedQuery).then((rows) =>
          rows.map((creator) => ({ ...creator, is_following: false })),
        )
      : format === "teachers"
        ? getMatchedTeachers(supabase, profile?.id, 20).then((rows) =>
            rows.map((teacher) => ({
              id: teacher.id,
              full_name: teacher.full_name,
              role: "teacher" as const,
              is_verified: true,
              is_following: teacher.is_following,
            })),
          )
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
  }, empty);
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
