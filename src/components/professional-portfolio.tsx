"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { ExpertiseMatrixDisplay } from "@/components/expertise-matrix-display";
import { FollowButton } from "@/components/follow-button";
import { PlatformActivityStats } from "@/components/platform-activity-stats";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import { VerifiedCredentialsBadge } from "@/components/verified-credentials-badge";
import { VerifiedParentReviews } from "@/components/verified-parent-reviews";
import { RequestLessonCTA } from "@/features/lesson/components/request-lesson-cta";
import {
  educationDegreeLabel,
  isOfficialInstitution,
  isVerifiedExpertTeacher,
  type ProfessionalProfilePortfolioData,
  resolveProfessionalBadgeLabel,
  teachingStyleLabel,
} from "@/lib/domain/professional-profile";

type ChildOption = { id: string; name: string };

type ProfessionalPortfolioProps = {
  profile: {
    id: string;
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role: string;
  };
  handle: string;
  branches: string[];
  portfolio: ProfessionalProfilePortfolioData;
  canRequestLesson: boolean;
  isOwnProfile: boolean;
  following: boolean;
  followersCount: number;
  childrenOptions: ChildOption[];
  requestHint?: string;
};

export function ProfessionalPortfolio({
  profile,
  handle,
  branches,
  portfolio,
  canRequestLesson,
  isOwnProfile,
  following,
  followersCount,
  childrenOptions,
  requestHint,
}: ProfessionalPortfolioProps) {
  const { teacher, institution, platform, completedLessons, trust } = portfolio;
  const extras = teacher ?? institution ?? platform;
  const expert = teacher ? isVerifiedExpertTeacher(teacher) : false;
  const official = institution ? isOfficialInstitution(institution) : false;

  const yearsExperience = teacher?.years_of_experience ?? 0;
  const responseMinutes =
    teacher?.response_time_minutes ??
    institution?.response_time_minutes ??
    platform?.response_time_minutes ??
    null;

  const details = (extras?.details ?? {}) as Record<string, unknown>;
  const certificates = Array.isArray(details.certificates)
    ? (details.certificates as string[])
    : [];
  const educationHistory = Array.isArray(details.educationHistory)
    ? (details.educationHistory as string[])
    : [];

  return (
    <div className="relative pb-24">
      <section className="-mx-4 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 px-4 pb-6 pt-5 text-white">
        {extras?.availability_status ? (
          <AvailabilityPill
            note={extras.availability_note}
            status={extras.availability_status}
          />
        ) : null}

        <div className="mt-4 flex items-end gap-4">
          <SocialAvatar
            accent="from-amber-300 via-orange-400 to-rose-400"
            className="size-20 shrink-0 rounded-2xl ring-4 ring-white/20 text-2xl"
            label={profile.full_name}
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">{profile.full_name}</h1>
              {profile.is_verified ? <VerifiedBadge className="size-4" /> : null}
            </div>
            <p className="mt-0.5 text-sm font-semibold text-white/70">@{handle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expert ? (
                <BadgeChip className="bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950">
                  Doğrulanmış Uzman
                </BadgeChip>
              ) : null}
              {official ? <BadgeChip className="bg-emerald-500 text-white">Resmi Kurum</BadgeChip> : null}
              {extras?.badge_type ? (
                <BadgeChip className="bg-white/15 text-white">
                  {resolveProfessionalBadgeLabel(extras.badge_type)}
                </BadgeChip>
              ) : null}
              <VerifiedCredentialsBadge approved={trust?.credentialsApproved} />
            </div>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-4 text-sm leading-6 text-white/85">{profile.bio}</p>
        ) : null}

        {branches.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {branches.slice(0, 4).map((branch) => (
              <BadgeChip className="bg-white/10 text-white/90" key={branch}>
                {branch}
              </BadgeChip>
            ))}
          </div>
        ) : null}
      </section>

      <section className="-mx-4 bg-white px-4 py-5">
        {trust ? (
          <PlatformActivityStats
            avgResponseMinutes={trust.activity.avgResponseMinutes}
            className="mb-4"
            completedStudentCount={trust.activity.completedStudentCount}
            totalCompletedLessons={trust.activity.totalCompletedLessons}
          />
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Deneyim" suffix="yıl" value={yearsExperience > 0 ? String(yearsExperience) : "—"} />
          <KpiCard label="Tamamlanan ders" value={String(completedLessons)} />
          <KpiCard
            label="Yanıt süresi"
            suffix={responseMinutes ? "dk" : undefined}
            value={responseMinutes ? String(responseMinutes) : "—"}
          />
        </div>

        {extras?.soft_skills && extras.soft_skills.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Soft Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {extras.soft_skills.map((skill) => (
                <span
                  className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-800 ring-1 ring-violet-100"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {extras?.video_intro_url ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Tanıtım videosu</p>
              <p className="mt-0.5 text-sm font-bold text-night">30 sn — kendini tanıt</p>
            </div>
            <div className="aspect-video bg-night/5">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
                src={toEmbedUrl(extras.video_intro_url)}
                title={`${profile.full_name} tanıtım videosu`}
              />
            </div>
          </div>
        ) : null}

        {trust && trust.expertise.length > 0 ? (
          <ExpertiseMatrixDisplay className="mt-4 border-0 p-0 shadow-none" selections={trust.expertise} />
        ) : null}

        {trust && trust.reviews.length > 0 ? (
          <VerifiedParentReviews className="mt-4 border-0 p-0 shadow-none" reviews={trust.reviews} />
        ) : null}

        <div className="mt-5 space-y-2">
          {teacher?.cv_url ? (
            <PortfolioAccordion title="CV / Özgeçmiş">
              <Link className="font-black text-crystal underline" href={teacher.cv_url} rel="noreferrer" target="_blank">
                PDF özgeçmişi görüntüle
              </Link>
              {teacher.hourly_rate ? (
                <p className="mt-2 text-sm text-slate-600">
                  Saatlik ücret: <strong>₺{Number(teacher.hourly_rate).toLocaleString("tr-TR")}</strong>
                </p>
              ) : null}
            </PortfolioAccordion>
          ) : null}

          {teacher?.education_degree ? (
            <PortfolioAccordion title="Eğitim bilgileri">
              <ul className="space-y-1 text-sm text-slate-700">
                <li>{educationDegreeLabel(teacher.education_degree)}</li>
                {teacher.teaching_style ? (
                  <li>{teachingStyleLabel(teacher.teaching_style)} öğretim yaklaşımı</li>
                ) : null}
                {educationHistory.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </PortfolioAccordion>
          ) : null}

          {certificates.length > 0 ? (
            <PortfolioAccordion title="Sertifikalar">
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {certificates.map((cert) => (
                  <li key={cert}>{cert}</li>
                ))}
              </ul>
            </PortfolioAccordion>
          ) : null}

          {institution ? (
            <PortfolioAccordion title="Kurum lisans bilgileri">
              <p className="text-sm text-slate-700">
                MEB Ruhsat No: <strong>{institution.license_number}</strong>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {institution.capacity.toLocaleString("tr-TR")} öğrenci kapasitesi · {institution.branch_count} şube
              </p>
              {institution.accreditation.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Akreditasyon: {institution.accreditation.join(", ")}
                </p>
              ) : null}
              {institution.services.length > 0 ? (
                <p className="mt-1 text-xs text-slate-500">Hizmetler: {institution.services.join(", ")}</p>
              ) : null}
            </PortfolioAccordion>
          ) : null}

          {platform ? (
            <PortfolioAccordion title="Platform bilgileri">
              <p className="text-sm text-slate-700">
                {platform.user_base_size.toLocaleString("tr-TR")} öğrenci ·{" "}
                {platform.content_count.toLocaleString("tr-TR")} içerik
              </p>
              <p className="mt-1 text-sm text-slate-600">Model: {platform.subscription_model}</p>
            </PortfolioAccordion>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {isOwnProfile ? (
            <Link className="tap-scale rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-night" href="/profile/edit">
              Profili düzenle
            </Link>
          ) : (
            <FollowButton
              followingId={profile.id}
              initialFollowersCount={followersCount}
              initialFollowing={following}
              showCount
            />
          )}
          <Link className="tap-scale rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-night" href="/questions">
            Soru sor
          </Link>
        </div>
      </section>

      {canRequestLesson ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
          {requestHint ? (
            <p className="mb-2 text-center text-[0.65rem] font-bold text-cyan-800">{requestHint}</p>
          ) : null}
          <RequestLessonCTA
            childrenOptions={childrenOptions}
            teacherId={profile.id}
            teacherName={profile.full_name}
          />
        </div>
      ) : null}
    </div>
  );
}

function AvailabilityPill({
  status,
  note,
}: {
  status: "available" | "busy" | "scheduled";
  note: string | null;
}) {
  const available = status === "available";
  const label =
    status === "available"
      ? "Şu an müsait"
      : status === "scheduled"
        ? note ?? "Planlı müsaitlik"
        : note ?? "Şu an meşgul";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
        available ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40" : "bg-white/10 text-white/70 ring-1 ring-white/20"
      }`}
    >
      <span className={`size-2 rounded-full ${available ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
      {label}
    </div>
  );
}

function KpiCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
      <p className="text-xl font-black text-night">
        {value}
        {suffix ? <span className="ml-0.5 text-sm font-bold text-slate-500">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-[0.62rem] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function BadgeChip({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function PortfolioAccordion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-100 bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-night marker:content-none">
        {title}
        <svg
          aria-hidden="true"
          className="size-4 text-slate-400 transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-slate-100 px-4 py-3">{children}</div>
    </details>
  );
}

function toEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      const videoId =
        parsed.hostname.includes("youtu.be")
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return url;
  }
  return url;
}
