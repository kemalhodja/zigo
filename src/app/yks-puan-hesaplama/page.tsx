import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { YksPageCalculator } from "@/components/calculator/yks-page-calculator";
import { BreadcrumbJsonLd, YksFaqJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "YKS Puan Hesaplama 2026 | TYT - AYT (SAY, EA, SÖZ, DİL) & OBP Hesaplama",
  description:
    "2026 ÖSYM güncel verileri ile YKS (TYT, AYT, YDT) puanınızı ve sıralamanızı anında hesaplayın. Sayısal, Eşit Ağırlık, Sözel, Dil puan türleri, diploma notu OBP katkısı, Kırık OBP ve YÖK Atlas taban puanları.",
  keywords: [
    "yks puan hesaplama",
    "yks puan hesaplama 2026",
    "tyt puan hesaplama",
    "ayt puan hesaplama",
    "sayısal puan hesaplama",
    "eşit ağırlık puan hesaplama",
    "sözel puan hesaplama",
    "ydt dil puan hesaplama",
    "obp hesaplama",
    "kırık obp hesaplama",
    "yks sıralama hesaplama",
    "yök atlas tercih",
  ],
  alternates: {
    canonical: "/yks-puan-hesaplama",
  },
  openGraph: {
    title: "YKS Puan Hesaplama 2026 | TYT - AYT & OBP Robotu - Zigo",
    description:
      "ÖSYM resmi katsayıları ile 2026 YKS (TYT-AYT-YDT) ham ve yerleştirme puanınızı, tahmini başarı sıranızı hesaplayın.",
    url: "https://www.zigo.com.tr/yks-puan-hesaplama",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YKS Puan Hesaplama 2026 - Zigo",
    description:
      "TYT, AYT Sayısal, Eşit Ağırlık, Sözel ve YDT güncel puan ve sıralama hesaplama robotu.",
  },
};

export default function YksCalculatorPage() {
  const breadcrumbItems = [
    { name: "Ana Sayfa", url: "/" },
    { name: "Sınav Sezonu", url: "/exams" },
    { name: "YKS Puan Hesaplama", url: "/yks-puan-hesaplama" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <YksFaqJsonLd />
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
        <h1 className="text-sm sm:text-base font-black text-night">YKS Puan Hesaplama 2026</h1>
        <Link
          href="/lgs-puan-hesaplama"
          className="text-xs font-bold text-violet-600 hover:text-violet-800"
        >
          LGS Hesapla →
        </Link>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
        {/* Ekmek Kırıntısı (Breadcrumbs) - Google & Kullanıcı Dostu */}
        <nav aria-label="Ekmek Kırıntısı" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-night transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/exams" className="hover:text-night transition-colors">Sınav Sezonu</Link>
          <span>/</span>
          <span className="font-bold text-night" aria-current="page">YKS Puan Hesaplama</span>
        </nav>

        {/* Giriş Banner */}
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">
            🎓 ÖSYM 2026/2025 Resmi Katsayıları
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-night">
            YKS (TYT - AYT - YDT) Puan & Sıralama Hesaplama
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Netlerinizi ve diploma notunuzu girin; ÖSYM katsayıları, 0.5 net şartı ve OBP katkısı ile ham ve yerleştirme puanınızı hesaplayın.
          </p>
        </div>

        {/* İnteraktif Hesaplayıcı */}
        <YksPageCalculator />

        {/* YKS & OBP Rehberi */}
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-slate-700">
          <h3 className="text-lg font-black text-night">YKS ve OBP Puanı Nasıl Hesaplanır?</h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            Yükseköğretim Kurumları Sınavı (YKS); birinci oturum olan <b>TYT (Temel Yeterlilik Testi)</b> ve ikinci oturum olan <b>AYT (Alan Yeterlilik Testi)</b> ya da <b>YDT (Yabancı Dil Testi)</b> bileşenlerinden oluşur.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-1.5">
              <h4 className="font-bold text-indigo-950 text-sm">⚖️ YKS Ağırlık Dağılımı</h4>
              <p>
                <b>TYT Katkısı:</b> Nihai YKS yerleştirme puanının <b>%40</b>&apos;ını oluşturur.
              </p>
              <p>
                <b>AYT / YDT Katkısı:</b> İlgili puan türündeki AYT veya YDT testlerinin ağırlığı <b>%60</b>&apos;tır.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <h4 className="font-bold text-night text-sm">📜 OBP (Okul Başarı Puanı) Hesabı</h4>
              <p>
                Adayın lise diploma notu (50-100) 5 ile çarpılarak OBP elde edilir (Maksimum 500). Standart adaylarda OBP <b>0.12</b> katsayısıyla çarpılarak ham puana <b>maksimum 60 puan</b> eklenir.
              </p>
              <p>
                <b>Kırık OBP Kuralı:</b> Bir önceki yıl YKS ile bir yükseköğretim programına yerleşen (açıköğretimin kontenjan sınırlı programları dahil) adayların OBP katsayısı yarıya iner (<b>0.06</b> ile çarpılır).
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-1.5">
              <h4 className="font-bold text-amber-950 text-sm">⚠️ ÖSYM 0.5 Net Kuralı</h4>
              <p>
                TYT puanının hesaplanabilmesi için adayın Türkçe veya Temel Matematik testinden en az <b>0.5 net</b> yapması zorunludur. AYT puanlarının hesaplanması için de ilgili test gruplarından en az birinden 0.5 net şartı aranır.
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

