import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { TopicMiniQuiz } from "@/components/seo/topic-mini-quiz";
import {
  getAllTopics,
  getSubjectTopics,
  getTopicByParams,
} from "@/lib/domain/curriculum-topics";
import { SITE_URL } from "@/lib/domain/seo-indexing";

type TopicPageProps = {
  params: Promise<{
    exam: string;
    subject: string;
    topic: string;
  }>;
};

export function generateStaticParams() {
  return getAllTopics().map((t) => ({
    exam: t.exam,
    subject: t.subjectSlug,
    topic: t.topicSlug,
  }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { exam, subject, topic: topicSlug } = await params;
  const item = getTopicByParams(exam, subject, topicSlug);

  if (!item) {
    return {
      title: "Konu Bulunamadı | Zigo",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/konular/${item.exam}/${item.subjectSlug}/${item.topicSlug}`;
  const pageTitle = `${item.title} | ${item.subjectName} Konu Anlatımı 2026`;
  const ogImageUrl = `/api/og/topic?title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subjectName)}&exam=${encodeURIComponent(item.examLabel)}&questions=${encodeURIComponent(item.avgQuestions)}`;

  return {
    title: pageTitle,
    description: `${item.shortDesc} ${item.examLabel} sınavında ortalama ${item.avgQuestions}. Özet kurallar, taktikler ve çözümlü mini test.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: pageTitle,
      description: item.shortDesc,
      url: `${SITE_URL}${canonicalPath}`,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: item.shortDesc,
      images: [ogImageUrl],
    },
  };
}

export default async function TopicDetailPage({ params }: TopicPageProps) {
  const { exam, subject, topic: topicSlug } = await params;
  const item = getTopicByParams(exam, subject, topicSlug);

  if (!item) {
    notFound();
  }

  const canonicalPath = `/konular/${item.exam}/${item.subjectSlug}/${item.topicSlug}`;
  const siblingTopics = getSubjectTopics(item.exam, item.subjectSlug);
  const currentIdx = siblingTopics.findIndex((t) => t.topicSlug === item.topicSlug);
  const prevTopic = currentIdx > 0 ? siblingTopics[currentIdx - 1] : null;
  const nextTopic =
    currentIdx >= 0 && currentIdx < siblingTopics.length - 1
      ? siblingTopics[currentIdx + 1]
      : null;

  const calcHref =
    item.exam === "lgs" ? "/lgs-puan-hesaplama" : "/yks-puan-hesaplama";
  const calcLabel =
    item.exam === "lgs" ? "2026 LGS Puan Hesapla" : "2026 YKS Puan Hesapla";

  const learningResourceSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${item.title} — ${item.subjectName}`,
    description: item.shortDesc,
    url: `${SITE_URL}${canonicalPath}`,
    educationalLevel: item.examLabel,
    learningResourceType: "Konu Özeti ve Alıştırma Testi",
    inLanguage: "tr-TR",
    isAccessibleForFree: true,
    provider: {
      "@type": "EducationalOrganization",
      name: "Zigo",
      url: SITE_URL,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${item.title} konusundan ${item.exam.toUpperCase()} sınavında kaç soru çıkar?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${item.subjectName} kapsamında ${item.title} konusundan son yıllardaki sınav dağılımına göre ortalama ${item.avgQuestions} gelmektedir.`,
        },
      },
      {
        "@type": "Question",
        name: `${item.title} konusuna nasıl çalışılmalı?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${item.strategyTip} Ortalama ${item.studyMinutes} dakikalık odaklanmış konu tekrarının ardından çözümlü testlerle pekiştirme yapılması önerilir.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: "Konu Rehberi", url: "/konular" },
          { name: item.subjectName, url: `/konular#${item.exam}` },
          { name: item.title, url: canonicalPath },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(learningResourceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <Link
            href="/konular"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-600 hover:text-night transition"
          >
            <ArrowLeft className="size-4" />
            <span>Tüm Konular</span>
          </Link>
          <span className="text-xs font-black uppercase tracking-wider text-violet-700">
            {item.subjectName}
          </span>
          <Link
            href={calcHref}
            className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800"
          >
            <Calculator className="size-3.5" />
            <span className="hidden sm:inline">{calcLabel}</span>
            <span className="sm:hidden">Puan Hesapla</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Hero */}
        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">
              {item.examLabel}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
              Ortalama {item.avgQuestions}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Zorluk: {item.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              <Clock className="size-3.5" />
              {item.studyMinutes} dk çalışma
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-night">
            {item.title}
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
            {item.shortDesc}
          </p>
        </article>

        {/* Temel Kurallar ve Özet */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-violet-700">
            <BookOpen className="size-5" />
            <h2 className="text-lg sm:text-xl font-black text-night">
              Bilinmesi Gereken Temel Kurallar
            </h2>
          </div>
          <ul className="space-y-3">
            {item.keyPoints.map((point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 leading-relaxed"
              >
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sık Yapılan Hatalar & Sınav Taktiği */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-3xl border border-rose-200/80 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <h2 className="text-base sm:text-lg font-black text-night">
                Sık Yapılan Hatalar
              </h2>
            </div>
            <ul className="space-y-2.5">
              {item.commonMistakes.map((mistake, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-rose-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-950 leading-relaxed"
                >
                  • {mistake}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="size-5" />
              <h2 className="text-base sm:text-lg font-black text-night">
                Sınav Çözüm Taktiği
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
              {item.strategyTip}
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href={`/explore?q=${encodeURIComponent(item.title)}`}
                className="tap-scale rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition"
              >
                Zigo&apos;da İçerikleri Keşfet
              </Link>
              <Link
                href="/questions"
                className="tap-scale rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Soru Sor
              </Link>
            </div>
          </section>
        </div>

        {/* İnteraktif Mini Test */}
        <TopicMiniQuiz topicTitle={item.title} questions={item.questions} />

        {/* Sık Sorulan Sorular */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-black text-night">
            Sık Sorulan Sorular
          </h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-black text-night">
                {item.title} konusundan {item.exam.toUpperCase()} sınavında kaç soru çıkar?
              </dt>
              <dd className="mt-1 text-slate-600 font-medium">
                {item.subjectName} testinde son yıllardaki dağılıma göre ortalama{" "}
                <strong>{item.avgQuestions}</strong> gelmektedir.
              </dd>
            </div>
            <div>
              <dt className="font-black text-night">
                Bu konuya ne kadar süre ayırmalıyım?
              </dt>
              <dd className="mt-1 text-slate-600 font-medium">
                Temel kuralları gözden geçirmek için yaklaşık{" "}
                <strong>{item.studyMinutes} dakika</strong> ayırıp hemen ardından yeni nesil sorularla pekiştirme yapabilirsiniz.
              </dd>
            </div>
          </dl>
        </section>

        {/* Önceki / Sonraki Konu */}
        <nav
          aria-label="Konu Gezinimi"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
        >
          {prevTopic ? (
            <Link
              href={`/konular/${prevTopic.exam}/${prevTopic.subjectSlug}/${prevTopic.topicSlug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 hover:border-violet-300 transition flex items-center gap-3"
            >
              <ArrowLeft className="size-4 shrink-0 text-slate-400 group-hover:text-violet-600 transition" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Önceki Konu
                </p>
                <p className="truncate text-sm font-black text-night group-hover:text-violet-700">
                  {prevTopic.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextTopic ? (
            <Link
              href={`/konular/${nextTopic.exam}/${nextTopic.subjectSlug}/${nextTopic.topicSlug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 hover:border-violet-300 transition flex items-center justify-end gap-3 text-right"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Sonraki Konu
                </p>
                <p className="truncate text-sm font-black text-night group-hover:text-violet-700">
                  {nextTopic.title}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-slate-400 group-hover:text-violet-600 transition" />
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
