"use client";

import { useState } from "react";
import { useMessages } from "@/lib/i18n/locale-context";

type CreateAdCampaignModalProps = {
  existingPostId?: string;
  onSuccess?: () => void;
  triggerLabel?: string;
};

const TURKEY_CITIES = [
  "Tüm Türkiye (Lokasyon kısıtlamasız)",
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Kocaeli",
  "Mersin",
  "Diyarbakır",
  "Samsun",
  "Denizli",
  "Eskişehir",
  "Kayseri",
  "Trabzon",
  "Manisa",
];

export function CreateAdCampaignModal({
  existingPostId,
  onSuccess,
  triggerLabel,
}: CreateAdCampaignModalProps) {
  const m = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<"existing" | "new">(existingPostId ? "existing" : "new");

  // Form states
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState<"all" | "student" | "parent">("all");
  const [selectedCity, setSelectedCity] = useState("Tüm Türkiye (Lokasyon kısıtlamasız)");
  const [district, setDistrict] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileUpload(file: File) {
    setIsUploading(true);
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
        throw new Error(data.error || "Görsel yüklenemedi");
      }
      setMediaUrl(data.data.avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const cityVal = selectedCity.includes("Tüm Türkiye") ? null : selectedCity;

    try {
      const res = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPostId: method === "existing" ? existingPostId : undefined,
          title: title.trim(),
          caption: caption.trim(),
          targetUrl: targetUrl.trim() || undefined,
          mediaUrl: mediaUrl || undefined,
          targetAudience,
          city: cityVal,
          district: district.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Reklam oluşturulamadı");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reklam oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex tap-scale items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-amber-500/20 hover:brightness-105"
      >
        <span>📢</span>
        <span>{triggerLabel || (existingPostId ? "Sponsorlu Reklama Dönüştür" : "Reklam Ver (Görsel/Afiş Yükle)")}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-block rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[0.65rem] font-black uppercase text-amber-400">
                  📢 Reklam Yayınlama Merkezi
                </span>
                <h3 className="mt-1 text-xl font-black text-white">Sponsorlu Reklam Oluştur</h3>
                <p className="mt-0.5 text-xs text-slate-400">İçeriğini hedef kitleye ve lokasyona özel öne çıkar.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Success state */}
            {success ? (
              <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-emerald-300">
                <div className="text-4xl">⏳</div>
                <h4 className="mt-2 text-lg font-black text-white">Reklamınız Başarıyla Gönderildi!</h4>
                <p className="mt-1 text-xs font-bold text-emerald-400">
                  Reklamınız incelenmek üzere Admin onayına sunuldu. Onaylandıktan sonra seçtiğiniz kitleye yayınlanacaktır.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {error ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                    ⚠️ {error}
                  </div>
                ) : null}

                {/* Yöntem seçimi (Eğer existingPostId verilmemişse) */}
                {!existingPostId ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod("new")}
                      className={`rounded-xl p-3 text-xs font-black transition ${
                        method === "new" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      🖼️ Görsel / Afiş Yükle (2. Yöntem)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("existing")}
                      className={`rounded-xl p-3 text-xs font-black transition ${
                        method === "existing" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      📌 Paylaşımı Reklam Yap (1. Yöntem)
                    </button>
                  </div>
                ) : null}

                {/* Başlık & Açıklama */}
                {method === "new" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Reklam Başlığı / Etiketi</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Örn: 2026 LGS Matematik Kampı Kayıtları Başladı"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Açıklama / Metin</label>
                      <textarea
                        required
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                        placeholder="Reklamında öğrencilere/velilere iletmek istediğin detaylar..."
                        className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Görsel / Afiş Yükle</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(file);
                        }}
                        className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-slate-700"
                      />
                      {isUploading ? <p className="text-[0.65rem] text-amber-400">Görsel yükleniyor...</p> : null}
                      {mediaUrl ? <p className="text-[0.65rem] text-emerald-400">✓ Görsel hazır!</p> : null}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Hedef Bağlantı (URL)</label>
                      <input
                        type="url"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://siteniz.com veya WhatsApp linki"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : null}

                {/* Hedef Kitle Seçimi */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-amber-400">🎯 Hedef Kitle Seçimi</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetAudience("all")}
                      className={`rounded-xl p-2.5 text-center text-xs font-black border transition ${
                        targetAudience === "all" ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-400"
                      }`}
                    >
                      👥 Herkes
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAudience("student")}
                      className={`rounded-xl p-2.5 text-center text-xs font-black border transition ${
                        targetAudience === "student" ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-400"
                      }`}
                    >
                      🎓 Öğrenciler
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAudience("parent")}
                      className={`rounded-xl p-2.5 text-center text-xs font-black border transition ${
                        targetAudience === "parent" ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-400"
                      }`}
                    >
                      👨‍👩‍👧 Veliler
                    </button>
                  </div>
                </div>

                {/* Lokasyon Hedefleme */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[0.68rem] font-black uppercase tracking-wider text-amber-400">📍 Lokasyon Hedefleme (İsteğe Bağlı)</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {TURKEY_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>

                  {!selectedCity.includes("Tüm Türkiye") ? (
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="İlçe girin (Örn: Kadıköy, Çankaya) - İsteğe bağlı"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  ) : null}
                </div>

                {/* Bilgi Kutusu */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[0.68rem] text-amber-300 leading-4">
                  🛡️ <strong>Admin Onay Süreci:</strong> Oluşturduğunuz reklam Admin onayına sunulacak, onaylandıktan sonra belirlenen kitleye ve konuma yayınlanacaktır.
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-black text-slate-300 hover:bg-slate-700"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="tap-scale flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-slate-950 shadow-md hover:brightness-105 disabled:opacity-60"
                  >
                    {isSubmitting ? "Gönderiliyor..." : "Onaya Gönder 🚀"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
