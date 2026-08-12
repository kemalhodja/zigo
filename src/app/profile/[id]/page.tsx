import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { ProfileAdvertiseModal } from "@/components/profile-advertise-modal";
import { ProfileCover } from "@/components/profile-cover";
import { ProfileHighlights } from "@/components/profile-highlights";
import { ProfileSocialLinks } from "@/components/profile-social-links";
import { ProfileSocialStats } from "@/components/profile-social-stats";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile, getUserInterestAreaNames } from "@/lib/domain/profiles";
import {
  getProfileSocialStats,
  getPublicProfile,
  getUserSocialPosts,
  getUserSocialReels,
  isFollowing,
} from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { Metadata, ResolvingMetadata } from "next";

type PublicProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata(
  { params }: PublicProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  if (!hasSupabaseEnv()) {
    return { title: "Zigo Profil" };
  }

  const supabase = await createClient();
  const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
  const profile = await getPublicProfile(dbClient, id);

  if (!profile) {
    return { title: "Profil Bulunamadı | Zigo" };
  }

  const name = profile.full_name || "Zigo Öğretmeni";
  const bio = profile.bio || "Zigo'da bir profil sayfası.";
  
  return {
    title: `${name} | Zigo`,
    description: bio,
    openGraph: {
      title: `${name} | Zigo`,
      description: bio,
      images: profile.avatar_url ? [profile.avatar_url] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} | Zigo`,
      description: bio,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    }
  };
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const activeTab = query.tab === "micro" || query.tab === "reels" ? "reels" : "posts";

  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return <PreviewProfile messages={m} />;
  }

  const supabase = await createClient();
  const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;

  const [viewer, profile] = await Promise.all([
    getCurrentProfile(supabase),
    getPublicProfile(dbClient, id),
  ]);

  if (!profile) notFound();

  const tb = m.teacherBadges;
  const branches =
    profile.role === "teacher" ? await getUserInterestAreaNames(dbClient, profile.id) : [];

  const [stats, posts, following] = await Promise.all([
    getProfileSocialStats(dbClient, profile.id),
    activeTab === "reels"
      ? getUserSocialReels(dbClient, profile.id)
      : getUserSocialPosts(dbClient, profile.id),
    viewer ? isFollowing(supabase, viewer.id, profile.id) : Promise.resolve(false),
  ]);
  const isOwnProfile = viewer?.id === profile.id;
  const handle = profile.full_name.toLowerCase().replaceAll(" ", "");

  return (
    <div className="space-y-0 pb-3">
      <div className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
        <BackButton className="tap-scale flex size-9 items-center justify-center text-night" fallbackHref="/explore" />
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

      {/* Cover banner + avatar overlap */}
      <section className="-mx-4 bg-white">
        <ProfileCover
          initialCoverUrl={(profile as unknown as { cover_url?: string | null }).cover_url}
          isEditable={isOwnProfile}
          isVerified={profile.is_verified}
        />

        {/* Avatar overlapping cover */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between">
            <div className="-mt-10 shrink-0">
              <SocialAvatar
                accent="from-crystal via-fuchsia-500 to-rose-400"
                className="size-20 text-3xl ring-4 ring-white shadow-md"
                imageUrl={profile.avatar_url}
                label={profile.full_name}
              />
            </div>
          </div>

          {/* Action buttons row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {isOwnProfile ? (
              <Link className="tap-scale flex h-9.5 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-black text-night hover:bg-slate-200 transition whitespace-nowrap" href="/profile">
                Kendi profilin
              </Link>
            ) : (
              <FollowButton
                followingId={profile.id}
                initialFollowing={following}
                initialFollowersCount={stats.followers}
                showCount={false}
              />
            )}
            {!isOwnProfile && viewer?.role !== "student" ? (
              <Link
                className="tap-scale flex h-9.5 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-2 text-xs font-black text-slate-950 shadow-xs hover:brightness-105 transition whitespace-nowrap"
                href={`/teacher/lessons?user=${profile.id}`}
              >
                💬 Ders Talebi
              </Link>
            ) : null}
            <Link className="tap-scale flex h-9.5 items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-black text-night hover:bg-slate-200 transition whitespace-nowrap" href="/questions">
              ❓ Soru sor
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-3">
            <ProfileSocialStats
              followersCount={stats.followers}
              followersLabel={m.common.followers}
              followingCount={stats.following}
              followingLabel={m.common.following}
              postsCount={stats.posts}
              postsLabel={m.common.posts}
              targetUserId={profile.id}
              viewerId={viewer?.id}
            />
          </div>

          {/* Name + bio */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-night">{profile.full_name}</h1>
              {profile.is_verified ? <VerifiedBadge className="size-4" /> : null}
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-600">
                {profile.role}
              </span>
            </div>
            {profile.bio ? (
              <p className="mt-1.5 text-sm leading-5 text-slate-600">
                {profile.bio}
              </p>
            ) : null}
            <ProfileSocialLinks bio={profile.bio} />
            {profile.role === "teacher" ? (
              <div className="mt-3">
                <TeacherTrustBadges
                  branches={branches}
                  moreLabel={tb.moreAreas}
                  verified={profile.is_verified}
                  verifiedLabel={tb.verifiedTeacher}
                  showVerified={false}
                />
              </div>
            ) : null}
          </div>

          {isOwnProfile && profile.role === "teacher" ? (
            <div className="mt-3 flex w-full">
              <ProfileAdvertiseModal
                profile={{
                  id: profile.id,
                  role: profile.role,
                  organization_type: profile.organization_type,
                  full_name: profile.full_name,
                }}
                isOwner={true}
                triggerClassName="zigo-action-chip tap-scale w-full rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15"
              />
            </div>
          ) : null}
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500" data-invariant="Public creator profile. Follow actions are visible; saved posts remain private to each viewer.">
            Açık üretici profili. Takip hareketleri görünürdür; kaydedilen gönderiler ise her izleyiciye özel gizli kalır.
          </p>
        </div>
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
              Bu yaratıcının yeni gönderileri yayınlandıktan sonra burada görünecek.
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <Link
              className="group relative block text-[0.68rem] font-black text-white"
              href={post.media_type === "video" || activeTab === "reels" ? `/micro?reelId=${post.id}` : `/post/${post.id}`}
              key={post.id}
            >
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
                <div className="flex items-start justify-between">
                  {post.media_type === "video" ? (
                    <span className="flex size-6 items-center justify-center rounded-md bg-black/30 backdrop-blur">
                      <svg aria-hidden="true" className="ml-0.5 size-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  ) : <span />}
                </div>
                <div />
              </SocialMediaFrame>
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                <span className="flex items-center gap-1 font-black">
                  <svg aria-hidden="true" className="size-4 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                  {(post.likes_count ?? 0).toLocaleString("tr-TR")}
                </span>
                <span className="flex items-center gap-1 font-black">
                  <svg aria-hidden="true" className="size-4 fill-white" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {(post.comments_count ?? 0).toLocaleString("tr-TR")}
                </span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
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
