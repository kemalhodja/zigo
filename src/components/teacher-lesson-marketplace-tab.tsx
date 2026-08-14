"use client";

import Link from "next/link";
import { useState } from "react";

import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import type {
  PrivateLessonBidWithTeacher,
  PrivateLessonPostWithDetails,
} from "@/lib/domain/private-lessons";

export function TeacherLessonMarketplaceTab({
  posts = [],
  teacherBranches = [],
}: {
  posts: PrivateLessonPostWithDetails[];
  teacherBranches: string[];
}) {
  const [selectedPost, setSelectedPost] = useState<PrivateLessonPostWithDetails | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    if (!bidPrice || Number(bidPrice) <= 0) {
      setError("Lütfen geçerli bir saatlik ücret girin.");
      return;
    }
    if (bidMessage.trim().length < 10) {
      setError("Lütfen kendinizi ve teklifinizi anlatan en az 10 karakterlik bir mesaj yazın.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/private-lessons/posts/${selectedPost.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerHourTry: Number(bidPrice),
          message: bidMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Teklif gönderilemedi.");
      }

      setSuccess("Teklifiniz başarıyla veliye iletildi! Veli profiliniz üzerinden sizinle iletişime geçebilir.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Bilgilendirme Kartı */}
      <section className="-mx-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 p-4 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-teal-900">
              Özel Ders İlan Pazaryeri
            </h2>
            <p className="text-[0.7rem] font-bold text-teal-700 mt-0.5">
              Yalnızca branşınızla ({teacherBranches.join(", ") || "Seçili branşınız yok"}) eşleşen açık ilanlar listelenir.
            </p>
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-night">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            📭
          </div>
          <h3 className="mt-3 text-sm font-black">Şu an branşınıza uygun açık ilan bulunmuyor</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 max-w-xs mx-auto">
            Veliler yeni özel ders ilanı verdiğinde branşınıza göre otomatik olarak bu sekmede görünecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const hasMyBid = Boolean(post.my_bid);
            const isFull = post.bids_count >= 5;

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <SocialAvatar
                      label={post.parent?.full_name || "Veli"}
                      imageUrl={post.parent?.avatar_url}
                      className="size-10 text-sm"
                    />
                    <div>
                      <h4 className="text-xs font-black text-night">
                        {post.parent?.full_name || "Veli"}
                        {post.child_profile ? (
                          <span className="text-[0.68rem] font-normal text-slate-500"> ({post.child_profile.name} için)</span>
                        ) : null}
                      </h4>
                      <p className="text-[0.68rem] font-bold text-slate-500">
                        {new Date(post.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Kalan Teklif Kontenjanı */}
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[0.68rem] font-black ${
                      isFull
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {post.bids_count}/5 Teklif
                  </span>
                </div>

                {/* Etiketler */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[0.7rem] font-black text-teal-700">
                    📚 {post.area?.area_name}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700">
                    🎓 {post.grade_level}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700">
                    {post.mode === "online" ? "💻 Online" : post.mode === "in_person" ? "🏫 Yüz Yüze" : "🔄 Online / Yüz Yüze"}
                  </span>
                  {post.city ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700">
                      📍 {post.city} {post.district ? `(${post.district})` : ""}
                    </span>
                  ) : null}
                  {post.budget_try ? (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[0.7rem] font-black text-amber-800">
                      💰 Bütçe: {post.budget_try} ₺ / saat
                    </span>
                  ) : null}
                </div>

                {/* Açıklama */}
                <p className="mt-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                  {post.description}
                </p>

                {/* Aksiyon Alanı */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  {hasMyBid ? (
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <span>✓</span>
                      <span>Teklifiniz Verildi: {post.my_bid?.price_per_hour_try} ₺/saat</span>
                    </div>
                  ) : isFull ? (
                    <span className="text-xs font-bold text-slate-400">
                      Kontenjan doldu (5/5)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(post);
                        setBidPrice(post.budget_try ? String(post.budget_try) : "");
                        setBidMessage("");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="tap-scale ml-auto rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
                    >
                      Teklif Ver 🚀
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Teklif Verme Modalı */}
      {selectedPost ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl text-night">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 font-bold">
                  💼
                </div>
                <div>
                  <h3 className="text-sm font-black text-night">Özel Ders Teklifi Ver</h3>
                  <p className="text-[0.68rem] font-bold text-slate-500">
                    {selectedPost.area?.area_name} · {selectedPost.grade_level}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                type="button"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 text-center">
                {success}
              </div>
            ) : (
              <form onSubmit={handleSendBid} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Saatlik Ücret Teklifiniz (₺) *
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    step="50"
                    placeholder="Örn: 600"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Veliye Notunuz / Deneyiminiz * (Min. 10 karakter)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Deneyiminiz, öğretim metodolojiniz ve uygun ders saatleriniz hakkında bilgi verin..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 text-xs font-black text-white shadow-md shadow-teal-600/30 hover:brightness-110 disabled:opacity-50"
                  >
                    {isSubmitting ? "Gönderiliyor..." : "Teklifi İlet 🚀"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
