import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/follow-button";
import { ProfessionalPortfolio } from "@/components/professional-portfolio";
import { ProfileHighlights } from "@/components/profile-highlights";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { RequestLessonCTA } from "@/features/lesson/components/request-lesson-cta";
import { hasSupabaseEnv } from "@/lib/config";
import { getChildProfiles } from "@/lib/domain/children";
import { getProfessionalProfilePortfolio } from "@/lib/domain/professional-profile";
import { getCurrentProfile, getUserInterestAreaNames } from "@/lib/domain/profiles";
import {
  getProfileSocialStats,
  getPublicProfile,
  getUserSocialPosts,
  getUserSocialReels,
  isFollowing,
} from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type PublicProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const activeTab = query.tab === "micro" || query.tab === "reels" ? "reels" : "posts";

  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return <PreviewProfile messages={m} />;
  }

  const supabase = await createClient();
  const [viewer, profile] = await Promise.all([
    getCurrentProfile(supabase),
    getPublicProfile(supabase, id),
  ]);

  if (!profile) notFound();

  const tb = m.teacherBadges;
  const branches =
    profile.role === "teacher" ? await getUserInterestAreaNames(supabase, profile.id) : [];

  const [stats, posts, following, parentChildren, portfolio] = await Promise.all([
    getProfileSocialStats(supabase, profile.id),
    activeTab === "reels"
      ? getUserSocialReels(supabase, profile.id)
      : getUserSocialPosts(supabase, profile.id),
    viewer ? isFollowing(supabase, viewer.id, profile.id) : Promise.resolve(false),
    viewer?.role === "parent" ? getChildProfiles(supabase) : Promise.resolve([]),
    profile.role === "teacher" ? getProfessionalProfilePortfolio(supabase, profile) : Promise.resolve(null),
  ]);
  const isOwnProfile = viewer?.id === profile.id;
  const handle = profile.full_name.toLowerCase().replaceAll(" ", "");
  const canRequestLesson =
    viewer?.role === "parent" &&
    profile.role === "teacher" &&
    profile.is_verified &&
    !isOwnProfile;
  const showPortfolio = profile.role === "teacher" && portfolio?.kind;

  if (showPortfolio) {
    return (
      <div className="space-y-0 pb-3">
        <div className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
          <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-lg font-black text-night">Profesyonel Portfolyo</h1>
          </div>
          <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/questions">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
            </svg>
          </Link>
        </div>

        <ProfessionalPortfolio
          branches={branches}
          canRequestLesson={canRequestLesson}
          childrenOptions={parentChildren.map((child) => ({ id: child.id, name: child.display_name }))}
          following={following}
          followersCount={stats.followers}
          handle={handle}
          isOwnProfile={isOwnProfile}
          portfolio={portfolio}
          profile={profile}
          requestHint={m.lessonRequests.profileRequestHint}
        />

        <ProfileHighlights />

        <section className="-mx-4 mt-2 grid grid-cols-2 border-y border-slate-100 bg-white">
          <Link
            className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
              activeTab === "posts" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
            }`}
            href={`/profile/${profile.id}`}
          >
            Gönderiler
          </Link>
          <Link
            className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
              activeTab === "reels" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
            }`}
            href={`/profile/${profile.id}?tab=micro`}
          >
            Micro
          </Link>
        </section>

        <PostsGrid activeTab={activeTab} messages={m} posts={posts} profileId={profile.id} />
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-3">
      <div className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
        <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-black text-night">@{handle}</h1>
          {profile.is_verified ? <VerifiedBadge className="size-4" /> : null}
        </div>
        <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/questions">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
          </svg>
        </Link>
      </div>

      <section className="-mx-4 bg-white px-4 py-4">
        <div className="flex items-center gap-5">
          <SocialAvatar accent="from-crystal via-fuchsia-500 to-rose-400" className="story-ring size-[5.25rem] text-3xl" label={profile.full_name} />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <Stat label="posts" value={stats.posts.toLocaleString()} />
            <Stat label="followers" value={stats.followers.toLocaleString()} />
            <Stat label="following" value={stats.following.toLocaleString()} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-night">{profile.full_name}</h1>
            {profile.is_verified ? <VerifiedBadge className="size-4" /> : null}
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-600">
              {profile.role}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-5 text-slate-600">
            @{handle}
          </p>
          {profile.role === "teacher" ? (
            <div className="mt-3">
              <TeacherTrustBadges
                branches={branches}
                moreLabel={tb.moreAreas}
                verified={profile.is_verified}
                verifiedLabel={tb.verifiedTeacher}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {isOwnProfile ? (
              <Link className="tap-scale rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-black text-night" href="/profile">
                This is you
              </Link>
            ) : (
              <FollowButton
                followingId={profile.id}
                initialFollowersCount={stats.followers}
                initialFollowing={following}
                showCount
              />
            )}
            <Link className="tap-scale rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-black text-night" href="/questions">
              Ask
            </Link>
          </div>
          {canRequestLesson ? (
            <RequestLessonCTA
              childrenOptions={parentChildren.map((child) => ({ id: child.id, name: child.display_name }))}
              teacherId={profile.id}
              teacherName={profile.full_name}
            />
          ) : null}
        </div>
        {canRequestLesson ? (
          <p className="mt-3 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold leading-5 text-cyan-800">
            {m.lessonRequests.profileRequestHint}
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
            Public creator profile. Follow actions are visible; saved posts remain private to each viewer.
          </p>
        )}
      </section>

      <ProfileHighlights />

      <section className="-mx-4 mt-2 grid grid-cols-2 border-y border-slate-100 bg-white">
        <Link
          className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition ${
            activeTab === "posts" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
          }`}
          href={`/profile/${profile.id}`}
        >
          <span className="sr-only">Posts</span>
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
          href={`/profile/${profile.id}?tab=micro`}
        >
          <span className="sr-only">Micro</span>
          <svg aria-hidden="true" className="mx-auto size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="16" rx="4" width="18" x="3" y="4" />
            <path d="M11 12l4 2.5-4 2.5z" />
          </svg>
        </Link>
      </section>

      <PostsGrid activeTab={activeTab} messages={m} posts={posts} profileId={profile.id} />
    </div>
  );
}

function PostsGrid({
  activeTab,
  messages: m,
  posts,
}: {
  activeTab: "posts" | "reels";
  messages: Awaited<ReturnType<typeof getServerMessages>>;
  posts: Awaited<ReturnType<typeof getUserSocialPosts>>;
  profileId: string;
}) {
  return (
      <section className="-mx-4 grid grid-cols-3 gap-0.5 bg-white">
        {posts.length === 0 ? (
          <div className="col-span-3 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg border-2 border-night text-night">
              <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16v16H4z" />
                <path d="M4 12h16" />
                <path d="M12 4v16" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-black text-night">
              {activeTab === "reels" ? m.profileGrid.noMicroYet : m.profileGrid.noPostsYet}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
            New posts from this creator will appear here after publishing.
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <Link className="group block text-[0.68rem] font-black text-white" href={`/post/${post.id}`} key={post.id}>
              <SocialMediaFrame
                className="aspect-square media-polish"
                gradient={
                  index % 3 === 0
                    ? "from-crystal to-fuchsia-500"
                    : index % 3 === 1
                      ? "from-emerald-500 to-teal-500"
                      : "from-amber-400 to-orange-500"
                }
                mediaType={post.media_type}
                mediaUrl={post.media_url}
                scene={index % 4 === 0 ? "math" : index % 4 === 1 ? "science" : index % 4 === 2 ? "coding" : "english"}
              >
                <div />
                <div />
              </SocialMediaFrame>
            </Link>
          ))
        )}
      </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-black text-night">{value}</p>
      <p className="text-[0.72rem] font-semibold text-slate-700">{label}</p>
    </div>
  );
}

function PreviewProfile({ messages: m }: { messages: Awaited<ReturnType<typeof getServerMessages>> }) {
  const p = m.profile;
  const roles = m.roles;
  const tb = m.teacherBadges;

  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 bg-white px-4 py-5">
        <div className="flex items-center gap-5">
          <SocialAvatar className="story-ring size-[5.25rem] text-3xl" label={p.fallbackCreatorName} />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <Stat label={m.common.posts} value="48" />
            <Stat label={m.common.followers} value="18K" />
            <Stat label={m.common.following} value="214" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-night">{p.previewCreator}</h1>
            <VerifiedBadge className="size-4" />
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-600">
              {roles.teacher}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-5 text-slate-600">
            @zigocreator
            <br />
            {p.previewCreatorBio}
          </p>
          <div className="mt-3">
            <TeacherTrustBadges
              branches={["LGS Matematik", "Rehber Öğretmen"]}
              moreLabel={tb.moreAreas}
              verified
              verifiedLabel={tb.verifiedTeacher}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-2 text-center text-sm font-black text-white" href="/setup">
            {m.common.setup}
          </Link>
          <Link className="tap-scale rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-black text-night" href="/explore">
            {m.zigo.discover}
          </Link>
        </div>
      </section>
      <ProfileHighlights />
    </div>
  );
}
