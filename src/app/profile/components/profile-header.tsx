"use client";

import Link from "next/link";
import { ExamScoreCalculatorModal } from "@/components/exam-score-calculator-modal";
import { CreatePrivateLessonModal } from "@/components/private-lesson-post-modal";
import { ProfileCover } from "@/components/profile-cover";
import { ProfileOrgBadge } from "@/components/profile-org-badge";
import { ProfileSocialLinks } from "@/components/profile-social-links";
import { ProfileSocialStats } from "@/components/profile-social-stats";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import type { getEducationAreas } from "@/lib/domain/profiles";
import type { Messages } from "@/lib/i18n/server";
import type { ProfileDataResult } from "../profile-data";

interface ProfileHeaderProps {
  profile: ProfileDataResult;
  messages: Messages;
  educationAreas: Awaited<ReturnType<typeof getEducationAreas>>;
  parentChildProfiles: { id: string; name: string }[];
}

export function ProfileHeader({
  profile,
  messages: m,
  educationAreas,
  parentChildProfiles,
}: ProfileHeaderProps) {
  return (
    <section className="-mx-4 bg-white">
      <ProfileCover
        initialCoverUrl={profile.cover_url}
        isEditable={!profile.isSignedOut}
        isVerified={profile.isVerified}
      />

      <div className="px-4 pb-4">
        <div className="flex items-end justify-between">
          <div className="-mt-10 shrink-0">
            <SocialAvatar
              accent="from-crystal via-fuchsia-500 to-rose-400"
              className="size-20 text-3xl ring-4 ring-white shadow-md"
              label={profile.name}
              imageUrl={profile.avatarUrl}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-black text-night">@{profile.handle}</h1>
            {profile.isVerified ? <VerifiedBadge className="size-4" /> : null}
          </div>
        </div>

        <div className="mt-3">
          <ProfileSocialStats
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
          <ProfileSocialLinks 
            bio={profile.bio} 
            websiteUrl={profile.website_url} 
            youtubeUrl={profile.youtube_url} 
            instagramUrl={profile.instagram_url} 
          />

          {/* Institutional / Educator Distinguished Badge */}
          <ProfileOrgBadge
            organizationType={profile.organization_type}
            role={profile.role}
            isVerified={profile.isVerified}
          />
          
          {/* Highlights */}
          <div className="mt-5 -mx-4 px-4 overflow-x-auto hide-scrollbar flex gap-4 pb-2">
            {[
              { id: 1, title: profile.role === "student" ? "Notlarım" : "Derslerim", emoji: "📚", color: "from-blue-400 to-cyan-300" },
              { id: 2, title: "Çözümler", emoji: "✍️", color: "from-violet-400 to-fuchsia-300" },
              { id: 3, title: "Başarılar", emoji: "🏆", color: "from-amber-400 to-orange-300" },
              { id: 4, title: "Sertifikalar", emoji: "🎓", color: "from-emerald-400 to-teal-300" },
            ].map(highlight => (
              <div key={highlight.id} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-slate-200 to-slate-300 group-hover:from-crystal group-hover:to-berry transition-all">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${highlight.color} border-2 border-white flex items-center justify-center text-2xl shadow-inner`}>
                    {highlight.emoji}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700">{highlight.title}</span>
              </div>
            ))}
          </div>

          {profile.role === "student" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 border border-fuchsia-100">
                <h3 className="font-black text-fuchsia-900 text-sm mb-2">Öğrenci Gelişimi</h3>
                <div className="flex gap-2">
                  <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-fuchsia-700 shadow-sm flex items-center gap-1">🏆 Gümüş Lig</span>
                  <span className="bg-white rounded-lg px-3 py-1.5 text-xs font-bold text-fuchsia-700 shadow-sm flex items-center gap-1">⭐ {profile.stats.followers * 10} Puan</span>
                </div>
              </div>

              {/* e-Okul, YÖK Atlas & OGM Materyal Resmi Portalları */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <a
                  className="tap-scale group flex items-center justify-between rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-3 text-white shadow-md shadow-red-600/20 transition-all hover:brightness-105 active:scale-[0.99]"
                  href="https://e-okul.meb.gov.tr/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur-xs border border-white/20 shadow-inner">
                      🏫
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-wider uppercase text-red-100">MEB Portal</span>
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="truncate text-xs sm:text-sm font-black text-white">e-Okul Girişi</p>
                      <p className="truncate text-[10px] sm:text-[11px] font-medium text-red-100/90 leading-tight">Notlar ve devamsızlık</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-black text-white backdrop-blur-xs border border-white/25 shrink-0 group-hover:bg-white/30 transition">
                    <span>Aç</span>
                    <svg className="size-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>

                <a
                  className="tap-scale group flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-3 text-white shadow-md shadow-sky-600/20 transition-all hover:brightness-105 active:scale-[0.99]"
                  href="https://yokatlas.yok.gov.tr/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur-xs border border-white/20 shadow-inner">
                      🗺️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-wider uppercase text-sky-100">YÖK Portal</span>
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="truncate text-xs sm:text-sm font-black text-white">YÖK Atlas</p>
                      <p className="truncate text-[10px] sm:text-[11px] font-medium text-sky-100/90 leading-tight">Üniversite & taban puanları</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-black text-white backdrop-blur-xs border border-white/25 shrink-0 group-hover:bg-white/30 transition">
                    <span>Aç</span>
                    <svg className="size-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>

                <a
                  className="tap-scale group flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-3 text-white shadow-md shadow-emerald-600/20 transition-all hover:brightness-105 active:scale-[0.99]"
                  href="https://ogmmateryal.eba.gov.tr/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur-xs border border-white/20 shadow-inner">
                      📚
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-wider uppercase text-emerald-100">MEB Portal</span>
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="truncate text-xs sm:text-sm font-black text-white">OGM Materyal</p>
                      <p className="truncate text-[10px] sm:text-[11px] font-medium text-emerald-100/90 leading-tight">Ders kitapları & soru havuzu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-black text-white backdrop-blur-xs border border-white/25 shrink-0 group-hover:bg-white/30 transition">
                    <span>Aç</span>
                    <svg className="size-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          )}

          {profile.branches.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.branches.map((branch) => (
                <span
                  className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-crystal"
                  key={branch}
                >
                  {branch}
                </span>
              ))}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!profile.isSignedOut ? (
              <Link
                className="zigo-action-chip tap-scale rounded-lg border border-slate-200 bg-white text-night font-bold shadow-xs hover:bg-slate-50"
                href="/profile/edit"
              >
                Profili Düzenle
              </Link>
            ) : null}
            {!profile.isSignedOut ? (
              <a
                className="zigo-action-chip tap-scale rounded-lg border border-red-200 bg-red-50/80 text-red-800 font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition hover:bg-red-100 hover:border-red-300"
                href="https://e-okul.meb.gov.tr/"
                rel="noopener noreferrer"
                target="_blank"
                title="Milli Eğitim Bakanlığı e-Okul Yönetim Bilgi Sistemi"
              >
                <span>🏫 e-Okul</span>
                <svg className="size-3 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : null}
            {!profile.isSignedOut ? (
              <a
                className="zigo-action-chip tap-scale rounded-lg border border-sky-200 bg-sky-50/80 text-sky-800 font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition hover:bg-sky-100 hover:border-sky-300"
                href="https://yokatlas.yok.gov.tr/"
                rel="noopener noreferrer"
                target="_blank"
                title="YÖK Atlas Üniversite Tercih & Başarı Sıraları"
              >
                <span>🗺️ YÖK Atlas</span>
                <svg className="size-3 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : null}
            {!profile.isSignedOut ? (
              <a
                className="zigo-action-chip tap-scale rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-800 font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition hover:bg-emerald-100 hover:border-emerald-300"
                href="https://ogmmateryal.eba.gov.tr/"
                rel="noopener noreferrer"
                target="_blank"
                title="MEB OGM Materyal: Ders Kitapları, Soru Bankaları ve Denemeler"
              >
                <span>📚 OGM Materyal</span>
                <svg className="size-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : null}
            {!profile.isSignedOut ? (
              <ExamScoreCalculatorModal userRole={profile.role} />
            ) : null}
            {profile.role === "parent" && !profile.isSignedOut ? (
              <CreatePrivateLessonModal
                areas={educationAreas}
                children={parentChildProfiles}
                initialCity={profile.city}
                initialDistrict={profile.district}
                initialGradeLevel={profile.grade_level}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
