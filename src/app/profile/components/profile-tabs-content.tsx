"use client";

import Link from "next/link";
import { AgendaManager } from "@/components/agenda/agenda-manager";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { TeacherLessonMarketplaceTab } from "@/components/teacher-lesson-marketplace-tab";
import type { PrivateLessonPostWithDetails } from "@/lib/domain/private-lessons";
import type { Messages } from "@/lib/i18n/server";
import type { ProfileDataResult } from "../profile-data";

interface ProfileTabsContentProps {
  profile: ProfileDataResult;
  activeTab: "posts" | "reels" | "saved" | "market" | "agenda";
  messages: Messages;
  parentChildProfiles: { id: string; name: string }[];
  teacherMatchedPosts: PrivateLessonPostWithDetails[];
}

function emptyProfilePrimaryHref(role: string): string {
  if (role === "teacher") return "/create";
  if (role === "student") return "/student";
  if (role === "parent") return "/family";
  return "/explore";
}

export function ProfileTabsContent({
  profile,
  activeTab,
  messages: m,
  parentChildProfiles,
  teacherMatchedPosts,
}: ProfileTabsContentProps) {
  const p = m.profile;
  const canViewAgenda = (profile.role === "student" || profile.role === "parent") && !profile.isSignedOut;
  const isTeacherRole = profile.role === "teacher";
  const gridColsClass = canViewAgenda && isTeacherRole ? "grid-cols-5" : canViewAgenda || isTeacherRole ? "grid-cols-4" : "grid-cols-3";

  return (
    <>
      <section className={`-mx-4 mt-2 grid ${gridColsClass} border-y border-slate-100 bg-white`}>
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
        {canViewAgenda ? (
          <Link
            className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition flex flex-col items-center justify-center gap-0.5 ${
              activeTab === "agenda" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
            }`}
            href="/profile?tab=agenda"
          >
            <span className="text-sm">🗓️</span>
            <span className="text-[0.62rem] font-bold">Ders Programı</span>
          </Link>
        ) : null}
        {isTeacherRole ? (
          <Link
            className={`border-b-[3px] px-3 py-3 text-center text-xs font-black transition flex flex-col items-center justify-center gap-0.5 ${
              activeTab === "market" ? "zigo-tab-active-underline" : "zigo-tab-inactive-underline"
            }`}
            href="/profile?tab=market"
          >
            <span className="text-sm">🎯</span>
            <span className="text-[0.65rem] font-bold">İlanlar</span>
          </Link>
        ) : null}
      </section>

      {activeTab === "agenda" && ((profile.role === "student" || profile.role === "parent") && !profile.isSignedOut) ? (
        <section className="px-4 py-4 bg-white rounded-2xl border border-slate-100 mt-2">
          <AgendaManager
            childProfiles={parentChildProfiles}
            currentUserName={profile.name}
            isParentView={profile.role === "parent"}
            targetUserId={profile.id}
            userRole={profile.role}
          />
        </section>
      ) : activeTab === "market" && profile.role === "teacher" ? (
        <TeacherLessonMarketplaceTab
          posts={teacherMatchedPosts}
          teacherBranches={profile.branches}
        />
      ) : (
        <section className="-mx-4 grid grid-cols-3 gap-0.5 bg-white">
          {profile.posts.length === 0 ? (
            <div className="col-span-3 py-16 text-center border-t border-zinc-100 bg-zinc-50/50 mt-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-none bg-black text-white shadow-sharp">
                <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
              </div>
              <h3 className="mt-6 text-base font-bold text-black tracking-tight">
                {profile.isSignedOut
                  ? p.signInTitle
                  : activeTab === "saved"
                    ? p.noSaved
                    : activeTab === "reels"
                      ? p.noMicro
                      : p.noPosts}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-[0.95rem] leading-relaxed text-zinc-500 tracking-tight">
                {profile.isSignedOut
                  ? p.signInDesc
                  : activeTab === "saved"
                    ? p.noSavedDesc
                    : activeTab === "reels"
                      ? p.noMicroDesc
                      : p.noPostsDesc}
              </p>
              <Link
                className="group relative mt-8 inline-flex items-center justify-center rounded-sm bg-black px-8 py-3.5 text-sm font-bold text-white shadow-sharp transition-all hover:-translate-y-0.5 hover:bg-[#0047FF] active:translate-y-px"
                href={
                  profile.isSignedOut
                    ? "/auth"
                    : activeTab === "saved"
                      ? "/collections"
                      : emptyProfilePrimaryHref(profile.role)
                }
              >
                <span className="relative flex items-center gap-2 tracking-widest uppercase text-[0.75rem]">
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
                </span>
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
      )}
    </>
  );
}
