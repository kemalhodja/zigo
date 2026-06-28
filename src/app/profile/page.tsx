import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { ProfileHighlights } from "@/components/profile-highlights";
import { ProfileShortcutSettings } from "@/components/profile-shortcut-settings";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getProfileBillingSection } from "@/lib/domain/profile-billing";
import { getCurrentProfile, getUserInterestAreaNames, type UserProfile } from "@/lib/domain/profiles";
import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import { canPublishSocialContent, isPublisherRole } from "@/lib/domain/role-utils";
import {
  getProfileSocialStats,
  getSavedSocialPosts,
  getSuggestedCreators,
  getUserSocialPosts,
  getUserSocialReels,
  type ProfileSocialStats,
  type SuggestedCreator,
} from "@/lib/domain/social";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import type { SocialPostRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const demoSuggestedCreators = [
  { id: undefined, name: "Aylin", handle: "aylinmath", area: "Math", href: "/explore?format=teachers" },
  { id: undefined, name: "Mert", handle: "mertlab", area: "Science", href: "/explore?format=teachers" },
  { id: undefined, name: "Code Club", handle: "codeclub", area: "Coding", href: "/explore?format=teachers" },
] as const;

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const m = await getServerMessages();
  const p = m.profile;
  const params = await searchParams;
  const activeTab =
    params.tab === "micro" || params.tab === "reels"
      ? "reels"
      : params.tab === "saved"
        ? "saved"
        : "posts";
  const profile = await getProfileData(activeTab);
  const billingSection = hasSupabaseEnv()
    ? await getProfileBillingSection(await createClient())
    : null;
  const activeTabLabel = activeTab === "reels" ? m.zigo.micro : activeTab === "saved" ? p.saved : m.common.posts;
  const stats = [
    { label: m.common.posts, value: profile.stats.posts.toLocaleString() },
    { label: m.common.followers, value: profile.stats.followers.toLocaleString() },
    { label: m.common.following, value: profile.stats.following.toLocaleString() },
  ];
  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 bg-white px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-black text-night">@{profile.handle}</h1>
            {profile.isVerified ? <VerifiedBadge className="size-4" /> : null}
          </div>
          <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/profiles" aria-label={p.profileModesAria}>
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <SocialAvatar accent="from-crystal via-fuchsia-500 to-rose-400" className="story-ring size-[5.25rem] text-3xl" label={profile.name} />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {stats.map((stat) => (
              <div className="px-1 py-2" key={stat.label}>
                <p className="text-lg font-black text-night">{stat.value}</p>
                <p className="text-[0.72rem] font-semibold text-slate-700">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-night">{profile.name}</h2>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-600">
              {profile.isSignedOut ? m.roles.guest : profile.isVerified ? m.common.verified : m.common.learner}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-600">
              {m.common.publicProfile}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-5 text-slate-600">
            @{profile.handle}
            <br />
            {profile.bio}
          </p>
          {profile.role !== "guest" && isPublisherRole(profile.role) && (profile.isVerified || profile.branches.length > 0) ? (
            <div className="mt-3">
              <TeacherTrustBadges
                branches={profile.branches}
                moreLabel={m.teacherBadges.moreAreas}
                verified={profile.isVerified}
                verifiedLabel={m.teacherBadges.verifiedTeacher}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
          <span className="rounded-lg bg-slate-100 px-3 py-1">{m.profileGrid.publicGrid}</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1">{m.profileGrid.privateSaved}</span>
        </div>

        <div className="zigo-action-grid mt-4">
          <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/auth" : profile.role !== "guest" && isPublisherRole(profile.role) ? "/profile/edit" : "/onboarding"}>
            {profile.isSignedOut ? m.common.signIn : m.common.edit}
          </Link>
          {profile.role !== "guest" && isPublisherRole(profile.role) ? (
            <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/setup" : "/create"}>
              {profile.isSignedOut ? m.common.setup : m.header.create}
            </Link>
          ) : profile.role === "student" ? (
            <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/auth" : "/student"}>
              {m.dashboard.student.mode}
            </Link>
          ) : profile.role === "parent" ? (
            <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/auth" : "/parent"}>
              {m.dashboard.parent.mode}
            </Link>
          ) : (
            <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/auth" : "/questions"}>
              {m.nav.ask}
            </Link>
          )}
          <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/" : "/collections"}>
            {profile.isSignedOut ? p.feed : p.saved}
          </Link>
        </div>
      </section>

      <ProfileHighlights />

      {!profile.isSignedOut ? (
        <section className="-mx-4 px-4 pt-4">
          <ProfileShortcutSettings
            canCreateSocialPost={
              profile.role !== "guest"
              && canPublishSocialContent({ role: profile.role, is_verified: profile.isVerified })
            }
            viewerRole={profile.role}
          />
        </section>
      ) : null}

      <ProfileActionBar isSignedOut={profile.isSignedOut} messages={m} role={profile.role} />
      <ProfileInsightCard
        activeTabLabel={activeTabLabel}
        followers={profile.stats.followers}
        following={profile.stats.following}
        messages={m}
        posts={profile.stats.posts}
        visibleTiles={profile.posts.length}
      />

      <ProfileCreatorDiscovery creators={profile.suggestedCreators} isSignedOut={profile.isSignedOut} messages={m} />

      <section className="-mx-4 mt-2 grid grid-cols-3 border-y border-slate-100 bg-white">
        <Link
          className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
            activeTab === "posts" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
          }`}
          href="/profile"
        >
          <span className="sr-only">{m.common.posts}</span>
          <svg aria-hidden="true" className="mx-auto size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4h16v16H4z" />
            <path d="M4 12h16" />
            <path d="M12 4v16" />
          </svg>
        </Link>
        <Link
          className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
            activeTab === "reels" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
          }`}
          href="/profile?tab=micro"
        >
          <span className="sr-only">{m.zigo.micro}</span>
          <svg aria-hidden="true" className="mx-auto size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="16" rx="4" width="18" x="3" y="4" />
            <path d="M11 12l4 2.5-4 2.5z" />
          </svg>
        </Link>
        <Link
          className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
            activeTab === "saved" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
          }`}
          href="/profile?tab=saved"
        >
          <span className="sr-only">{p.saved}</span>
          <svg aria-hidden="true" className="mx-auto size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </Link>
      </section>

      <ProfileGridModeStrip
        activeTab={activeTab}
        isSignedOut={profile.isSignedOut}
        messages={m}
        tileCount={profile.posts.length}
      />

      <section className="hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{m.profileGrid.profileGridLabel}</p>
            <h2 className="mt-1 text-lg font-black text-night">{activeTabLabel}</h2>
          </div>
          <span className="rounded-lg bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-2 text-xs font-black text-berry">
            {profile.posts.length} tiles
          </span>
        </div>
      </section>

      <section className="-mx-4 grid grid-cols-3 gap-0.5 bg-white">
        {profile.posts.length === 0 ? (
          <div className="col-span-3 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg border-2 border-night text-2xl font-black text-night">
              <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16v16H4z" />
                <path d="M4 12h16" />
                <path d="M12 4v16" />
              </svg>
            </span>
            <h3 className="mt-4 text-lg font-black text-night">
              {profile.isSignedOut
                ? p.signInTitle
                : activeTab === "saved"
                  ? p.noSaved
                  : activeTab === "reels"
                    ? p.noMicro
                    : p.noPosts}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {profile.isSignedOut
                ? p.signInDesc
                : activeTab === "saved"
                  ? p.noSavedDesc
                  : activeTab === "reels"
                    ? p.noMicroDesc
                    : p.noPostsDesc}
            </p>
            <Link
              className="tap-scale mt-4 inline-flex rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-black text-night"
              href={profile.isSignedOut ? "/auth" : activeTab === "saved" ? "/collections" : "/create"}
            >
              {profile.isSignedOut ? m.common.signIn : activeTab === "saved" ? p.saved : m.header.create}
            </Link>
          </div>
        ) : (
          profile.posts.map((item, index) => (
            <Link className="group block text-[0.68rem] font-black text-white" href={item.href} key={item.id}>
              <SocialMediaFrame
                className="aspect-square media-polish"
                gradient={
                  index % 3 === 0
                    ? "from-crystal to-fuchsia-500"
                    : index % 3 === 1
                      ? "from-emerald-500 to-teal-500"
                      : "from-amber-400 to-orange-500"
                }
                mediaType={item.mediaType}
                mediaUrl={item.mediaUrl}
                scene={index % 4 === 0 ? "math" : index % 4 === 1 ? "science" : index % 4 === 2 ? "coding" : "english"}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="sr-only">
                    {activeTab === "saved" ? "saved" : item.mediaType === "video" ? "reel" : "post"}
                  </span>
                  {item.mediaType === "video" ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-black/30 backdrop-blur">
                      <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="grid-tile-caption">{item.label}</span>
                </div>
              </SocialMediaFrame>
            </Link>
          ))
        )}
      </section>

      {billingSection ? (
        <ZigoPlusPlansSection
          allowDevActivate={billingSection.allowDevActivate}
          groups={billingSection.groups}
          hidePrices={billingSection.hidePrices}
          isPremium={billingSection.isPremium}
        />
      ) : null}

    </div>
  );
}

function ProfileGridModeStrip({
  activeTab,
  isSignedOut,
  messages,
  tileCount,
}: {
  activeTab: "posts" | "reels" | "saved";
  isSignedOut: boolean;
  messages: Messages;
  tileCount: number;
}) {
  const g = messages.profileGrid;
  const modes = [
    { href: "/profile", id: "posts", label: messages.common.posts, meta: g.gridMode },
    { href: "/profile?tab=micro", id: "reels", label: messages.nav.micro, meta: "Video" },
    { href: "/profile?tab=saved", id: "saved", label: g.privateSaved, meta: g.privateSaved },
  ] as const;
  const actionHref = isSignedOut ? "/auth" : activeTab === "saved" ? "/collections" : "/create";
  const actionLabel = isSignedOut ? g.signIn : activeTab === "saved" ? g.openSaved : g.createTile;

  return (
    <section className="hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{g.gridMode}</p>
          <p className="mt-1 text-sm font-black text-night">
            {tileCount} {g.tiles}
          </p>
        </div>
        <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-2 text-xs font-black text-white" href={actionHref}>
          {actionLabel}
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const isActive = mode.id === activeTab;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`tap-scale rounded-xl px-3 py-2 text-center ${
                isActive ? "bg-white text-night shadow-sm" : "bg-white/55 text-slate-500"
              }`}
              href={mode.href}
              key={mode.id}
            >
              <span className="block text-xs font-black">{mode.label}</span>
              <span className="mt-0.5 block text-[0.65rem] font-bold leading-tight text-slate-500">{mode.meta}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProfileCreatorDiscovery({
  creators,
  isSignedOut,
  messages,
}: {
  creators: ProfileSuggestedCreator[];
  isSignedOut: boolean;
  messages: Messages;
}) {
  if (isSignedOut) return null;
  const p = messages.profile;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">{p.discoverCreators}</p>
          <h2 className="mt-1 text-sm font-black text-night">{p.verifiedTeachers}</h2>
        </div>
        <Link className="text-xs font-black text-crystal" href="/explore?format=teachers">
          {messages.common.seeAll}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {creators.map((creator) => (
          <article className="min-w-28 text-center" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="mx-auto size-14" label={creator.name} />
              <p className="mt-2 truncate text-xs font-black text-night">@{creator.handle}</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-slate-500">{creator.area}</p>
            </Link>
            <div className="mt-2 flex justify-center">
              <FollowButton
                followingId={creator.id}
                initialFollowing={creator.isFollowing}
                variant="compact"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileActionBar({
  isSignedOut,
  messages,
  role,
}: {
  isSignedOut: boolean;
  messages: Messages;
  role: UserProfile["role"] | "guest";
}) {
  const dashboardHref = getRoleDashboardHref(role);
  const actions =
    role === "teacher" || role === "platform"
      ? [
          { href: isSignedOut ? "/auth" : "/create?mode=story", label: messages.zigo.spark, tone: "from-crystal to-berry" },
          { href: isSignedOut ? "/auth" : "/create?mode=reel", label: messages.zigo.micro, tone: "from-aqua to-mint" },
          {
            href: isSignedOut ? "/auth" : role === "platform" ? "/platform" : "/teacher",
            label: role === "platform" ? messages.dashboard.platform.studio : messages.dashboard.teacher.studio,
            tone: "from-sun to-peach",
          },
        ]
      : role === "student"
        ? [
            { href: isSignedOut ? "/auth" : "/student", label: messages.dashboard.student.mode, tone: "from-crystal to-berry" },
            { href: isSignedOut ? "/auth" : "/focus", label: messages.zigo.focusMode, tone: "from-aqua to-mint" },
            { href: isSignedOut ? "/auth" : "/learn", label: messages.dock.learn, tone: "from-sun to-peach" },
          ]
        : role === "parent"
          ? [
              { href: isSignedOut ? "/auth" : "/parent", label: messages.dashboard.parent.mode, tone: "from-crystal to-berry" },
              { href: isSignedOut ? "/auth" : "/family", label: messages.profilesPage.familySetup, tone: "from-aqua to-mint" },
              { href: isSignedOut ? "/auth" : "/questions", label: messages.nav.ask, tone: "from-sun to-peach" },
            ]
          : [
              { href: isSignedOut ? "/auth" : "/questions", label: messages.nav.ask, tone: "from-crystal to-berry" },
              { href: dashboardHref, label: messages.nav.profile, tone: "from-aqua to-mint" },
              { href: "/collections", label: messages.profile.saved, tone: "from-sun to-peach" },
            ];

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
      <div className="zigo-action-grid">
        {actions.map((action) => (
          <Link
            className={`zigo-action-chip tap-scale rounded-lg bg-gradient-to-br ${action.tone} text-white`}
            href={action.href}
            key={action.label}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProfileInsightCard({
  activeTabLabel,
  followers,
  following,
  messages,
  posts,
  visibleTiles,
}: {
  activeTabLabel: string;
  followers: number;
  following: number;
  messages: Messages;
  posts: number;
  visibleTiles: number;
}) {
  const p = messages.profile;
  const engagementHint = posts > 0
    ? `${visibleTiles} visible tiles from ${posts.toLocaleString()} total posts.`
    : p.insightsDesc;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">{p.insights}</p>
          <p className="zigo-fit-text mt-1 text-sm font-black text-night">{activeTabLabel} · {engagementHint}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black text-night">{followers.toLocaleString()}</p>
          <p className="text-[0.62rem] font-bold text-slate-500">{messages.common.followers}</p>
          <p className="mt-1 text-[0.62rem] font-bold text-slate-500">{following.toLocaleString()} {messages.common.following}</p>
        </div>
      </div>
    </section>
  );
}

type ProfileSuggestedCreator = {
  id?: string;
  name: string;
  handle: string;
  area: string;
  href: string;
  isFollowing?: boolean;
};

async function getProfileData(activeTab: "posts" | "reels" | "saved"): Promise<{
  name: string;
  handle: string;
  bio: string;
  role: UserProfile["role"] | "guest";
  isVerified: boolean;
  branches: string[];
  stats: ProfileSocialStats;
  posts: { id: string; label: string; href: string; mediaUrl: string | null; mediaType: string }[];
  suggestedCreators: ProfileSuggestedCreator[];
  isPreview: boolean;
  isSignedOut: boolean;
}> {
  const signedOutMessages = await getServerMessages();
  const pf = signedOutMessages.profile;
  const demo = signedOutMessages.demo;
  const roles = signedOutMessages.roles;

  const fallback = {
    name: pf.fallbackCreatorName,
    handle: "zigocreator",
    bio: pf.fallbackCreatorBio,
    role: "teacher" as const,
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
  };

  if (!hasSupabaseEnv()) {
    if (allowDemoContent()) return fallback;
    const signedOutMessages = await getServerMessages();
    return {
      name: signedOutMessages.common.signIn,
      handle: "signin",
      bio: signedOutMessages.profile.signInDesc,
      role: "guest" as const,
      isVerified: false,
      branches: [],
      stats: { posts: 0, followers: 0, following: 0 },
      posts: [],
      suggestedCreators: [],
      isPreview: false,
      isSignedOut: true,
    };
  }

  const previewFallback: Awaited<ReturnType<typeof getProfileData>> = allowDemoContent()
    ? fallback
    : {
        name: (await getServerMessages()).common.signIn,
        handle: "signin",
        bio: (await getServerMessages()).profile.signInDesc,
        role: "guest" as const,
        isVerified: false,
        branches: [],
        stats: { posts: 0, followers: 0, following: 0 },
        posts: [],
        suggestedCreators: [],
        isPreview: false,
        isSignedOut: true,
      };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    const signedOutMessages = await getServerMessages();
    return {
      name: signedOutMessages.common.signIn,
      handle: "signin",
      bio: signedOutMessages.profile.signInDesc,
      role: "guest",
      isVerified: false,
      branches: [],
      stats: { posts: 0, followers: 0, following: 0 },
      posts: [],
      suggestedCreators: [],
      isPreview: false,
      isSignedOut: true,
    };
  }

  const [stats, posts, suggested, branches] = await Promise.all([
    getProfileSocialStats(supabase, profile.id),
    getProfileGridPosts(supabase, profile.id, activeTab),
    getProfileSuggestedCreators(supabase, profile.id),
    isPublisherRole(profile.role) ? getUserInterestAreaNames(supabase, profile.id) : Promise.resolve([]),
  ]);
  return { ...toProfileData(profile, stats, posts, branches, pf), suggestedCreators: suggested };
  }, previewFallback);
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
  posts: SocialPostRow[],
  branches: string[],
  pf: Messages["profile"],
) {
  return {
    name: profile.full_name,
    handle: profile.full_name.toLowerCase().replaceAll(" ", ""),
    bio: isPublisherRole(profile.role) ? pf.fallbackTeacherBio : pf.fallbackLearnerBio,
    role: profile.role,
    isVerified: profile.is_verified,
    branches,
    stats,
    posts:
      posts.length > 0
        ? posts.map((post) => ({
            id: post.id,
            label: post.caption.slice(0, 28) || "Post",
            href: `/post/${post.id}`,
            mediaUrl: post.media_url,
            mediaType: post.media_type,
          }))
        : [],
    isPreview: false,
    isSignedOut: false,
  };
}
