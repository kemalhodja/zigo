"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { compressImage } from "@/lib/client/compress-image";
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

type BankAccount = {
  id: string;
  label: string | null;
  iban: string;
  accountName: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
};

type BankTransferResponseData = {
  requestId: string;
  referenceCode: string;
  amountTry: number;
  packageDays: number;
  packageLabel: string;
  banks: BankAccount[];
  existingReceipt?: string | null;
  message?: string;
};

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

  // Bank Transfer / EFT flow state
  const [bankTransferData, setBankTransferData] = useState<BankTransferResponseData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

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

  if (
    !profile ||
    (profile.role !== "teacher" &&
      profile.role !== "platform" &&
      profile.role !== "institution" &&
      profile.role !== "publisher" &&
      profile.role !== "education_institution" &&
      profile.role !== "education_platform")
  ) {
    return null;
  }

  const categoryTitle =
    category === "platform"
      ? "Eğitim Platformu Sponsorlu Reklam"
      : category === "institution"
        ? profile.organization_type === "yayinevi"
          ? "Yayınevi Sponsorlu Reklam"
          : "Eğitim Kurumu Sponsorlu Reklam"
        : "Öğretmen Sponsorlu Reklam";

  const categoryBadge =
    category === "platform"
      ? "👑 Eğitim Platformu"
      : category === "institution"
        ? profile.organization_type === "yayinevi"
          ? "📚 Yayınevi"
          : "🏫 Eğitim Kurumu"
        : "🎓 Bireysel Öğretmen";

  function copyToClipboard(text: string, fieldId: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  }

  async function handleReceiptUpload(file: File) {
    if (!bankTransferData?.requestId) return;
    setIsUploadingReceipt(true);
    setError(null);
    try {
      const compressed = file.type.startsWith("image/")
        ? await compressImage(file, 1600, 0.85)
        : file;

      const formData = new FormData();
      formData.append("requestId", bankTransferData.requestId);
      formData.append("file", compressed);

      const res = await fetch("/api/billing/bank-transfer/receipt", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Dekont yüklenemedi.");
      }
      setReceiptSuccess(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([20, 50, 20]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dekont yükleme hatası.");
    } finally {
      setIsUploadingReceipt(false);
    }
  }

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
        if (json.code === "ORG_SPONSOR_SALES_ASSISTED" && json.data?.salesUrl) {
          window.open(json.data.salesUrl as string, "_blank", "noopener,noreferrer");
          setError(null);
          setIsLoading(false);
          return;
        }
        throw new Error(json.error || b.sponsorActivateFailed);
      }

      if (json.data?.mode === "dev_bypass") {
        setSuccessMsg(json.data?.message || b.sponsorActivated);
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 2000);
        return;
      }

      if (json.data?.mode === "bank_transfer") {
        setBankTransferData(json.data as BankTransferResponseData);
        if (json.data.existingReceipt) {
          setReceiptSuccess(true);
        }
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
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
        className={triggerClassName || "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"}
      >
        <span className="text-base">📢</span>
        <span>{hidePrices ? b.sponsorOpenSales : b.sponsorOpenSelf}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl md:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                  <span>{categoryBadge}</span>
                </div>
                <h3 className="text-xl font-black text-white md:text-2xl">
                  {bankTransferData ? "🏦 Havale / EFT ile Reklam Ödemesi" : categoryTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {bankTransferData
                    ? "Lütfen transferi yaparken referans kodunu açıklama kısmına ekleyiniz."
                    : hidePrices
                      ? b.sponsorSalesHint
                      : b.sponsorSelfHint.replace("{name}", profile.full_name || "")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setBankTransferData(null);
                }}
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

            {/* EFT / Havale Detay Ekranı */}
            {bankTransferData ? (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* Tutar & Paket Kartı */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 p-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Seçilen Reklam Paketi
                    </span>
                    <h4 className="text-base font-black text-white">{bankTransferData.packageLabel}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">Transfer Tutarı</span>
                    <div className="text-2xl font-black text-amber-300">
                      {formatSponsorPriceTry(bankTransferData.amountTry)}
                    </div>
                  </div>
                </div>

                {/* Referans Kodu (Kritik) */}
                <div className="rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-400/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[0.7rem] font-black uppercase tracking-wider text-amber-300">
                        Transfer Açıklaması / Referans Kodu (Zorunlu)
                      </span>
                      <div className="mt-0.5 text-xl font-black tracking-wider text-white">
                        {bankTransferData.referenceCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankTransferData.referenceCode, "ref")}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                        copiedField === "ref"
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-amber-400 text-slate-950 hover:bg-amber-300"
                      }`}
                    >
                      {copiedField === "ref" ? "✓ Kopyalandı" : "📋 Kodu Kopyala"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-amber-200/90 leading-relaxed">
                    ⚠️ Bankanızdan EFT/Havale/FAST gönderirken <strong>açıklama alanına sadece bu kodu</strong> yazınız. Bu sayede ödemeniz anında sistemle eşleşir.
                  </p>
                </div>

                {/* Banka Hesapları */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Banka Hesap Bilgileri
                  </h5>
                  {bankTransferData.banks.map((bAccount) => (
                    <div
                      key={bAccount.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">
                          🏦 {bAccount.bankName || bAccount.label || "Banka"}
                        </span>
                        {bAccount.branchName ? (
                          <span className="text-[0.7rem] text-slate-400">{bAccount.branchName}</span>
                        ) : null}
                      </div>
                      <div>
                        <span className="text-[0.68rem] uppercase font-semibold text-slate-500">Alıcı Adı</span>
                        <div className="text-sm font-bold text-slate-200">{bAccount.accountName}</div>
                      </div>
                      <div>
                        <span className="text-[0.68rem] uppercase font-semibold text-slate-500">IBAN</span>
                        <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3 py-2 border border-slate-800">
                          <code className="text-xs font-mono font-bold text-emerald-400 break-all">
                            {bAccount.iban}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bAccount.iban, bAccount.id)}
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              copiedField === bAccount.id
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            }`}
                          >
                            {copiedField === bAccount.id ? "✓" : "Kopyala"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dekont Yükleme */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">📎 Dekont Yükleyin (Hızlı Onay)</h5>
                      <p className="text-[0.7rem] text-slate-400">
                        Dekontunuzu yüklediğinizde moderasyon ekibimiz transferi hızla kontrol edip reklamınızı yayına alır.
                      </p>
                    </div>
                  </div>

                  {receiptSuccess ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
                      ✓ Dekontunuz başarıyla yüklendi! Yönetici onayının ardından reklamınız aktif hale gelecektir.
                    </div>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95">
                      <span>{isUploadingReceipt ? "Yükleniyor..." : "📤 Dekont Seç (Görsel veya PDF)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        disabled={isUploadingReceipt}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleReceiptUpload(f);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Alt Aksiyonlar */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setBankTransferData(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    ← Farklı Paket Seç
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/billing/havale"
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                    >
                      Tüm Taleplerim ↗
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setBankTransferData(null);
                      }}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 transition hover:brightness-105"
                    >
                      Tamam, Ödemeyi Yapacağım
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Paket Seçim Ekranı */
              <>
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
                          {hidePrices ? (
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
                  <>
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

                    {/* Live Preview Card */}
                    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-slate-950/80 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.68rem] font-black uppercase tracking-wider text-amber-400">
                          👁️ Sponsorlu Akış & Profil Önizlemesi
                        </span>
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-black text-slate-950">
                          {selectedOption.durationLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-slate-950 shadow-md">
                          {(profile.full_name || "Z")[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-white truncate">
                              {profile.full_name || "Öğretmen / Kurum"}
                            </span>
                            <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[0.62rem] font-extrabold text-amber-300">
                              ✨ Sponsorlu
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {headline.trim() || `${profile.full_name || "Zigo"} • Sponsorlu Eğitim İçeriği`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
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
                          🏦 Havale / EFT ile Reklam Ver ({selectedOption ? formatSponsorPriceTry(selectedOption.priceTry) : ""})
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
