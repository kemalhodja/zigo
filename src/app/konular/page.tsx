import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, Clock, Sparkles } from "lucide-react";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getAllTopics, getGroupedSubjects } from "@/lib/domain/curriculum-topics";

export const metadata: Metadata = {
  title: "LGS & YKS Konu Rehberi 2026 | Ders Notları, Taktikler ve Mini Testler",
  description:
    "2026 MEB LGS ve ÖSYM YKS (TYT - AYT) tüm dersler için konu özetleri, temel formüller, sık yapılan hatalar ve çözümlü interaktif mini testler.",
  alternates: {
    canonical: "/konular",
  },
  openGraph: {
    title: "LGS & YKS Konu Rehberi 2026 | Zigo",
    description:
      "LGS ve YKS hazırlığında tüm konuların özetleri, püf noktaları ve çözümlü alıştırma soruları.",
    url: "https://www.zigo.com.tr/konular",
    type: "website",
  },
};

export default function TopicsHubPage() {
  const lgsSubjects = getGroupedSubjects("lgs");
  const yksSubjects = getGroupedSubjects("yks");
  const totalCount = getAllTopics().length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: "Konu Rehberi", url: "/konular" },
        ]}
      />

      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-700">
            <BookOpen className="size-4" />
            <span>2026 Müfredat Uyumlu · {totalCount} Detaylı Konu</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight text-night">
            LGS &amp; YKS Konu Anlatımı ve Pratik Rehberi
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
            Her konu için sınav soru ağırlığı, kritik kurallar, sık yapılan hatalar ve anında çözümlü interaktif mini testler bir arada.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#lgs"
              className="tap-scale rounded-xl bg-violet-600 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-sm hover:bg-violet-700 transition"
            >
              LGS Konuları (8. Sınıf)
            </a>
            <a
              href="#yks"
              className="tap-scale rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-sm hover:bg-indigo-700 transition"
            >
              YKS Konuları (TYT &amp; AYT)
            </a>
            <Link
              href="/lgs-puan-hesaplama"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Calculator className="size-4 text-emerald-600" />
              <span>LGS Puan Hesapla</span>
            </Link>
            <Link
              href="/yks-puan-hesaplama"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Calculator className="size-4 text-indigo-600" />
              <span>YKS Puan Hesapla</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-14">
        <section id="lgs" className="space-y-6 scroll-mt-16">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-violet-600">
                Ortaokul · 8. Sınıf
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-night">
                LGS Konuları
              </h2>
            </div>
            <Link
              href="/lgs-puan-hesaplama"
              className="text-xs font-black text-violet-700 hover:underline"
            >
              LGS Puan Robotu →
            </Link>
          </div>

          <div className="space-y-8">
            {lgsSubjects.map((subject) => (
              <div key={subject.subjectSlug} className="space-y-3">
                <h3 className="text-base sm:text-lg font-black text-night">
                  {subject.subjectName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subject.topics.map((topic) => (
                    <Link
                      key={topic.topicSlug}
                      href={`/konular/${topic.exam}/${topic.subjectSlug}/${topic.topicSlug}`}
                      className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-violet-300 hover:shadow-md flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-700">
                            {topic.avgQuestions}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {topic.studyMinutes} dk
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-night group-hover:text-violet-700 transition">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {topic.shortDesc}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-violet-700">
                        <span>Konuyu İncele</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="yks" className="space-y-6 scroll-mt-16">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                Lise · Üniversite Hazırlık
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-night">
                YKS (TYT &amp; AYT) Konuları
              </h2>
            </div>
            <Link
              href="/yks-puan-hesaplama"
              className="text-xs font-black text-indigo-700 hover:underline"
            >
              YKS Puan Robotu →
            </Link>
          </div>

          <div className="space-y-8">
            {yksSubjects.map((subject) => (
              <div key={subject.subjectSlug} className="space-y-3">
                <h3 className="text-base sm:text-lg font-black text-night">
                  {subject.subjectName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subject.topics.map((topic) => (
                    <Link
                      key={topic.topicSlug}
                      href={`/konular/${topic.exam}/${topic.subjectSlug}/${topic.topicSlug}`}
                      className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-indigo-300 hover:shadow-md flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700">
                            {topic.avgQuestions}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {topic.studyMinutes} dk
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-night group-hover:text-indigo-700 transition">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {topic.shortDesc}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-700">
                        <span>Konuyu İncele</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-900 to-indigo-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
              <Sparkles className="size-4" />
              <span>Zigo ile Pratik Yap</span>
            </span>
            <h2 className="text-xl font-black">
              Öğretmenlere 1 Ay, Öğrenci &amp; Velilere 7 Gün Tam Deneme
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Konu özetlerinin ötesine geç: Zigo&apos;da soru sor, canlı bilgi düellolarına katıl ve odak odalarıyla çalışma disiplinini koru.
            </p>
          </div>
          <Link
            href="/auth"
            className="tap-scale shrink-0 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg hover:bg-amber-300 transition"
          >
            Ücretsiz Başla →
          </Link>
        </section>
      </main>
    </div>
  );
}
