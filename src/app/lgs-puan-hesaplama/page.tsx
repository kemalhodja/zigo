import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { LgsPageCalculator } from "@/components/calculator/lgs-page-calculator";
import { BreadcrumbJsonLd, LgsFaqJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "LGS Puan Hesaplama 2026 | Güncel MEB Katsayıları & Yüzdelik Dilim Robotu",
  description:
    "2026 MEB LGS puanınızı resmi standart sapma katsayıları ile anında hesaplayın. Türkçe, Matematik, Fen 4 katsayı hesabı, 3 yanlış 1 doğru kuralı, tahmini yüzdelik dilim ve lise taban puanları.",
  keywords: [
    "lgs puan hesaplama",
    "lgs puan hesaplama 2026",
    "lgs yüzdelik dilim hesaplama",
    "meb lgs puan hesaplama",
    "lgs net hesaplama",
    "lgs kaç net kaç puan",
    "lgs 500 tam puan",
    "e-okul lgs",
    "ogm materyal lgs",
  ],
  alternates: {
    canonical: "/lgs-puan-hesaplama",
  },
  openGraph: {
    title: "LGS Puan Hesaplama 2026 | Güncel MEB Katsayıları - Zigo",
    description:
      "MEB resmi verileriyle 2026 LGS puanınızı, netlerinizi ve genel/il yüzdelik diliminizi anında hesaplayın.",
    url: "https://www.zigo.com.tr/lgs-puan-hesaplama",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LGS Puan Hesaplama 2026 - Zigo",
    description:
      "2026 MEB standart sapma katsayıları ile güncel LGS puanı ve yüzdelik dilim hesaplama robotu.",
  },
};

export default function LgsCalculatorPage() {
  const breadcrumbItems = [
    { name: "Ana Sayfa", url: "/" },
    { name: "Sınav Sezonu", url: "/exams" },
    { name: "LGS Puan Hesaplama", url: "/lgs-puan-hesaplama" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <LgsFaqJsonLd />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3.5 backdrop-blur-md">
        <Link
          href="/exams"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
          title="Sınav Sezonu"
        >
          ←
        </Link>
        <h1 className="text-sm sm:text-base font-black text-night">LGS Puan Hesaplama 2026</h1>
        <Link
          href="/yks-puan-hesaplama"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          YKS Hesapla →
        </Link>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
        {/* Ekmek Kırıntısı (Breadcrumbs) - Google & Kullanıcı Dostu */}
        <nav aria-label="Ekmek Kırıntısı" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-night transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/exams" className="hover:text-night transition-colors">Sınav Sezonu</Link>
          <span>/</span>
          <span className="font-bold text-night" aria-current="page">LGS Puan Hesaplama</span>
        </nav>

        {/* Giriş Bilgi Banner */}
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-700">
            🎒 MEB 2026/2025 Resmi Katsayıları
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-night">
            LGS Puanı ve Yüzdelik Dilim Hesaplama
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Doğru ve yanlış sayılarınızı girin; MEB Merkezi Sınav İstatistik ve Standart Sapma Değerlendirme Raporu formülleriyle puanınızı ve tahmini diliminizi hesaplayın.
          </p>
        </div>

        {/* İnteraktif Hesaplayıcı */}
        <LgsPageCalculator />

        {/* LGS Katsayı Rehberi & MEB Formülü */}
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-slate-700">
          <h3 className="text-lg font-black text-night">LGS Puanı Nasıl Hesaplanır?</h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            Milli Eğitim Bakanlığı (MEB) tarafından uygulanan Liselere Geçiş Sistemi (LGS) sınavında toplam <b>90 soru</b> sorulur. Sınav, Sözel Bölüm (50 soru) ve Sayısal Bölüm (40 soru) olmak üzere iki oturumda gerçekleşir.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-black">
                  <th className="py-2.5 px-3">Ders</th>
                  <th className="py-2.5 px-3">Soru Sayısı</th>
                  <th className="py-2.5 px-3">Ağırlık Katsayısı</th>
                  <th className="py-2.5 px-3">Etki Oranı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-2 px-3 font-bold text-night">Türkçe</td>
                  <td className="py-2 px-3">20</td>
                  <td className="py-2 px-3 font-bold text-violet-600">4 Katsayı</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">%26.7</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-night">Matematik</td>
                  <td className="py-2 px-3">20</td>
                  <td className="py-2 px-3 font-bold text-violet-600">4 Katsayı</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">%26.7</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-night">Fen Bilimleri</td>
                  <td className="py-2 px-3">20</td>
                  <td className="py-2 px-3 font-bold text-violet-600">4 Katsayı</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">%26.7</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-night">T.C. İnkılap Tarihi</td>
                  <td className="py-2 px-3">10</td>
                  <td className="py-2 px-3 font-bold text-slate-600">1 Katsayı</td>
                  <td className="py-2 px-3">%6.6</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-night">Din Kültürü</td>
                  <td className="py-2 px-3">10</td>
                  <td className="py-2 px-3 font-bold text-slate-600">1 Katsayı</td>
                  <td className="py-2 px-3">%6.6</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-night">Yabancı Dil</td>
                  <td className="py-2 px-3">10</td>
                  <td className="py-2 px-3 font-bold text-slate-600">1 Katsayı</td>
                  <td className="py-2 px-3">%6.6</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-xs text-slate-600 space-y-2">
            <p>
              📌 <b>3 Yanlış 1 Doğruyu Götürür:</b> Her alt testte adayın yanlış cevap sayısının üçte biri doğru cevap sayısından çıkarılarak ham net bulunur.
            </p>
            <p>
              📌 <b>Puan Aralığı:</b> LGS Merkezi Sınav Puanı 100 taban puan ile 500 tavan puan arasında dağılır. Standart sapma, o yıl sınava katılan tüm öğrencilerin Türkiye ortalamalarına göre hesaplanır.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

