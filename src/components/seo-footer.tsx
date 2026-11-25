"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { GooglePlayBadge } from "@/components/google-play-badge";

export function SeoFooter() {
  const pathname = usePathname();

  // Tam ekran video / reels veya hikaye modunda footer'ı gizle
  if (
    pathname.startsWith("/sparks") ||
    pathname.startsWith("/micro") ||
    pathname.startsWith("/stories")
  ) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      className="mt-16 border-t border-slate-200/80 bg-white/95 text-slate-600 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Kolon 1: Sınav & Puan Hesaplama */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-night">
              📐 Puan Hesaplama
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link
                  href="/lgs-puan-hesaplama"
                  className="transition hover:text-indigo-600"
                >
                  2026 LGS Puan Hesaplama
                </Link>
              </li>
              <li>
                <Link
                  href="/yks-puan-hesaplama"
                  className="transition hover:text-indigo-600"
                >
                  2026 YKS (TYT-AYT) Hesaplama
                </Link>
              </li>
              <li>
                <Link
                  href="/yks-puan-hesaplama"
                  className="transition hover:text-indigo-600"
                >
                  OBP & Kırık OBP Robotu
                </Link>
              </li>
              <li>
                <Link
                  href="/exams"
                  className="transition hover:text-indigo-600"
                >
                  Sınav Sezonu & Geri Sayım
                </Link>
              </li>
              <li>
                <Link
                  href="/konular"
                  className="transition hover:text-indigo-600"
                >
                  LGS & YKS Konu Rehberi
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolon 2: Resmi Eğitim Portalları */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-night">
              🏛️ Resmi Portallar
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <a
                  href="https://e-okul.meb.gov.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-emerald-600"
                >
                  <span>e-Okul Girişi (MEB)</span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://yokatlas.yok.gov.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-blue-600"
                >
                  <span>YÖK Atlas Tercih Sihirbazı</span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://ogmmateryal.eba.gov.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-violet-600"
                >
                  <span>MEB OGM Materyal Havuzu</span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.osym.gov.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-amber-600"
                >
                  <span>ÖSYM Resmi Portalı</span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Kolon 3: Öğrenme & Etkileşim */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-night">
              💡 Öğrenme & Etkileşim
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link
                  href="/explore"
                  className="transition hover:text-indigo-600"
                >
                  Keşfet & Popüler Gönderiler
                </Link>
              </li>
              <li>
                <Link
                  href="/questions"
                  className="transition hover:text-indigo-600"
                >
                  Soru - Cevap Topluluğu
                </Link>
              </li>
              <li>
                <Link
                  href="/games"
                  className="transition hover:text-indigo-600"
                >
                  Zeka Oyunları Salonu
                </Link>
              </li>
              <li>
                <Link
                  href="/duels"
                  className="transition hover:text-indigo-600"
                >
                  Canlı Bilgi Düelloları
                </Link>
              </li>
              <li>
                <Link
                  href="/learn"
                  className="transition hover:text-indigo-600"
                >
                  Dersler & Konu Anlatımları
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolon 4: Kurumsal & Güvenlik */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-night">
              🛡️ Kurumsal & Yasal
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link
                  href="/about"
                  className="transition hover:text-indigo-600"
                >
                  Hakkımızda & Vizyonumuz
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition hover:text-indigo-600"
                >
                  Zigo Plus Abonelik & Fiyatlar
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="transition hover:text-indigo-600"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="transition hover:text-indigo-600"
                >
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/kvkk"
                  className="transition hover:text-indigo-600"
                >
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/delete-account"
                  className="transition hover:text-indigo-600"
                >
                  Hesap & Veri Silme Talebi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobil Uygulama & Google Play İndirme Alanı (Dünya Standartlarında Vitrin) */}
        <div className="mt-12 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-night to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 text-center md:text-left flex-col md:flex-row">
            <div className="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 font-black text-2xl sm:text-3xl text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/10">
              Z
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Zigo Mobil
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-bold text-slate-300">
                  Android için Yayında
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Zigo Cebinizde, Öğrenme Her An Yanınızda
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
                Zeka oyunları, soru havuzları ve canlı düellolara telefon ve tabletinizden kesintisiz erişin.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
            <GooglePlayBadge size="md" />
            <span className="text-[11px] font-semibold text-slate-400">
              Google Play Store&apos;da Ücretsiz
            </span>
          </div>
        </div>

        {/* Alt Telif & Bilgi Bandı */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-6 text-center text-xs text-slate-600 sm:flex-row">
          <p className="font-medium">
            © {new Date().getFullYear()} Zigo Eğitim Teknolojileri A.Ş. Tüm hakları saklıdır.
          </p>
          <p className="text-[11px] text-slate-600">
            LGS ve YKS hesaplamaları MEB ve ÖSYM güncel standart katsayıları ve istatistiklerine dayanır.
          </p>
        </div>
      </div>
    </footer>
  );
}

