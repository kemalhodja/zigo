import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda | Zigo Eğitim Sosyal Ağı",
  description:
    "Zigo, öğrencilerin güvenle öğrendiği, öğretmenlerin doğrulanmış içerikler ürettiği ve velilerin çocuklarının akademik gelişimini takip ettiği yeni nesil eğitim platformudur.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Hakkımızda | Zigo Eğitim Sosyal Ağı",
    description: "Zigo vizyonu, güvenli öğrenme ortamı ve eğitim teknolojileri.",
    url: "https://www.zigo.com.tr/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center text-slate-900 bg-white">
      <div className="max-w-2xl space-y-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-700">
          🌱 Türkiye&apos;nin Eğitim Platformu
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-night">Zigo Hakkında</h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Zigo; öğrencilerin güvenle öğrenebileceği, doğrulanmış öğretmenlerin kaliteli ders ve soru içerikleri paylaşabileceği, velilerin ise çocuklarının eğitim yolculuğunu şeffaf bir şekilde takip edebileceği yenilikçi, oyunlaştırılmış ve güvenli bir eğitim sosyal ağıdır.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-2xl">🎯</span>
            <h3 className="mt-2 text-sm font-bold text-night">Sınav Odaklı Hazırlık</h3>
            <p className="mt-1 text-xs text-slate-500">2026 MEB & ÖSYM standartlarında LGS ve YKS hazırlığı.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-2xl">🛡️</span>
            <h3 className="mt-2 text-sm font-bold text-night">Güvenli ve Odaklı</h3>
            <p className="mt-1 text-xs text-slate-500">Çocuk güvenliğini önceleyen, dikkati dağıtmayan temiz eğitim ortamı.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-2xl">✨</span>
            <h3 className="mt-2 text-sm font-bold text-night">Doğrulanmış Kadro</h3>
            <p className="mt-1 text-xs text-slate-500">Uzman branş öğretmenleri ile kaliteli soru çözümü ve rehberlik.</p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="tap-scale inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 transition"
          >
            <span>Ana Sayfaya Git</span>
            <span>→</span>
          </Link>
          <Link
            href="/exams"
            className="tap-scale inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>🧮 Puan Hesaplama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
