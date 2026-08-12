import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { OrgDashboardPanel } from "@/components/org-dashboard-panel";
import { ProfileAdvertiseModal } from "@/components/profile-advertise-modal";
import { ProfileHighlights } from "@/components/profile-highlights";
import { ProfileSocialLinks } from "@/components/profile-social-links";
import { ProfileSocialStats as ProfileSocialStatsSection } from "@/components/profile-social-stats";
import { SignOutButton } from "@/components/sign-out-button";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getOrgDashboardSnapshot } from "@/lib/domain/org-dashboard";
import { getProfileBillingSection } from "@/lib/domain/profile-billing";
import { getCurrentProfile, getUserInterestAreaNames, parseOrganizationType, type UserProfile } from "@/lib/domain/profiles";
import { emptyProfilePrimaryHref } from "@/lib/domain/role-navigation";
import {
  getProfileSocialStats,
  getSavedSocialPosts,
  getSuggestedCreators,
  getUserSocialPosts,
  getUserSocialReels,
  type ProfileSocialStats,
  type SuggestedCreator,
} from "@/lib/domain/social";
import { LocaleSwitcher } from "@/lib/i18n/locale-switcher";
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
  const organizationType = parseOrganizationType(profile.organization_type);
  const orgDashboard =
    hasSupabaseEnv() && organizationType && profile.id && !profile.isSignedOut
      ? await getOrgDashboardSnapshot(await createClient(), profile.id, organizationType)
      : null;
  const billingSection = hasSupabaseEnv()
    ? await getProfileBillingSection(await createClient())
    : null;
  const activeTabLabel = activeTab === "reels" ? m.zigo.micro : activeTab === "saved" ? p.saved : m.common.posts;
  const orgCopy = {
    eyebrow: m.dashboard.teacher.orgEyebrow,
    titleInstitution: m.dashboard.teacher.orgTitleInstitution,
    titlePlatform: m.dashboard.teacher.orgTitlePlatform,
    titlePublisher: m.dashboard.teacher.orgTitlePublisher,
    descInstitution: m.dashboard.teacher.orgDescInstitution,
    descPlatform: m.dashboard.teacher.orgDescPlatform,
    descPublisher: m.dashboard.teacher.orgDescPublisher,
    metricPosts7d: m.dashboard.teacher.orgMetricPosts7d,
    metricPostsTotal: m.dashboard.teacher.orgMetricPostsTotal,
    metricFollowers: m.dashboard.teacher.orgMetricFollowers,
    metricAreas: m.dashboard.teacher.orgMetricAreas,
    metricSponsored: m.dashboard.teacher.orgMetricSponsored,
    metricOpenQuestions: m.dashboard.teacher.orgMetricOpenQuestions,
    areasEmpty: m.dashboard.teacher.orgAreasEmpty,
    openStudio: m.dashboard.teacher.orgOpenStudio,
    openCreate: m.dashboard.teacher.orgOpenCreate,
    openQuestions: m.dashboard.teacher.orgOpenQuestions,
    openAdvertise: m.dashboard.teacher.orgOpenAdvertise,
  };
  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 bg-white px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-black text-night">@{profile.handle}</h1>
            {profile.isVerified ? <VerifiedBadge className="size-4" /> : null}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <SocialAvatar
            accent="from-crystal via-fuchsia-500 to-rose-400"
            className="story-ring size-[5.25rem] text-3xl"
            label={profile.name}
            imageUrl={profile.avatarUrl}
          />
          <ProfileSocialStatsSection
            followersCount={profile.stats.followers}
            followersLabel={m.common.followers}
            followingCount={profile.stats.following}
            followingLabel={m.common.following}
            postsCount={profile.stats.posts}
            postsLabel={m.common.posts}
            targetUserId={profile.id}
            viewerId={profile.id}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-night">{profile.name}</h2>
          </div>
          {profile.bio ? (
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              {profile.bio}
            </p>
          ) : null}
          <ProfileSocialLinks bio={profile.bio} />
          
          {profile.role === "student" && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 border border-fuchsia-100">
              <h3 className="font-black text-fuchsia-900 text-sm mb-2">Öğrenci Gelişimi</h3>
              <div className="flex gap-2">
                <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-fuchsia-700 shadow-sm flex items-center gap-1">🏆 Gümüş Lig</span>
                <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-fuchsia-700 shadow-sm flex items-center gap-1">⭐ {profile.stats.followers * 10} Puan</span>
              </div>
            </div>
          )}

          {profile.role === "parent" && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 border border-cyan-100">
              <h3 className="font-black text-cyan-900 text-sm mb-2">Veli Özeti</h3>
              <div className="flex gap-2">
                <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm">👨‍👩‍👧 2 Bağlı Profil</span>
                <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm">✅ 0 Bekleyen Onay</span>
              </div>
            </div>
          )}

          {profile.role === "teacher" && (profile.isVerified || profile.branches.length > 0) ? (
            <div className="mt-3">
              <TeacherTrustBadges
                branches={profile.branches}
                moreLabel={m.teacherBadges.moreAreas}
                verified={profile.isVerified}
                verifiedLabel={m.teacherBadges.verifiedTeacher}
                showVerified={false}
              />
            </div>
          ) : null}

          {orgDashboard ? (
            <div className="mt-4">
              <OrgDashboardPanel copy={orgCopy} embedded snapshot={orgDashboard} />
            </div>
          ) : null}
        </div>

        <div className="zigo-action-grid mt-4">
          <Link className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night" href={profile.isSignedOut ? "/auth" : "/profile/edit"}>
            {profile.isSignedOut ? m.common.signIn : m.common.edit}
          </Link>
          {!profile.isSignedOut && (
            <SignOutButton className="zigo-action-chip rounded-lg border border-slate-200 bg-white text-night" />
          )}
          {profile.role === "teacher" ? (
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
          {(profile.role === "teacher" || profile.role === "student") && !profile.isSignedOut ? (
            <ProfileAdvertiseModal
              profile={{
                id: profile.id,
                role: profile.role,
                organization_type: profile.organization_type,
                full_name: profile.name,
              }}
              isOwner={true}
              triggerClassName="zigo-action-chip tap-scale col-span-2 w-full mt-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-900 font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
            />
          ) : null}
        </div>
      </section>

      {!profile.isSignedOut ? (
        <section className="-mx-4 bg-white px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-700">Uygulama Dili</p>
              <p className="text-[0.68rem] text-slate-400 mt-0.5">TR · EN seçeneği ile değiştirin</p>
            </div>
            <LocaleSwitcher />
          </div>
        </section>
      ) : null}

      <ProfileHighlights />

      <ProfileActionBar isSignedOut={profile.isSignedOut} messages={m} role={profile.role} />

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
              href={
                profile.isSignedOut
                  ? "/auth"
                  : activeTab === "saved"
                    ? "/collections"
                    : emptyProfilePrimaryHref(profile.role)
              }
            >
              {profile.isSignedOut
                ? m.common.signIn
                : activeTab === "saved"
                  ? p.saved
                  : profile.role === "teacher"
                    ? m.header.create
                    : profile.role === "student"
                      ? m.dashboard.student.mode
                      : profile.role === "parent"
                        ? m.profilesPage.familySetup
                        : m.common.open}
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
          isTrial={billingSection.isTrial}
          organizationName={billingSection.organizationName}
          organizationType={billingSection.organizationType}
          userCreatedAt={billingSection.userCreatedAt}
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
  const actionHref = isSignedOut
    ? "/auth"
    : activeTab === "saved"
      ? "/collections"
      : "/profile";
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

function _ProfileCreatorDiscovery({
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
  const actions =
    role === "teacher"
      ? [
          { href: isSignedOut ? "/auth" : "/create", label: messages.header.create, tone: "from-crystal to-berry" },
          { href: isSignedOut ? "/auth" : "/create?mode=micro", label: messages.zigo.micro, tone: "from-aqua to-mint" },
          { href: isSignedOut ? "/auth" : "/teacher", label: messages.dashboard.teacher.studio, tone: "from-sun to-peach" },
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
              { href: "/auth", label: messages.common.signIn, tone: "from-crystal to-berry" },
              { href: "/explore", label: messages.nav.search, tone: "from-aqua to-mint" },
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

function _ProfileInsightCard({
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
  id: string;
  name: string;
  handle: string;
  bio: string;
  role: UserProfile["role"] | "guest";
  organization_type?: string | null;
  isVerified: boolean;
  branches: string[];
  stats: ProfileSocialStats;
  posts: { id: string; label: string; href: string; mediaUrl: string | null; mediaType: string }[];
  suggestedCreators: ProfileSuggestedCreator[];
  isPreview: boolean;
  isSignedOut: boolean;
  avatarUrl: string | null;
}> {
  const signedOutMessages = await getServerMessages();
  const pf = signedOutMessages.profile;
  const demo = signedOutMessages.demo;
  const roles = signedOutMessages.roles;

  const fallback = {
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
    avatarUrl: null as string | null,
  };

  if (!hasSupabaseEnv()) {
    if (allowDemoContent()) return fallback;
    const signedOutMessages = await getServerMessages();
    return {
      id: "signin",
      name: signedOutMessages.common.signIn,
      handle: "signin",
      bio: signedOutMessages.profile.signInDesc,
      role: "guest" as UserProfile["role"] | "guest",
      organization_type: null as string | null,
      isVerified: false,
      branches: [],
      stats: { posts: 0, followers: 0, following: 0 },
      posts: [],
      suggestedCreators: [],
      isPreview: false,
      isSignedOut: true,
      avatarUrl: null as string | null,
    };
  }

  const previewFallback: Awaited<ReturnType<typeof getProfileData>> = allowDemoContent()
    ? fallback
    : {
        id: "signin",
        name: (await getServerMessages()).common.signIn,
        handle: "signin",
        bio: (await getServerMessages()).profile.signInDesc,
        role: "guest" as UserProfile["role"] | "guest",
        organization_type: null as string | null,
        isVerified: false,
        branches: [],
        stats: { posts: 0, followers: 0, following: 0 },
        posts: [],
        suggestedCreators: [],
        isPreview: false,
        isSignedOut: true,
        avatarUrl: null as string | null,
      };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    const signedOutMessages = await getServerMessages();
    return {
      id: "signin",
      name: signedOutMessages.common.signIn,
      handle: "signin",
      bio: signedOutMessages.profile.signInDesc,
      role: "guest" as UserProfile["role"] | "guest",
      organization_type: null as string | null,
      isVerified: false,
      branches: [],
      stats: { posts: 0, followers: 0, following: 0 },
      posts: [],
      suggestedCreators: [],
      isPreview: false,
      isSignedOut: true,
      avatarUrl: null as string | null,
    };
  }

  const [stats, posts, suggested, branches] = await Promise.all([
    getProfileSocialStats(supabase, profile.id),
    getProfileGridPosts(supabase, profile.id, activeTab),
    getProfileSuggestedCreators(supabase, profile.id),
    profile.role === "teacher" ? getUserInterestAreaNames(supabase, profile.id) : Promise.resolve([]),
  ]);
  return { ...toProfileData(profile, stats, posts, branches), suggestedCreators: suggested };
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
  posts: Pick<SocialPostRow, "id" | "caption" | "media_url" | "media_type">[],
  branches: string[],
) {
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
        ? posts.map((post) => ({
            id: post.id,
            label: post.caption.slice(0, 28) || "Post",
            href: post.media_type === "video" ? `/micro?reelId=${post.id}` : `/post/${post.id}`,
            mediaUrl: post.media_url,
            mediaType: post.media_type,
          }))
        : [],
    isPreview: false,
    isSignedOut: false,
    avatarUrl: profile.avatar_url || null,
  };
}
