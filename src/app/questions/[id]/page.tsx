import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { BreadcrumbJsonLd, QaPageJsonLd } from "@/components/seo/json-ld";
import { SocialAvatar, SocialPill, VerifiedBadge } from "@/components/social-primitives";
import { hasSupabaseEnv } from "@/lib/config";
import { INDEXABLE_CREATOR_ROLES, NOINDEX, SITE_URL } from "@/lib/domain/seo-indexing";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { asUntyped } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";

type PublicQuestionPageProps = {
  params: Promise<{ id: string }>;
};

type PublicSolvedAnswer = {
  id: string;
  teacher_id: string;
  content: string;
  created_at: string;
  teacher: {
    id?: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role?: string | null;
  } | null;
};

type PublicSolvedQuestion = {
  id: string;
  area_id: number;
  title: string;
  description: string;
  image_url: string | null;
  is_resolved: boolean;
  created_at: string;
  area?: { area_name?: string | null } | null;
  answers?: PublicSolvedAnswer[];
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getPublicSolvedQuestion(id: string): Promise<PublicSolvedQuestion | null> {
  if (!hasSupabaseEnv() || !UUID_REGEX.test(id)) return null;

  const db = (hasServiceRoleEnv() ? createAdminClient() : null) ?? (await createClient());

  const { data, error } = await asUntyped(db)
    .from("questions")
    .select(`
      id,
      area_id,
      title,
      description,
      image_url,
      is_resolved,
      created_at,
      area:education_areas!area_id(area_name),
      answers(
        id,
        teacher_id,
        content,
        created_at,
        teacher:users!teacher_id(id, full_name, avatar_url, is_verified, role)
      )
    `)
    .eq("id", id)
    .eq("is_resolved", true)
    .maybeSingle();

  if (error || !data) return null;

  const question = data as PublicSolvedQuestion;
  const creatorRoles = new Set<string>(INDEXABLE_CREATOR_ROLES);
  const teacherAnswers = (question.answers ?? []).filter(
    (ans) =>
      ans.content?.trim().length > 0 &&
      ans.teacher &&
      (ans.teacher.is_verified || (ans.teacher.role && creatorRoles.has(ans.teacher.role))),
  );

  // Privacy & quality guard: only publish resolved questions with at least one verified teacher/creator answer
  if (teacherAnswers.length === 0) return null;

  return {
    ...question,
    answers: teacherAnswers,
  };
}

export async function generateMetadata({ params }: PublicQuestionPageProps): Promise<Metadata> {
  const { id } = await params;
  const question = await getPublicSolvedQuestion(id);

  if (!question) {
    return {
      title: "Çözümlü Soru Bulunamadı | Zigo",
      robots: NOINDEX,
    };
  }

  const areaName = question.area?.area_name || "Eğitim";
  const firstAnswerSnippet = question.answers?.[0]?.content?.slice(0, 140) || question.description.slice(0, 140);

  return {
    title: `${question.title} — ${areaName} Çözümlü Soru | Zigo`,
    description: `${areaName} sorusu ve doğrulanmış Zigo öğretmeni çözümü: ${firstAnswerSnippet}`,
    alternates: {
      canonical: `/questions/${question.id}`,
    },
    openGraph: {
      title: `${question.title} | Zigo Soru-Cevap`,
      description: firstAnswerSnippet,
      type: "article",
      url: `${SITE_URL}/questions/${question.id}`,
    },
  };
}

export default async function PublicQuestionPage({ params }: PublicQuestionPageProps) {
  const { id } = await params;
  const question = await getPublicSolvedQuestion(id);

  if (!question) {
    notFound();
  }

  const areaName = question.area?.area_name || "Soru-Cevap";
  const pageUrl = `${SITE_URL}/questions/${question.id}`;
  const answers = question.answers ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: "Soru & Cevap", url: "/questions" },
          { name: question.title, url: `/questions/${question.id}` },
        ]}
      />
      <QaPageJsonLd
        answers={answers.map((ans) => ({
          text: ans.content,
          dateCreated: ans.created_at,
          authorName: ans.teacher?.full_name || "Doğrulanmış Zigo Öğretmeni",
          authorUrl: ans.teacher_id ? `${SITE_URL}/profile/${ans.teacher_id}` : undefined,
        }))}
        dateCreated={question.created_at}
        questionText={question.description || question.title}
        questionTitle={question.title}
        url={pageUrl}
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:rounded-2xl sm:border sm:shadow-xs">
        <BackButton className="tap-scale flex size-9 items-center justify-center text-night" fallbackHref="/questions" />
        <span className="text-xs font-black uppercase tracking-wider text-crystal">
          {areaName} · Çözümlü Soru
        </span>
        <span className="w-9" />
      </div>

      {/* Question Card (Student author is strictly anonymized for privacy / KVKK) */}
      <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <SocialPill tone="primary">✓ Öğretmen Çözümlü</SocialPill>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {areaName}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Zigo Öğrencisi · {new Date(question.created_at).toLocaleDateString("tr-TR")}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-black leading-snug text-night sm:text-2xl">
          {question.title}
        </h1>

        {question.description && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {question.description}
          </p>
        )}

        {question.image_url && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.image_url}
              alt={question.title}
              className="max-h-96 w-full object-contain"
            />
          </div>
        )}
      </article>

      {/* Verified Teacher Answers */}
      <section id="cozum" className="space-y-3">
        <h2 className="px-1 text-sm font-black uppercase tracking-wider text-slate-500">
          Doğrulanmış Öğretmen Çözümü ({answers.length})
        </h2>

        {answers.map((answer, idx) => (
          <div
            key={answer.id}
            id={idx === 0 ? "cozum-onayli" : `cozum-${idx + 1}`}
            className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white p-6 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/profile/${answer.teacher_id}`}
                className="flex items-center gap-3 group"
              >
                <SocialAvatar
                  className="size-10 shrink-0"
                  imageUrl={answer.teacher?.avatar_url}
                  label={answer.teacher?.full_name || "Öğretmen"}
                  ring={false}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-night group-hover:text-violet-700">
                      {answer.teacher?.full_name || "Zigo Öğretmeni"}
                    </span>
                    {answer.teacher?.is_verified && <VerifiedBadge className="size-4" />}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Doğrulanmış Öğretmen · {new Date(answer.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </Link>
              {idx === 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">
                  ✓ Onaylı Çözüm
                </span>
              )}
            </div>

            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {answer.content}
            </div>
          </div>
        ))}
      </section>

      {/* Conversion CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-night via-violet-950 to-crystal p-6 text-center text-white shadow-lg">
        <h2 className="text-lg font-black">Senin de takıldığın bir soru mu var?</h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold text-white/80">
          Sorunun fotoğrafını çekip Zigo&apos;ya yükle; doğrulanmış branş öğretmenleri adım adım çözsün.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/questions"
            className="tap-scale rounded-xl bg-white px-5 py-2.5 text-xs font-black text-night shadow-sm hover:bg-slate-100"
          >
            ❓ Yeni Soru Sor
          </Link>
          <Link
            href="/konular"
            className="tap-scale rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-xs font-black text-white hover:bg-white/20"
          >
            📚 LGS &amp; YKS Konu Rehberi
          </Link>
        </div>
      </section>
    </div>
  );
}
