"use client";

import { useEffect, useState } from "react";
import { useMessages } from "@/lib/i18n/locale-context";
import { getDistrictsForCity } from "@/lib/domain/turkey-cities-districts";

type CreateAdCampaignModalProps = {
  existingPostId?: string;
  onSuccess?: () => void;
  triggerLabel?: string;
};

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
}: CreateAdCampaignModalProps) {
  const m = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<"existing" | "new">(existingPostId ? "existing" : "new");

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(existingPostId || null);

  // User posts for selection
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Uploading & Submitting
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function handleFileUpload(file: File, isAudio = false) {
    if (isAudio) setIsUploadingAudio(true);
    else setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.data?.avatarUrl) {
        throw new Error(data.error || "Dosya yüklenemedi");
      }
      if (isAudio) {
        setAudioUrl(data.data.avatarUrl);
      } else {
        setMediaUrl(data.data.avatarUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      if (isAudio) setIsUploadingAudio(false);
      else setIsUploading(false);
    }
  }

  const isVideoMedia = mediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(mediaUrl) || mediaUrl.includes("video") : false;

  // Resolve Target URL & CTA Label based on channel choice
  function getResolvedTargetUrl() {
    if (ctaChannel === "whatsapp") {
      const cleanPhone = whatsappPhone.replace(/\D/g, "");
      if (!cleanPhone) return "";
      const formatted = cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone}`;
      return `https://wa.me/${formatted}?text=${encodeURIComponent(`Merhaba, Zigo'daki "${title || 'Sponsorlu'}" reklamınız hakkında bilgi almak istiyorum.`)}`;
    }
    if (ctaChannel === "dm") {
      return `/messages`;
    }
    return websiteUrl.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation for WhatsApp Channel
    if (ctaChannel === "whatsapp") {
      const cleanPhone = whatsappPhone.replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        setError("WhatsApp reklamı verebilmek için geçerli bir telefon numarası girilmesi veya profilde kayıtlı olması zorunludur.");
        setIsSubmitting(false);
        return;
      }
    }

    if (ctaChannel === "website" && !websiteUrl.trim()) {
      setError("Lütfen yönlendirilecek web sitesi bağlantısını girin.");
      setIsSubmitting(false);
      return;
    }

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
      const res = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPostId: method === "existing" ? selectedPostId : undefined,
          title: title.trim(),
          caption: caption.trim(),
          targetUrl: finalTargetUrl || undefined,
          buttonText: ctaText,
          mediaUrl: mediaUrl || undefined,
          audioUrl: audioUrl || undefined,
          targetAudience: audienceStr,
          city: cityStr,
          district: selectedDistricts.length > 0 ? selectedDistricts.join(", ") : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403 || json.code === "SUBSCRIPTION_REQUIRED" || json.error?.includes("abonelik")) {
          setError("Sponsorlu reklam yayınlamak için aktif bir Zigo Plus aboneliğiniz olması gerekmektedir. Abonelik sayfasına yönlendiriliyorsunuz...");
          setTimeout(() => {
            window.location.href = "/profile#zigo-plus-plans";
          }, 1500);
          return;
        }
        throw new Error(json.error || "Reklam oluşturulamadı");
      }

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
          <div className="relative my-auto w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
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

            {success ? (
              <div className="my-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-6 text-center">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-3 text-lg font-black text-emerald-200">Reklamınız Başarıyla İncelemeye Gönderildi!</h3>
                <p className="mt-1 text-sm font-semibold text-emerald-100/80">
                  Tebrikler! Reklamınız yöneticilerimiz tarafından onaylandıktan sonra hedef kitlenizin akışında görünmeye başlayacaktır.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-6 lg:grid-cols-12">
                {/* Form Inputs (Left Column - 7 Cols) */}
                <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-7">
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
                                if (post.caption) setTitle(post.caption.substring(0, 40));
                                if (post.media_url) setMediaUrl(post.media_url);
                              }}
                              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                                selectedPostId === post.id ? "bg-amber-500/20 border border-amber-400" : "hover:bg-slate-700/50"
                              }`}
                            >
                              {post.media_url ? (
                                <img src={post.media_url} alt="" className="size-10 rounded-md object-cover" />
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
                      placeholder="Reklam detaylarını ve sunduğunuz fırsatları yazın..."
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
                        💬 Zigo DM (Direkt Mesaj)
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
                    <label className="block text-xs font-bold text-slate-300">Buton Üzerindeki Yazı (Hazır Alternatif Cümleler)</label>
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

                  {/* Media Upload & Audio Option */}
                  {method === "new" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300">Görsel veya Video Afiş</label>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, false);
                          }}
                          className="mt-1 block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-950 hover:file:bg-amber-300"
                        />
                        {isUploading ? <p className="mt-1 text-[0.65rem] text-amber-300 animate-pulse">Medya yükleniyor...</p> : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300">İsteğe Bağlı Arka Plan Sesi (Audio)</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, true);
                          }}
                          className="mt-1 block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-slate-600"
                        />
                        {isUploadingAudio ? <p className="mt-1 text-[0.65rem] text-amber-300 animate-pulse">Ses yükleniyor...</p> : null}
                      </div>
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
                        👨‍👩‍👧 Veliler
                      </button>
                    </div>
                  </div>

                  {/* Multi-Select City & Location */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Lokasyon / İl Seçimi (Birden Fazla İl Seçilebilir)</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-xl bg-slate-800/60 p-2 border border-slate-700">
                      <button
                        type="button"
                        onClick={toggleAllCities}
                        className={`rounded-lg px-2.5 py-1 text-[0.7rem] font-bold transition ${
                          isAllCities ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        🇹🇷 Tüm Türkiye
                      </button>
                      {TURKEY_CITIES.map((city) => {
                        const isSelected = !isAllCities && selectedCities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleCity(city)}
                            className={`rounded-lg px-2.5 py-1 text-[0.7rem] font-bold transition ${
                              isSelected ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {isSelected ? `✓ ${city}` : city}
                          </button>
                        );
                      })}
                    </div>
                    {!isAllCities && selectedCities.length > 0 ? (
                      <p className="mt-1 text-[0.68rem] text-amber-300 font-semibold">
                        Seçilen İller ({selectedCities.length}): {selectedCities.join(", ")}
                      </p>
                    ) : null}
                  </div>

                  {/* Dynamic Multi-Select District Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300">İlçe Seçimi (Birden Fazla İlçe Seçilebilir)</label>
                    {isAllCities ? (
                      <p className="mt-1 text-xs text-slate-500 italic">Tüm Türkiye seçildiğinde ilçe hedeflemesi yapılmaz.</p>
                    ) : selectedCities.length > 1 ? (
                      <p className="mt-1 text-xs text-amber-300/90 font-medium bg-amber-950/40 p-2 rounded-lg border border-amber-400/20">
                        ℹ️ Birden fazla il seçildiği için ilçe seçimi devre dışıdır. Seçilen illerin tüm ilçeleri hedeflenir.
                      </p>
                    ) : selectedCities.length === 1 ? (
                      <div className="mt-1.5">
                        <p className="text-[0.68rem] text-slate-400 font-semibold mb-1">
                          {selectedCities[0]} İli İçin Hedeflemek İstediğiniz İlçeleri Seçin:
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
                      disabled={isSubmitting || isUploading || isUploadingAudio}
                      className="tap-scale rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105 disabled:opacity-60"
                    >
                      {isSubmitting ? "Onaya Gönderiliyor..." : "🚀 Onaya Gönder"}
                    </button>
                  </div>
                </form>

                {/* Live Ad Preview Card (Right Column - 5 Cols) */}
                <div className="lg:col-span-5 border-t border-slate-800 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-300">👁️ Canlı Reklam Önizlemesi</p>
                  <p className="mt-0.5 text-[0.68rem] text-slate-400">Öğrencilerin ve velilerin akışında böyle görünecek:</p>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-amber-400/40 bg-slate-950 p-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-black uppercase text-slate-950">
                        Sponsorlu Reklam
                      </span>
                      <span className="text-[0.65rem] font-bold text-slate-400">
                        {isAllCities ? "🇹🇷 Tüm Türkiye" : selectedCities.join(", ")}
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-black text-white leading-snug">
                      {title || "Reklamınızın Başlığı Burada Görünecek"}
                    </h4>

                    {caption ? <p className="mt-1 text-xs text-slate-300 leading-relaxed">{caption}</p> : null}

                    {/* Media Container */}
                    {mediaUrl ? (
                      <div className="mt-2.5 overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
                        {isVideoMedia ? (
                          <video src={mediaUrl} controls autoPlay muted={false} className="max-h-48 w-full object-cover" />
                        ) : (
                          <img src={mediaUrl} alt="Reklam Afişi" className="max-h-48 w-full object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="mt-2.5 flex h-32 items-center justify-center rounded-xl bg-slate-800/60 border border-dashed border-slate-700 text-xs text-slate-500">
                        🖼️ Görsel / Video Afiş Alanı
                      </div>
                    )}

                    {/* Background Audio Player if provided */}
                    {audioUrl ? (
                      <div className="mt-2 rounded-lg bg-slate-900 p-2 border border-amber-400/30">
                        <p className="text-[0.62rem] font-bold text-amber-300">🎵 Arka Plan Seslendirmesi / Müzik</p>
                        <audio src={audioUrl} controls className="mt-1 h-7 w-full" />
                      </div>
                    ) : null}

                    {/* Target Link CTA */}
                    <div className="mt-3">
                      <a
                        href={getResolvedTargetUrl() || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-xs font-black text-slate-950 shadow-md"
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
