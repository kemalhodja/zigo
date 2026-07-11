"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formatSponsorPriceTry,
  getSponsorPricingOptions,
  resolveSponsorCategory,
  type SponsorPackageDuration,
} from "@/lib/domain/sponsored-pricing";

type ProfileAdvertiseModalProps = {
  profile: {
    id?: string;
    role?: string | null;
    organization_type?: string | null;
    full_name?: string | null;
  } | null;
  isOwner?: boolean;
};

export function ProfileAdvertiseModal({ profile, isOwner }: ProfileAdvertiseModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<SponsorPackageDuration>(30);
  const [headline, setHeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!profile || profile.role !== "teacher") {
    return null;
  }

  const category = resolveSponsorCategory(profile);
  const options = getSponsorPricingOptions(profile);
  const selectedOption = options.find((o) => o.days === selectedDays) ?? options[0];

  const categoryTitle =
    category === "platform"
      ? "Eğitim Platformu Sponsorluk & Reklam"
      : category === "institution"
        ? "Kurumsal Sponsorluk & Öne Çıkarma"
        : "Öğretmen Sponsorlu Reklam Paketi";

  const categoryBadge =
    category === "platform"
      ? "👑 Eğitim Platformu"
      : category === "institution"
        ? "🏫 Eğitim Kurumu"
        : "🎓 Bireysel Öğretmen";

  async function handleActivate() {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/ads/sponsor-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageDays: selectedDays,
          headline: headline.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Reklam paketi aktifleştirilemedi.");
      }

      setSuccessMsg(json.data?.message || "Sponsorlu reklam başarıyla aktifleştirildi!");
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"
      >
        <span className="text-base">📢</span>
        <span>Reklam Ver (Sponsorlu)</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  <span>{categoryBadge}</span>
                </div>
                <h3 className="text-xl font-black text-white md:text-2xl">{categoryTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {profile.full_name} profilini akışta, aramalarda ve vitrinde en üst sırada gösterin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                ⚠️ {error}
              </div>
            ) : null}

            {successMsg ? (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-emerald-300 animate-in zoom-in-95">
                <div className="text-3xl mb-2">🎉</div>
                <div className="font-bold text-lg text-emerald-200">{successMsg}</div>
                <p className="text-xs text-emerald-400 mt-1">Profiliniz yenileniyor...</p>
              </div>
            ) : null}

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              {options.map((opt) => {
                const isSelected = selectedDays === opt.days;
                return (
                  <div
                    key={opt.days}
                    onClick={() => setSelectedDays(opt.days)}
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-gradient-to-b from-amber-500/15 to-amber-500/5 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    {opt.days === 30 ? (
                      <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-sm">
                        En Popüler
                      </span>
                    ) : null}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {opt.durationLabel}
                      </span>
                      <span className="text-xl font-black text-white">
                        {formatSponsorPriceTry(opt.priceTry)}
                      </span>
                    </div>

                    <h4 className="mt-1.5 text-base font-bold text-slate-100">{opt.label}</h4>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{opt.description}</p>

                    <ul className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
                      {opt.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-amber-400 mt-0.5">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {isOwner ? (
              <div className="mb-6">
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Özel Tanıtım Başlığı (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={`${profile.full_name || "Eğitim Platformu"} • Yeni Dönem Kayıtları Başladı!`}
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-xs text-blue-300">
                ℹ️ Bu profil için sponsorlu reklam paketi başlattığınızda, {selectedOption?.durationLabel.toLowerCase()} boyunca hem bu profil hem de en güncel paylaşımları <strong>✨ Sponsorlu</strong> olarak en üst sırada vurgulanır.
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={isLoading || Boolean(successMsg)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40 disabled:pointer-events-none disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></span>
                    <span>İşlem yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ {selectedOption ? formatSponsorPriceTry(selectedOption.priceTry) : ""} • Sponsorluğu Aktifleştir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
