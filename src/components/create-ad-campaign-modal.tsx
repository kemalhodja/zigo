"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { compressImage } from "@/lib/client/compress-image";
import { getDistrictsForCity } from "@/lib/domain/turkey-cities-districts";
import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";
import {
  formatSponsorPriceTry,
  getSponsorPricingOptions,
  type SponsorPackageDuration,
} from "@/lib/domain/sponsored-pricing";
import { useMessages } from "@/lib/i18n/locale-context";


const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

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

type CreateAdCampaignModalProps = {
  existingPostId?: string;
  onSuccess?: () => void;
  triggerLabel?: string;
  profile?: { role?: string | null; organization_type?: string | null; full_name?: string | null } | null;
};

type UserPost = {
  id: string;
  caption?: string | null;
  media_url?: string | null;
  created_at: string;
};

export function CreateAdCampaignModal({
  existingPostId,
  onSuccess,
  triggerLabel,
  profile = null,
}: CreateAdCampaignModalProps) {
  const _m = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<"existing" | "new">(existingPostId ? "existing" : "new");
  const [step, setStep] = useState<"form" | "payment">("form");

  // Image fit mode toggle (cover = crop, contain = letterbox)
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");

  // Package selection (payment)
  const pricingOptions = getSponsorPricingOptions(profile);
  const [selectedDays, setSelectedDays] = useState<SponsorPackageDuration>(7);
  const selectedPricingOption = pricingOptions.find((o) => o.days === selectedDays) ?? pricingOptions[0];

  // Bank transfer state
  const [bankTransferData, setBankTransferData] = useState<BankTransferResponseData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  // Mobile navigation tab between form editing and live preview
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  // Multi-select Target Audience: "student", "parent"
  const [selectedAudiences, setSelectedAudiences] = useState<("student" | "parent")[]>(["student", "parent"]);
  const [targetAll, setTargetAll] = useState(true);

  // Multi-select Cities & Districts
  const [isAllCities, setIsAllCities] = useState(true);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  // Reset districts if multiple cities are selected or all cities
  useEffect(() => {
    if (isAllCities || selectedCities.length !== 1) {
      setSelectedDistricts([]);
    }
  }, [isAllCities, selectedCities]);

  // Channel Selection: "whatsapp" | "dm" | "website"
  const [ctaChannel, setCtaChannel] = useState<"whatsapp" | "dm" | "website">("whatsapp");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [ctaText, setCtaText] = useState("📲 WhatsApp'tan Bilgi Al");

  // Form states
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFileIsVideo, setSelectedFileIsVideo] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(existingPostId || null);

  // User posts for selection
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Uploading & Submitting
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  // Fetch profile phone if available
  useEffect(() => {
    if (isOpen) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.phone) {
            setWhatsappPhone(data.data.phone);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Fetch user posts if method is existing
  useEffect(() => {
    if (isOpen && method === "existing" && userPosts.length === 0) {
      setLoadingPosts(true);
      fetch("/api/social/posts?limit=15")
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) {
            setUserPosts(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [isOpen, method, userPosts.length]);

  function toggleAudience(audience: "student" | "parent") {
    setTargetAll(false);
    if (selectedAudiences.includes(audience)) {
      const filtered = selectedAudiences.filter((a) => a !== audience);
      if (filtered.length === 0) {
        setTargetAll(true);
        setSelectedAudiences(["student", "parent"]);
      } else {
        setSelectedAudiences(filtered);
      }
    } else {
      setSelectedAudiences([...selectedAudiences, audience]);
    }
  }

  function toggleAllAudiences() {
    setTargetAll(true);
    setSelectedAudiences(["student", "parent"]);
  }

  function toggleCity(city: string) {
    setIsAllCities(false);
    if (selectedCities.includes(city)) {
      const filtered = selectedCities.filter((c) => c !== city);
      if (filtered.length === 0) {
        setIsAllCities(true);
      } else {
        setSelectedCities(filtered);
      }
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  }

  function toggleDistrict(districtName: string) {
    if (selectedDistricts.includes(districtName)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== districtName));
    } else {
      setSelectedDistricts([...selectedDistricts, districtName]);
    }
  }

  function toggleAllCities() {
    setIsAllCities(true);
    setSelectedCities([]);
  }

  async function handleFileUpload(file: File) {
    // IMAGE ONLY — only accept image files for banner ads
    if (!file.type.startsWith("image/")) {
      setError("Sadece görsel dosyası (JPEG, PNG, WEBP) kabul edilir. Video ve ses desteklenmez.");
      return;
    }
    setIsUploading(true);
    setError(null);

    // Instant local preview
    try {
      const localBlob = URL.createObjectURL(file);
      setLocalPreviewUrl(localBlob);
      setSelectedFileIsVideo(false);
    } catch {
      // ignore
    }

    // Compress image before upload
    const fileToUpload = await compressImage(file, 1600, 0.85);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("/api/social/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.data?.mediaUrl) {
        throw new Error(data.error || "Görsel yüklenemedi");
      }
      setMediaUrl(data.data.mediaUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setIsUploading(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else if (typeof document !== "undefined") {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  }

  async function handleReceiptUpload(file: File) {
    if (!bankTransferData?.requestId) return;
    setIsUploadingReceipt(true);
    setError(null);
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file, 1600, 0.85) : file;
      const formData = new FormData();
      formData.append("requestId", bankTransferData.requestId);
      formData.append("file", compressed);
      const res = await fetch("/api/billing/bank-transfer/receipt", { method: "POST", body: formData });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Dekont yüklenemedi.");
      setReceiptSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dekont yükleme hatası.");
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  // Active media URL for preview (prefers instant local blob URL then uploaded URL)
  const activePreviewMediaUrl = localPreviewUrl || mediaUrl;

  // Detect video: check file selection type, extension, or mime hint in URL
  const isVideoMedia = selectedFileIsVideo || Boolean(
    activePreviewMediaUrl && (
      /\.(mp4|webm|mov|ogg)$/i.test(activePreviewMediaUrl) ||
      activePreviewMediaUrl.includes("video") ||
      /path=.*%2F[^&]*\.(mp4|webm|mov|ogg)/i.test(activePreviewMediaUrl)
    )
  );

  // Resolve Target URL & CTA Label based on channel choice
  function getResolvedTargetUrl() {
    if (ctaChannel === "whatsapp") {
      const cleanPhone = whatsappPhone.replace(/\D/g, "");
      if (!cleanPhone) return "";
      const formatted = cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone}`;
      return `https://wa.me/${formatted}?text=${encodeURIComponent(`Merhaba, Zigo'daki "${title || 'Sponsorlu'}" reklamınız hakkında bilgi almak istiyorum.`)}`;
    }
    if (ctaChannel === "dm") {
      return `/teacher/lessons`;
    }
    return websiteUrl.trim();
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation for WhatsApp Channel
    if (ctaChannel === "whatsapp") {
      const cleanPhone = whatsappPhone.replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        setError("WhatsApp reklamı verebilmek için geçerli bir telefon numarası girilmesi veya profilde kayıtlı olması zorunludur.");
        return;
      }
    }

    if (ctaChannel === "website" && !websiteUrl.trim()) {
      setError("Lütfen yönlendirilecek web sitesi bağlantısını girin.");
      return;
    }

    // Proceed to payment step
    setStep("payment");
  }

  async function handlePaymentSubmit() {
    setIsSubmitting(true);
    setError(null);

    const finalTargetUrl = getResolvedTargetUrl();

    // Resolve Target Audience string
    let audienceStr: "all" | "student" | "parent" = "all";
    if (!targetAll) {
      if (selectedAudiences.includes("student") && selectedAudiences.includes("parent")) {
        audienceStr = "all";
      } else if (selectedAudiences.includes("student")) {
        audienceStr = "student";
      } else if (selectedAudiences.includes("parent")) {
        audienceStr = "parent";
      }
    }

    // Resolve City String
    const cityStr = isAllCities || selectedCities.length === 0 ? null : selectedCities.join(", ");

    try {
      // 1. Create the ad campaign
      const adRes = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPostId: method === "existing" ? selectedPostId : undefined,
          title: title.trim(),
          caption: caption.trim(),
          targetUrl: finalTargetUrl || undefined,
          buttonText: ctaText,
          mediaUrl: mediaUrl || undefined,
          targetAudience: audienceStr,
          city: cityStr,
          district: selectedDistricts.length > 0 ? selectedDistricts.join(", ") : undefined,
        }),
      });

      const adJson = await adRes.json().catch(() => ({}));

      if (!adRes.ok) {
        if (adRes.status === 403 || adJson.code === "SUBSCRIPTION_REQUIRED" || adJson.error?.includes("abonelik")) {
          setError("Sponsorlu reklam yayınlamak için aktif bir Zigo Plus abonelik gerekiyor.");
          return;
        }
        throw new Error(adJson.error || "Reklam oluşturulamadı");
      }

      // 2. Create bank transfer request for payment
      const checkoutRes = await fetch("/api/ads/sponsor-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageDays: selectedDays }),
      });

      const checkoutJson = await checkoutRes.json().catch(() => ({}));

      if (!checkoutRes.ok) {
        throw new Error(checkoutJson.error || "Havale talebi oluşturulamadı.");
      }

      if (checkoutJson.data?.mode === "bank_transfer") {
        setBankTransferData(checkoutJson.data as BankTransferResponseData);
        if (checkoutJson.data.existingReceipt) setReceiptSuccess(true);
        return;
      }

      // dev bypass
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sistem hatası");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm transition hover:brightness-105"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span>{triggerLabel || "📢 Sponsorlu Reklam Ver"}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl sm:max-w-lg sm:p-6 md:max-w-2xl lg:max-w-4xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-amber-300">
                  Sponsorlu Reklam Stüdyosu
                </span>
                <h2 className="mt-1 text-xl font-black">Reklam & Afiş Kampanyası Oluştur</h2>
              </div>
              <button
                className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Mobile Tab Switcher (Visible on < lg screens) */}
            <div className="mt-3 flex rounded-xl bg-slate-800 p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("edit")}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition ${
                  mobileTab === "edit" ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                📝 Reklam Formu
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition ${
                  mobileTab === "preview" ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                👁️ Canlı Önizleme {activePreviewMediaUrl ? "✓" : ""}
              </button>
            </div>

            {success ? (
              <div className="my-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-6 text-center">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-3 text-lg font-black text-emerald-200">Reklamınız Başarıyla İncelemeye Gönderildi!</h3>
                <p className="mt-1 text-sm font-semibold text-emerald-100/80">
                  Tebrikler! Reklamınız yöneticilerimiz tarafından onaylandıktan sonra hedef kitlenizin akışında görünmeye başlayacaktır.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:gap-6">
                {/* Form Inputs (Left Column - 7 Cols) */}
                <form
                  onSubmit={handleSubmitForm}
                  className={`space-y-4 lg:col-span-7 ${mobileTab === "preview" ? "hidden lg:block" : "block"}`}
                >
                  {/* Method Selection */}
                  <div className="flex rounded-xl bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setMethod("new")}
                      className={`flex-1 rounded-lg py-2 text-xs font-black transition ${
                        method === "new" ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      ✨ Sıfırdan Reklam Hazırla
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("existing")}
                      className={`flex-1 rounded-lg py-2 text-xs font-black transition ${
                        method === "existing" ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📌 Paylaşımı Reklam Yap
                    </button>
                  </div>

                  {method === "existing" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300">Önceki Paylaşımlarınızdan Seçin:</label>
                      {loadingPosts ? (
                        <p className="mt-2 text-xs text-slate-400 animate-pulse">Paylaşımlarınız yükleniyor...</p>
                      ) : userPosts.length === 0 ? (
                        <p className="mt-2 text-xs text-amber-200">Henüz bir paylaşımınız bulunmuyor.</p>
                      ) : (
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-2 rounded-xl bg-slate-800/60 p-2 border border-slate-700">
                          {userPosts.map((post) => (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => {
                                setSelectedPostId(post.id);
                                if (post.caption) {
                                  setTitle(post.caption.substring(0, 40));
                                  setCaption(post.caption);
                                }
                                if (post.media_url) {
                                  setMediaUrl(post.media_url);
                                  setLocalPreviewUrl(null);
                                  setSelectedFileIsVideo(/\.(mp4|webm|mov|ogg)$/i.test(post.media_url));
                                }
                              }}
                              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                                selectedPostId === post.id ? "bg-amber-500/20 border border-amber-400" : "hover:bg-slate-700/50"
                              }`}
                            >
                              {post.media_url ? (
                                <Image src={getMediaPlaybackUrl(post.media_url)} alt="" width={40} height={40} className="size-10 rounded-md object-cover" />
                              ) : (
                                <div className="size-10 flex items-center justify-center rounded-md bg-slate-700 text-xs">📝</div>
                              )}
                              <div className="flex-1 truncate">
                                <p className="text-xs font-bold text-white truncate">{post.caption || "Metinsiz Gönderi"}</p>
                                <p className="text-[0.65rem] text-slate-400">{new Date(post.created_at).toLocaleDateString("tr-TR")}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Title & Caption */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Reklam Başlığı / Slogan *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: 2026 YKS Matematik Derece Kampı Başlıyor!"
                      className="mt-1 w-full rounded-xl bg-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300">Açıklama Metni</label>
                    <textarea
                      rows={2}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Örn: Birebir dersler, haftalık deneme takibi ve derece garantili çalışma programı."
                      className="mt-1 w-full rounded-xl bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Channel Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Reklam Tıklama Yönlendirme Kanalı *</label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCtaChannel("whatsapp");
                          setCtaText("📲 WhatsApp'tan Bilgi Al");
                        }}
                        className={`rounded-xl p-2.5 text-xs font-black transition text-center ${
                          ctaChannel === "whatsapp" ? "bg-emerald-500 text-white shadow-xs" : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        📲 WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCtaChannel("dm");
                          setCtaText("💬 Zigo DM'den Mesaj Gönder");
                        }}
                        className={`rounded-xl p-2.5 text-xs font-black transition text-center ${
                          ctaChannel === "dm" ? "bg-violet-600 text-white shadow-xs" : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        💬 Zigo DM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCtaChannel("website");
                          setCtaText("🌐 Web Sitesini İncele");
                        }}
                        className={`rounded-xl p-2.5 text-xs font-black transition text-center ${
                          ctaChannel === "website" ? "bg-amber-400 text-slate-950 shadow-xs" : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        🌐 Web Sitesi
                      </button>
                    </div>
                  </div>

                  {/* Channel Dynamic Inputs */}
                  {ctaChannel === "whatsapp" ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                      <label className="block text-xs font-bold text-emerald-200">
                        WhatsApp Numarası * (Zorunlu)
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="Örn: 0532 123 45 67 veya 5321234567"
                        className="mt-1.5 w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <p className="mt-1 text-[0.65rem] text-emerald-200/80">
                        Reklama tıklayan öğrenci ve veliler doğrudan profilinizdeki WhatsApp numaranıza mesaj atacaktır.
                      </p>
                    </div>
                  ) : ctaChannel === "website" ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                      <label className="block text-xs font-bold text-amber-200">Web Sitesi Bağlantısı (URL) *</label>
                      <input
                        type="url"
                        required
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://dijitalkurs.com veya https://form.site.com"
                        className="mt-1.5 w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-3">
                      <p className="text-xs font-bold text-violet-200">💬 Zigo DM Kanalı Aktif</p>
                      <p className="mt-1 text-[0.68rem] text-violet-200/80">
                        Reklama tıklayanlar Zigo uygulama içi direkt mesajlaşma kutunuz üzerinden sizinle iletişime geçecektir.
                      </p>
                    </div>
                  )}

                  {/* Ready CTA Phrases */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Buton Üzerindeki Yazı</label>
                    <select
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="mt-1.5 w-full rounded-xl bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 border border-slate-700"
                    >
                      <option value="ℹ️ Bilgi Al">ℹ️ Bilgi Al</option>
                      <option value="💰 Fiyat Al">💰 Fiyat Al</option>
                      <option value="🎓 Kursa / Kampa Hemen Başvur">🎓 Kursa / Kampa Hemen Başvur</option>
                      <option value="📝 Teklif Al">📝 Teklif Al</option>
                      <option value="📞 Hemen İletişime Geç">📞 Hemen İletişime Geç</option>
                      <option value="💬 Zigo DM'den Mesaj Gönder">💬 Zigo DM'den Mesaj Gönder</option>
                      <option value="📲 WhatsApp'tan Bilgi Al">📲 WhatsApp'tan Bilgi Al</option>
                      <option value="🌐 Web Sitesini İncele">🌐 Web Sitesini İncele</option>
                    </select>
                  </div>

                  {/* Media Upload (Görsel Afiş Sadece & Küçültme/Büyütme Ayarı) */}
                  {method === "new" ? (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-300">Sponsorlu Afiş Görseli</label>
                          <span className="text-[0.65rem] text-slate-400">JPEG, PNG, WebP (Maks 10MB)</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="mt-1 block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-950 hover:file:bg-amber-300 cursor-pointer"
                        />
                        {isUploading ? <p className="mt-1 text-[0.65rem] text-amber-300 animate-pulse">Görsel yükleniyor ve optimize ediliyor...</p> : null}
                      </div>

                      {/* Görsel Önizleme ve Büyütme/Küçültme (Fit / Fill) Ayarı */}
                      {activePreviewMediaUrl ? (
                        <div className="relative rounded-2xl border border-amber-400/50 bg-slate-950 p-2.5 overflow-hidden shadow-inner space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[0.68rem] font-black uppercase tracking-wider text-amber-300">
                              🖼️ Afiş Önizlemesi & Yerleşim
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaUrl(null);
                                setLocalPreviewUrl(null);
                              }}
                              className="text-[0.65rem] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                            >
                              ✕ Kaldır / Değiştir
                            </button>
                          </div>

                          {/* Büyütme / Küçültme (Object Fit) Butonları */}
                          <div className="flex items-center justify-between bg-slate-900/90 rounded-xl px-2.5 py-1.5 border border-slate-800">
                            <span className="text-[0.7rem] text-slate-300 font-medium">Görsel Yerleşimi:</span>
                            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-700">
                              <button
                                type="button"
                                onClick={() => setImageFit("contain")}
                                className={`px-2.5 py-1 text-[0.68rem] font-bold rounded-md transition ${
                                  imageFit === "contain"
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                🔍 Küçült (Tam Göster / Boşluklu)
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageFit("cover")}
                                className={`px-2.5 py-1 text-[0.68rem] font-bold rounded-md transition ${
                                  imageFit === "cover"
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                📐 Büyüt (Alana Yay / Kırp)
                              </button>
                            </div>
                          </div>

                          <div className="h-44 w-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activePreviewMediaUrl.startsWith("blob:") ? activePreviewMediaUrl : getMediaPlaybackUrl(activePreviewMediaUrl)}
                              alt="Afiş Önizleme"
                              className={`h-full w-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Multi-Select Target Audience */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Hedef Kitle Seçimi (Çoklu Seçilebilir)</label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={toggleAllAudiences}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                          targetAll ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        🌐 Herkes (Öğrenci + Veli + Tüm Kullanıcılar)
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAudience("student")}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                          !targetAll && selectedAudiences.includes("student")
                            ? "bg-amber-400 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        🎓 Öğrenciler
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAudience("parent")}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                          !targetAll && selectedAudiences.includes("parent")
                            ? "bg-amber-400 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        👨‍👩‍👦 Veliler
                      </button>
                    </div>
                  </div>

                  {/* City Selection */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Konum / Şehir Hedefleme</label>
                      <button
                        type="button"
                        onClick={toggleAllCities}
                        className={`text-[0.68rem] font-bold ${isAllCities ? "text-amber-400 underline font-black" : "text-slate-400 hover:text-white"}`}
                      >
                        {isAllCities ? "✓ Tüm Türkiye Seçili" : "Tüm Türkiye'yi Hedefle"}
                      </button>
                    </div>

                    <div className="mt-1.5 max-h-36 overflow-y-auto rounded-xl bg-slate-800/80 p-2 border border-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {TURKEY_CITIES.map((cityName) => {
                          const isSelected = !isAllCities && selectedCities.includes(cityName);
                          return (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => toggleCity(cityName)}
                              className={`rounded-lg px-2 py-1 text-[0.65rem] font-bold transition ${
                                isSelected ? "bg-amber-400 text-slate-950 font-black shadow-xs" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {isSelected ? `✓ ${cityName}` : cityName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!isAllCities && selectedCities.length === 1 ? (
                      <div className="mt-2.5">
                        <p className="text-xs font-bold text-amber-300 mb-1">
                          📍 {selectedCities[0]} İli İçin İlçe Hedefleme (Opsiyonel):
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-xl bg-slate-800/60 p-2 border border-slate-700">
                          {getDistrictsForCity(selectedCities[0]).map((dName) => {
                            const isDSelected = selectedDistricts.includes(dName);
                            return (
                              <button
                                key={dName}
                                type="button"
                                onClick={() => toggleDistrict(dName)}
                                className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-bold transition ${
                                  isDSelected ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                {isDSelected ? `✓ ${dName}` : dName}
                              </button>
                            );
                          })}
                        </div>
                        {selectedDistricts.length > 0 ? (
                          <p className="mt-1 text-[0.68rem] text-amber-300 font-semibold">
                            Seçilen İlçeler ({selectedDistricts.length}): {selectedDistricts.join(", ")}
                          </p>
                        ) : (
                          <p className="mt-1 text-[0.65rem] text-slate-400">İlçe seçilmezse {selectedCities[0]} ilinin tüm ilçeleri hedeflenir.</p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {error ? <p className="rounded-lg bg-rose-950/80 border border-rose-500/50 p-2.5 text-xs font-bold text-rose-200">{error}</p> : null}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="tap-scale rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105 disabled:opacity-60"
                    >
                      {isSubmitting ? "İlerleniyor..." : "Ödeme Adımına Geç 💳"}
                    </button>
                  </div>
                </form>

                {/* Live Ad Preview Card (Right Column - 5 Cols on Desktop, Tab on Mobile) */}
                <div
                  className={`lg:col-span-5 border-t border-slate-800 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 ${
                    mobileTab === "edit" ? "hidden lg:block" : "block"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-300">👁️ Canlı Reklam Önizlemesi</p>
                      <p className="mt-0.5 text-[0.68rem] text-slate-400">Öğrencilerin ve velilerin akışında böyle görünecek:</p>
                    </div>
                    {/* Switch back to form on mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileTab("edit")}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-slate-700 lg:hidden"
                    >
                      ✏️ Formu Düzenle
                    </button>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-slate-950 p-4 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[0.65rem] font-black uppercase text-slate-950 shadow-xs">
                        ✨ Sponsorlu Reklam
                      </span>
                      <span className="text-[0.68rem] font-bold text-slate-400">
                        {isAllCities ? "🇹🇷 Tüm Türkiye" : selectedCities.join(", ")}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white leading-snug break-words">
                      {title || "Reklamınızın Başlığı / Sloganı"}
                    </h4>

                    {caption ? (
                      <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                        {caption}
                      </p>
                    ) : null}

                    {/* Media Container */}
                    {activePreviewMediaUrl ? (
                      <div className="overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {isVideoMedia ? (
                          <video
                            key={activePreviewMediaUrl}
                            src={activePreviewMediaUrl.startsWith("blob:") ? activePreviewMediaUrl : getMediaPlaybackUrl(activePreviewMediaUrl)}
                            controls
                            playsInline
                            autoPlay
                            muted
                            className="max-h-56 w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activePreviewMediaUrl.startsWith("blob:") ? activePreviewMediaUrl : getMediaPlaybackUrl(activePreviewMediaUrl)}
                            alt="Reklam Afişi"
                            className={`max-h-56 w-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-slate-900/80 border-2 border-dashed border-amber-400/30 p-4 text-center">
                        <span className="text-2xl">🖼️</span>
                        <p className="mt-1 text-xs font-bold text-slate-300">Sponsorlu Afiş Görseli Bekleniyor</p>
                        <p className="mt-0.5 text-[0.65rem] text-slate-500">Görsel yüklediğinizde anında burada görüntülenecektir.</p>
                      </div>
                    )}

                    {/* Target Link CTA */}
                    <div>
                      <a
                        href={getResolvedTargetUrl() || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105 transition"
                      >
                        {ctaText} ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
