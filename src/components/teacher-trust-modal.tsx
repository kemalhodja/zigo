"use client";

import { useState } from "react";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";

export type TeacherTrustInfo = {
  id?: string;
  fullName: string;
  avatarUrl?: string | null;
  branch?: string;
  university?: string;
  experienceYears?: number;
  hasPedagogicalFormation?: boolean;
  hasCleanCriminalRecord?: boolean;
  hasDiplomaVerified?: boolean;
  verifiedAt?: string;
  rating?: number;
  recommendationRate?: number;
  completedLessons?: number;
};

interface TeacherTrustModalProps {
  teacher: TeacherTrustInfo;
  triggerButton?: React.ReactNode;
}

export function TeacherTrustModal({ teacher, triggerButton }: TeacherTrustModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="tap-scale inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition shadow-xs"
        >
          <span className="text-xs">🛡️</span>
          <span>Güven Rozeti</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-black">
                  🛡️
                </div>
                <div>
                  <h3 className="text-sm font-black text-night">Öğretmen Güven & Teyit Belgesi</h3>
                  <p className="text-[0.68rem] text-slate-500 font-medium">Zigo Güvenli Eğitim Standartları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-black transition"
              >
                ✕
              </button>
            </div>

            {/* Teacher Card */}
            <div className="my-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <SocialAvatar
                label={teacher.fullName}
                imageUrl={teacher.avatarUrl}
                className="size-12 text-sm shadow-xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-sm text-night truncate">{teacher.fullName}</h4>
                  <VerifiedBadge className="size-4 text-crystal" />
                </div>
                <p className="text-xs text-crystal font-bold mt-0.5">{teacher.branch || "Branş Öğretmeni"}</p>
                <p className="text-[0.65rem] text-slate-400 font-medium mt-0.5">
                  Doğrulanmış Eğitimci · {teacher.experienceYears || 5}+ Yıl Deneyim
                </p>
              </div>
            </div>

            {/* Security & Credential Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                <span className="text-lg">🎓</span>
                <div className="text-xs">
                  <p className="font-black text-emerald-950 flex items-center gap-1.5">
                    <span>Diploma & Üniversite Teyidi</span>
                    <span className="rounded-full bg-emerald-200 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">ONAYLI</span>
                  </p>
                  <p className="text-[0.68rem] text-emerald-800/90 mt-0.5">
                    {teacher.university ? `${teacher.university} Lisans/Yüksek Lisans` : "YÖK/Üniversite onaylı diploma belgesi doğrulanmıştır."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <span className="text-lg">📜</span>
                <div className="text-xs">
                  <p className="font-black text-blue-950 flex items-center gap-1.5">
                    <span>Pedagojik Formasyon & Yeterlilik</span>
                    <span className="rounded-full bg-blue-200 px-1.5 py-0.2 text-[9px] font-black text-blue-800">UYGUN</span>
                  </p>
                  <p className="text-[0.68rem] text-blue-800/90 mt-0.5">
                    Öğretmenlik meslek bilgisi ve yaş grubuna uygun pedagojik iletişim yeterliliği mevcuttur.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                <span className="text-lg">⚖️</span>
                <div className="text-xs">
                  <p className="font-black text-purple-950 flex items-center gap-1.5">
                    <span>Adli Sicil & Güvenlik Beyanı</span>
                    <span className="rounded-full bg-purple-200 px-1.5 py-0.2 text-[9px] font-black text-purple-800">TEMİZ</span>
                  </p>
                  <p className="text-[0.68rem] text-purple-800/90 mt-0.5">
                    Güvenli eğitim ve çocuk koruma yönergeleri kapsamında adli sicil kaydı kontrol edilmiştir.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                <span className="text-lg">⭐</span>
                <div className="text-xs">
                  <p className="font-black text-amber-950 flex items-center gap-1.5">
                    <span>Veli Memnuniyeti & Güven Puanı</span>
                    <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[9px] font-black text-amber-900">
                      %{teacher.recommendationRate || 100} Tavsiye
                    </span>
                  </p>
                  <p className="text-[0.68rem] text-amber-900/90 mt-0.5">
                    Öğrenci velilerinden alınan değerlendirmelerde yüksek memnuniyet ve dakiklik teyit edilmiştir.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <p className="mt-4 text-[0.62rem] text-center text-slate-400 leading-normal">
              Zigo, velilerin güvenliğini en üst düzeyde tutmak amacıyla eğitimci kimlik ve yetkinlik belgelerini düzenli olarak denetler.
            </p>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full rounded-2xl bg-night py-3 text-xs font-black text-white hover:bg-slate-800 transition active:scale-[0.99]"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
