import type { Metadata } from "next";
import Link from "next/link";

import { ExamScoreCalculatorModal } from "@/components/exam-score-calculator-modal";
import { ExamFaqJsonLd } from "@/components/seo/json-ld";
import { getNextExams, seasonPhase } from "@/lib/domain/exam-season";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "LGS ve YKS Puan Hesaplama 2026 | Sınav Sayacı & Sıralama",
  description:
    "2026 LGS ve YKS (TYT, AYT, YDT) puanınızı MEB ve ÖSYM resmi standart sapma katsayıları ile anında hesaplayın. Geri sayım sayacı, OBP diploma katkısı ve tahmini yüzdelik dilim.",
  keywords: [
    "lgs puan hesaplama",
    "yks puan hesaplama",
    "lgs puan hesaplama 2026",
    "yks puan hesaplama 2026",
    "tyt puan hesaplama",
    "ayt puan hesaplama",
    "ydt puan hesaplama",
    "obp hesaplama",
    "kırık obp",
    "lgs sayaç",
    "yks sayaç",
    "lgs kaç gün kaldı",
    "yks kaç gün kaldı",
    "e-okul meb",
    "yök atlas tercih",
    "meb ogm materyal",
  ],
  alternates: {
    canonical: "/exams",
  },
  openGraph: {
    title: "LGS ve YKS Puan Hesaplama 2026 | Sınav Sayacı & Sıralama - Zigo",
    description:
      "MEB ve ÖSYM güncel standart katsayılarıyla LGS ve YKS (TYT-AYT) puanınızı, yüzdelik diliminizi ve yerleştirme puanınızı hesaplayın.",
    url: "https://www.zigo.com.tr/exams",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LGS ve YKS Puan Hesaplama 2026 - Zigo",
    description:
      "2026 LGS ve YKS puanınızı resmi formüllerle anında hesaplayın. Geri sayım sayacı ve rehberlik.",
  },
};

export const dynamic = "force-dynamic";

type LeagueRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  weekly_points: number;
  rank: number;
};

async function getLeague(): Promise<LeagueRow[]> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return [];
  const { data } = await supabase.rpc("get_weekly_league", { p_limit: 20 });
  return ((data ?? []) as Omit<LeagueRow, "rank">[]).map((row, i) => ({ ...row, rank: i + 1 }));
}

export default async function ExamSeasonPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const exams = getNextExams();
  const league = await getLeague();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <ExamFaqJsonLd />
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-night">🏁 Sınav Sezonu</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl space-y-6 p-4">
        {/* Countdown cards */}
        {exams.map((exam) => {
          const phase = seasonPhase(exam.daysRemaining);
          const urgent = exam.daysRemaining <= 30;
          return (
            <div
              key={`${exam.key}-${exam.year}`}
              className={`overflow-hidden rounded-3xl border shadow-sm ${
                urgent ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white" : "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white"
              }`}
            >
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {exam.audience} · {exam.year}
                  </p>
                  <h2 className="text-lg font-black text-night">{exam.shortName}</h2>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-black tabular-nums ${urgent ? "text-rose-600" : "text-indigo-600"}`}>
                    {exam.daysRemaining}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">gün kaldı</p>
                </div>
              </div>
              <div className="border-t border-white/60 bg-white/60 px-5 py-3">
                <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider ${urgent ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {phase.label}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-600">{phase.tip}</p>
              </div>
            </div>
          );
        })}

        {/* LGS & YKS Puan Hesaplama Robotu & Resmi Portallar */}
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white shadow-lg shadow-indigo-600/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-100 backdrop-blur-xs border border-white/25">
                ⚡ 2026/2025 MEB & ÖSYM
              </span>
              <h2 className="mt-2 text-lg font-black text-white">LGS & YKS Puan Hesaplama</h2>
              <p className="mt-1 text-xs text-purple-100/90 font-medium leading-relaxed">
                Netlerini gir, MEB ve ÖSYM resmi katsayılarıyla ham puanını, yüzdelik dilimini ve yerleştirme puanını anında gör.
              </p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-xs border border-white/30 shadow-inner">
              🧮
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ExamScoreCalculatorModal
              userRole={profile?.role}
              trigger={
                <button
                  type="button"
                  className="tap-scale inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-purple-900 shadow-md transition hover:bg-purple-50 active:scale-95"
                >
                  <span>Puanımı Hesapla</span>
                  <span>→</span>
                </button>
              }
            />
            <Link
              href="/lgs-puan-hesaplama"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2.5 text-xs font-black text-white backdrop-blur-xs border border-white/25 hover:bg-white/30 transition"
            >
              <span>🎒 LGS Sayfası</span>
            </Link>
            <Link
              href="/yks-puan-hesaplama"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2.5 text-xs font-black text-white backdrop-blur-xs border border-white/25 hover:bg-white/30 transition"
            >
              <span>🎓 YKS Sayfası</span>
            </Link>
          </div>
        </div>

        {/* Resmi Eğitim Portalları */}
        <div className="grid grid-cols-3 gap-2">
          <a
            href="https://e-okul.meb.gov.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-3 text-center shadow-xs transition hover:bg-red-50/50"
          >
            <span className="text-xl">🏫</span>
            <span className="mt-1 text-[0.7rem] font-black text-red-700">e-Okul</span>
            <span className="text-[9px] font-semibold text-slate-400">MEB Portalı</span>
          </a>
          <a
            href="https://yokatlas.yok.gov.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale flex flex-col items-center justify-center rounded-2xl border border-sky-100 bg-white p-3 text-center shadow-xs transition hover:bg-sky-50/50"
          >
            <span className="text-xl">🗺️</span>
            <span className="mt-1 text-[0.7rem] font-black text-sky-800">YÖK Atlas</span>
            <span className="text-[9px] font-semibold text-slate-400">Üniversite Tercih</span>
          </a>
          <a
            href="https://ogmmateryal.eba.gov.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white p-3 text-center shadow-xs transition hover:bg-emerald-50/50"
          >
            <span className="text-xl">📚</span>
            <span className="mt-1 text-[0.7rem] font-black text-emerald-800">OGM Materyal</span>
            <span className="text-[9px] font-semibold text-slate-400">MEB Soru Havuzu</span>
          </a>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/rooms" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🎯</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Odak Odası</p>
          </Link>
          <Link href="/quizzes" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🏆</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Quiz Arena</p>
          </Link>
          <Link href="/reviews" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🧠</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Bugünün Tekrarı</p>
          </Link>
        </div>

        {/* Weekly league */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            ⚡ Haftalık Lig
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-black text-amber-600">
              son 7 gün
            </span>
          </h3>

          {!profile ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
              Lige girmek için giriş yap.
            </p>
          ) : league.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
              Bu hafta henüz puan yok. İlk sıralara girmek için bir odak bloğu tamamla!
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {league.map((row) => {
                const isViewer = row.user_id === profile?.id;
                return (
                  <div
                    key={row.user_id}
                    className={`flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 ${
                      isViewer ? "bg-indigo-50/70" : ""
                    }`}
                  >
                    <span
                      className={`w-7 text-center text-sm font-black ${
                        row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-slate-400" : row.rank === 3 ? "text-orange-400" : "text-slate-300"
                      }`}
                    >
                      {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-night">
                      {row.full_name || "Öğrenci"}
                      {isViewer ? <span className="ml-1 text-xs font-black text-indigo-500">(sen)</span> : null}
                    </span>
                    <span className="text-sm font-black tabular-nums text-indigo-600">
                      {Number(row.weekly_points)} puan
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sık Sorulan Sorular (SEO FAQ Accordion) */}
        <section className="space-y-3 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            ❓ Sınav Puanı Hesaplama Rehberi & SSS
          </h3>
          <div className="space-y-2">
            <details className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs open:ring-2 open:ring-indigo-100">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-night">
                <span>LGS puanı 2026 yılında nasıl hesaplanır?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                2026 MEB LGS puanı; Türkçe, Matematik ve Fen Bilimleri testleri 4 katsayı, İnkılap Tarihi, Din Kültürü ve Yabancı Dil testleri 1 katsayı ile ağırlıklandırılarak standart sapma formülleriyle hesaplanır. LGS&apos;de 3 yanlış 1 doğruyu götürür ve taban puan 100, tavan puan 500&apos;dür.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs open:ring-2 open:ring-indigo-100">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-night">
                <span>YKS (TYT ve AYT) puan hesabı nasıl yapılır?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                YKS puanı hesaplanırken TYT puanının %40&apos;ı, AYT veya YDT puanının ise %60&apos;ı alınır. YKS&apos;de 4 yanlış 1 doğru cevabı götürür. Ham puanın üzerine adayın diploma notundan hesaplanan OBP (Okul Başarı Puanı) eklenerek yerleştirme puanı oluşturulur.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs open:ring-2 open:ring-indigo-100">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-night">
                <span>OBP katkısı nedir ve Kırık OBP nasıl hesaplanır?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                Diploma notu 5 ile çarpılarak adayın OBP&apos;si bulunur (100 diploma notu = 500 OBP). Standart yerleştirmede OBP 0.12 ile çarpılır (maksimum +60 puan). Bir önceki yıl üniversiteye yerleşen adayların katsayısı yarıya düşer (0.06 ile çarpılır, Kırık OBP).
              </p>
            </details>
          </div>
        </section>
      </main>
    </div>
  );
}
