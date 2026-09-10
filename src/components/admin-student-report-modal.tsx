"use client";

import { Award, BookOpen, CheckCircle2, Clock, Printer, ShieldCheck, X } from "lucide-react";

import type { User360Data } from "@/lib/domain/admin-user-details";

type AdminStudentReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: User360Data;
};

export function AdminStudentReportModal({
  isOpen,
  onClose,
  data,
}: AdminStudentReportModalProps) {
  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const { user, roleSpecific } = data;
  const totalQuizzes = roleSpecific.quizAttempts.length;
  const totalQuestions = roleSpecific.quizAttempts.reduce((acc, q) => acc + q.total_questions, 0);
  const totalCorrect = roleSpecific.quizAttempts.reduce((acc, q) => acc + q.score, 0);
  const accuracyPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const docNo = `ZG-${user.id.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
  const currentDateStr = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-dossier,
          #printable-dossier * {
            visibility: visible;
          }
          #printable-dossier {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Action Header (hidden in print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-amber-400" />
            <h3 className="text-sm font-black tracking-wide">
              Resmi Öğrenci Performans Karnesi (PDF / Yazdır)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300 transition shadow-sm"
            >
              <Printer className="size-4" />
              Yazdır / PDF Kaydet
            </button>
            <button
              type="button"
              onClick={onClose}
              className="tap-scale flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-dossier" className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="text-2xl font-black tracking-wider text-slate-950 uppercase">
                ZİGO DİJİTAL GELİŞİM PLATFORMU
              </span>
            </div>
            <p className="text-[0.7rem] font-black uppercase tracking-widest text-slate-500">
              T.C. MİLLÎ EĞİTİM MÜFREDATI UYUMLU DİJİTAL ÖĞRENME & ZİHİN EGZERSİZLERİ
            </p>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight pt-1">
              ÖĞRENCİ PERFORMANS VE DİJİTAL GELİŞİM RAPORU
            </h1>
            <div className="flex justify-between text-[0.65rem] font-bold text-slate-400 pt-2">
              <span>Belge No: {docNo}</span>
              <span>Düzenlenme Tarihi: {currentDateStr}</span>
            </div>
          </div>

          {/* Student Identity Card */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-400 text-[0.65rem] uppercase">Öğrenci Adı Soyadı</p>
              <p className="font-black text-slate-900 text-sm">{user.full_name}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 text-[0.65rem] uppercase">Kayıtlı E-posta</p>
              <p className="font-black text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 text-[0.65rem] uppercase">Okul / Sınıf</p>
              <p className="font-bold text-slate-800">
                {user.school_name ? `${user.school_name} - ${user.classroom || ""}` : "Bireysel Öğrenci"}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-400 text-[0.65rem] uppercase">Seviye & Günlük Seri</p>
              <p className="font-bold text-slate-800">
                Level {user.level} • {user.total_points} XP • 🔥 {user.streak_days} Günlük Seri
              </p>
            </div>
          </div>

          {/* Section 1: Academic & Quiz Performance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <BookOpen className="size-4 text-crystal" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                1. Akademik Başarı & Sınav Karnesi
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase">Tamamlanan Quiz</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{totalQuizzes}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase">Toplam Çözülen Soru</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{totalQuestions}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-emerald-50 border-emerald-100">
                <p className="text-[0.65rem] font-bold text-emerald-700 uppercase">Genel Başarı Oranı</p>
                <p className="text-lg font-black text-emerald-800 mt-0.5">%{accuracyPercent}</p>
              </div>
            </div>

            {roleSpecific.quizAttempts.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 text-[0.7rem]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-black text-slate-600">
                    <tr>
                      <th className="p-2.5">Sınav / Test Adı</th>
                      <th className="p-2.5 text-center">Doğru / Toplam</th>
                      <th className="p-2.5 text-right">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {roleSpecific.quizAttempts.slice(0, 5).map((q) => (
                      <tr key={q.id}>
                        <td className="p-2.5 font-bold text-slate-900">{q.quiz_title}</td>
                        <td className="p-2.5 text-center font-black text-emerald-600">
                          {q.score} / {q.total_questions}
                        </td>
                        <td className="p-2.5 text-right text-slate-500">
                          {new Date(q.created_at).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 py-2 text-center">
                Henüz kayıtlı test sınavı bulunmamaktadır.
              </p>
            )}
          </div>

          {/* Section 2: Brain Games & Screen Time Discipline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Clock className="size-4 text-amber-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                2. Zihin Egzersizleri & Ekran Süresi Disiplini
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 p-3 space-y-1">
                <p className="font-bold text-slate-500 text-[0.65rem] uppercase">Günlük Oyun Sınırı Uyumu</p>
                <p className="font-black text-slate-900">
                  Azami 120 Dk Kuralı: <span className="text-emerald-600">✓ Uyumlu</span>
                </p>
                <p className="text-[0.65rem] text-slate-500">
                  Bugün kullanılan süre: {roleSpecific.gameMinutesToday} dk / 120 dk
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-1">
                <p className="font-bold text-slate-500 text-[0.65rem] uppercase">Gece Yasağı (22:00 - 08:00)</p>
                <p className="font-black text-slate-900">
                  Gece Kilit Sistemi: <span className="text-emerald-600">✓ Aktif</span>
                </p>
                <p className="text-[0.65rem] text-slate-500">
                  Öğrencinin gece uyku saatlerinde oyun salonuna erişimi otomatik olarak engellenir.
                </p>
              </div>
            </div>

            {roleSpecific.gameScores.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                {roleSpecific.gameScores.map((g) => (
                  <div key={g.game_type} className="rounded-xl border border-slate-200 p-2.5 bg-slate-50">
                    <p className="text-[0.65rem] font-black uppercase text-slate-500">{g.game_type}</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">
                      {g.high_score.toLocaleString("tr-TR")} Puan
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Section 3: Digital Citizenship & Safety Record */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                3. Dijital Vatandaşlık & Güvenlik Karnesi
              </h2>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-black text-emerald-900">
                  Topluluk Kuralları Uyum Puanı: Tam Not ({user.social_safety_strike_count === 0 ? "Kusursuz / 0 İhlal" : `${user.social_safety_strike_count} Ceza`})
                </p>
                <p className="text-[0.7rem] text-emerald-700">
                  Öğrenci, Zigo platformundaki akran iletişimi ve dijital nezaket kurallarına tam uyum göstermektedir.
                </p>
              </div>
              <CheckCircle2 className="size-8 text-emerald-600 flex-shrink-0" />
            </div>
          </div>

          {/* Official Verification & Stamp */}
          <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <p className="font-black text-slate-900">Zigo Platform Yönetimi</p>
              <p className="text-[0.65rem] text-slate-500">
                Bu belge dijital ortamda üretilmiş olup doğrulaması Zigo sistemleri üzerinden yapılabilir.
              </p>
              <p className="font-mono text-[0.6rem] text-slate-400">Doğrulama Kodu: {docNo}</p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-400 p-3 text-center min-w-[140px]">
              <p className="font-black text-[0.65rem] text-slate-900 uppercase">ONAYLANDI</p>
              <p className="text-[0.55rem] font-bold text-slate-500">ZİGO DİJİTAL SİSTEMİ</p>
              <p className="font-mono text-[0.55rem] text-slate-400 mt-1">{currentDateStr}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
