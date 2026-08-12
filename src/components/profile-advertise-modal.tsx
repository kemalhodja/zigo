"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { isEducationOrganizationType } from "@/lib/domain/education-organization";
import {
  buildSponsorSalesWhatsAppUrl,
  shouldHideOrganizationSponsorPrices,
} from "@/lib/domain/organization-sales";
import {
  formatSponsorPriceTry,
  getSponsorPricingOptions,
  resolveSponsorCategory,
  type SponsorPackageDuration,
} from "@/lib/domain/sponsored-pricing";
import { useMessages } from "@/lib/i18n/locale-context";

type ProfileAdvertiseModalProps = {
  profile: {
    id?: string;
    role?: string | null;
    organization_type?: string | null;
    full_name?: string | null;
  } | null;
  isOwner?: boolean;
  triggerClassName?: string;
};

export function ProfileAdvertiseModal({ profile, isOwner, triggerClassName }: ProfileAdvertiseModalProps) {
  const router = useRouter();
  const b = useMessages().billingUi;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<SponsorPackageDuration>(30);
  const [headline, setHeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const organizationType =
    profile && isEducationOrganizationType(profile.organization_type)
      ? profile.organization_type
      : null;
  const hidePrices = shouldHideOrganizationSponsorPrices(organizationType);
  const category = resolveSponsorCategory(profile);
  const options = getSponsorPricingOptions(profile);
  const selectedOption = options.find((o) => o.days === selectedDays) ?? options[0];

  const salesUrl = useMemo(() => {
    if (!hidePrices || !selectedOption) return null;
    return buildSponsorSalesWhatsAppUrl({
      organizationType,
      organizationName: profile?.full_name,
      packageLabel: selectedOption.label,
      packageDays: selectedOption.days,
    });
  }, [hidePrices, organizationType, profile?.full_name, selectedOption]);

  if (!profile || (profile.role !== "teacher" && profile.role !== "student")) {
    return null;
  }

  const isStudent = profile.role === "student";

  const categoryTitle = isStudent 
    ? "Öğrenci Liderlik Panosu Öne Çıkarma"
    : category === "platform"
      ? "Eğitim Platformu Sponsorluk & Reklam"
      : category === "institution"
        ? profile.organization_type === "yayinevi"
          ? "Yayınevi Sponsorluk & Öne Çıkarma"
          : "Kurumsal Sponsorluk & Öne Çıkarma"
        : "Öğretmen Sponsorlu Reklam Paketi";

  const categoryBadge = isStudent 
    ? "🏆 Öğrenci (XP İle)"
    : category === "platform"
      ? "👑 Eğitim Platformu"
      : category === "institution"
        ? profile.organization_type === "yayinevi"
          ? "📚 Yayınevi"
          : "🏫 Eğitim Kurumu"
        : "🎓 Bireysel Öğretmen";

  async function handleActivate() {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isStudent) {
        // Öğrenciler için XP ile öne çıkarma API'si
        const res = await fetch("/api/social/advertise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || "XP harcama başarısız oldu.");
        }

        setSuccessMsg("Tebrikler! Profiliniz Liderlik Panosunda öne çıkarıldı. (-500 XP)");
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 2000);
        return;
      }

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
        if (json.code === "ORG_SPONSOR_SALES_ASSISTED" && json.data?.salesUrl) {
          window.open(json.data.salesUrl as string, "_blank", "noopener,noreferrer");
          setError(null);
          setIsLoading(false);
          return;
        }
        throw new Error(json.error || b.sponsorActivateFailed);
      }

      if (json.data?.checkoutUrl && typeof json.data.checkoutUrl === "string") {
        window.location.assign(json.data.checkoutUrl);
        return;
      }

      setSuccessMsg(json.data?.message || b.sponsorActivated);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : b.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"}
      >
        <span className="text-base">📢</span>
        <span>{hidePrices ? b.sponsorOpenSales : b.sponsorOpenSelf}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                  <span>{categoryBadge}</span>
                </div>
                <h3 className="text-xl font-black text-white md:text-2xl">{categoryTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {hidePrices
                    ? b.sponsorSalesHint
                    : b.sponsorSelfHint.replace("{name}", profile.full_name || "")}
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
                <div className="mb-2 text-3xl">🎉</div>
                <div className="text-lg font-bold text-emerald-200">{successMsg}</div>
                <p className="mt-1 text-xs text-emerald-400">{b.sponsorRefreshing}</p>
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
                        {b.sponsorPopular}
                      </span>
                    ) : null}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {opt.durationLabel}
                      </span>
                      {isStudent ? (
                         <span className="text-xl font-black text-amber-300">
                           500 XP
                         </span>
                      ) : hidePrices ? (
                        <span className="text-xs font-black uppercase tracking-wide text-violet-300">
                          {b.sponsorQuoteBadge}
                        </span>
                      ) : (
                        <span className="text-xl font-black text-white">
                          {formatSponsorPriceTry(opt.priceTry)}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-1.5 text-base font-bold text-slate-100">{opt.label}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{opt.description}</p>

                    <ul className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
                      {opt.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-0.5 text-amber-400">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {hidePrices ? (
              <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3.5 text-xs text-violet-200">
                {b.sponsorSalesNote}
              </div>
            ) : isOwner ? (
              <div className="mb-6">
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  {b.sponsorHeadlineLabel}
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={`${profile.full_name || "Zigo"} • …`}
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-xs text-blue-300">
                {b.sponsorNonOwnerNote.replace(
                  "{duration}",
                  selectedOption?.durationLabel.toLowerCase() ?? "",
                )}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                {b.sponsorCancel}
              </button>
              {hidePrices ? (
                salesUrl ? (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-[1.02]"
                    href={salesUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {b.sponsorSalesCta.replace(
                      "{duration}",
                      selectedOption?.durationLabel ?? "",
                    )}
                  </a>
                ) : (
                  <p className="rounded-xl bg-slate-800 px-4 py-3 text-xs font-bold text-amber-200">
                    {b.salesLineMissing}
                  </p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => void handleActivate()}
                  disabled={isLoading || Boolean(successMsg)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></span>
                      <span>{b.sponsorWorking}</span>
                    </>
                  ) : (
                    <span>
                      {isStudent 
                        ? "500 XP Harcayarak Öne Çıkar"
                        : b.sponsorActivate.replace(
                            "{price}",
                            selectedOption ? formatSponsorPriceTry(selectedOption.priceTry) : "",
                          )
                      }
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
