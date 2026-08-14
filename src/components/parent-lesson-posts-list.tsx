"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import type {
  PrivateLessonBidWithTeacher,
  PrivateLessonPostWithDetails,
} from "@/lib/domain/private-lessons";

export function ParentLessonPostsList({
  posts = [],
}: {
  posts: PrivateLessonPostWithDetails[];
}) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [bids, setBids] = useState<PrivateLessonBidWithTeacher[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [dmModalTeacher, setDmModalTeacher] = useState<any | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [dmStatus, setDmStatus] = useState<string | null>(null);

  const fetchBids = async (postId: string) => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
      return;
    }

    setSelectedPostId(postId);
    setLoadingBids(true);
    try {
      const res = await fetch(`/api/private-lessons/posts/${postId}/bids`);
      const data = await res.json();
      if (res.ok) {
        setBids(data.data || []);
      }
    } catch (e) {
      console.error("Bids fetch error", e);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleStartDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmModalTeacher) return;

    setIsSendingDm(true);
    setDmStatus(null);

    try {
      const res = await fetch("/api/lesson-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: dmModalTeacher.id,
          messageBody: dmMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mesaj gönderilemedi.");
      }

      setDmStatus("success");
      setTimeout(() => {
        setDmModalTeacher(null);
        setDmMessage("");
        setDmStatus(null);
      }, 1500);
    } catch (err: any) {
      setDmStatus(err.message || "Mesaj gönderilemedi.");
    } finally {
      setIsSendingDm(false);
    }
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="-mx-4 bg-slate-50/80 p-4 border-b border-slate-200/80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <span>🎯</span>
          <span>Yayınladığım Özel Ders Talepleri ({posts.length})</span>
        </h3>
      </div>

      <div className="space-y-3">
        {posts.map((post) => {
          const isExpanded = selectedPostId === post.id;

          return (
            <div
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[0.7rem] font-black text-teal-700">
                      {post.area?.area_name}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-600">
                      {post.grade_level}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-600">
                      {post.mode === "online" ? "💻 Online" : post.mode === "in_person" ? "🏫 Yüz Yüze" : "🔄 Her İkisi"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-700 font-medium line-clamp-2">
                    {post.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchBids(post.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                    post.bids_count > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {post.bids_count > 0 ? `📨 ${post.bids_count} Teklif Geldi` : "0 Teklif"}
                </button>
              </div>

              {/* Teklifler Listesi */}
              {isExpanded ? (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                  <p className="text-[0.68rem] font-black text-slate-400 uppercase tracking-wider">
                    Öğretmen Teklifleri ({bids.length} / 5)
                  </p>

                  {loadingBids ? (
                    <p className="text-xs text-slate-400 py-2">Teklifler yükleniyor...</p>
                  ) : bids.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 bg-slate-50 p-2.5 rounded-xl text-center">
                      Henüz bir öğretmen teklifte bulunmadı. Teklif geldiğinde burada listelenecektir.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/profile/${bid.teacher?.id}`}
                              className="flex items-center gap-2 hover:opacity-80 transition"
                            >
                              <SocialAvatar
                                label={bid.teacher?.full_name || "Öğretmen"}
                                imageUrl={bid.teacher?.avatar_url}
                                className="size-8 text-xs"
                              />
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-black text-night underline">
                                    {bid.teacher?.full_name}
                                  </span>
                                  {bid.teacher?.is_verified ? (
                                    <VerifiedBadge className="size-3.5 text-crystal" />
                                  ) : null}
                                </div>
                                <span className="text-[0.62rem] text-slate-500 font-bold">Öğretmen Profili →</span>
                              </div>
                            </Link>

                            <span className="rounded-lg bg-emerald-100/70 px-2.5 py-1 text-xs font-black text-emerald-800">
                              {bid.price_per_hour_try} ₺ / saat
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100/80 leading-relaxed">
                            "{bid.message}"
                          </p>

                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            <Link
                              href={`/profile/${bid.teacher?.id}`}
                              className="rounded-lg bg-slate-200/80 px-2.5 py-1.5 text-[0.68rem] font-bold text-slate-700 hover:bg-slate-300"
                            >
                              Profili İncele
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setDmModalTeacher(bid.teacher);
                                setDmMessage(`Merhaba Sayın ${bid.teacher?.full_name}, ${post.area?.area_name} özel ders ilanımıza verdiğiniz ${bid.price_per_hour_try} ₺/saat teklifiniz için görüşmek isteriz.`);
                                setDmStatus(null);
                              }}
                              className="tap-scale rounded-lg bg-teal-600 px-3 py-1.5 text-[0.68rem] font-black text-white shadow-xs hover:bg-teal-700"
                            >
                              💬 DM ile Mesajlaş
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* DM Başlatma Modalı */}
      {dmModalTeacher ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl text-night">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SocialAvatar
                  label={dmModalTeacher.full_name || "Öğretmen"}
                  imageUrl={dmModalTeacher.avatar_url}
                  className="size-9 text-xs"
                />
                <div>
                  <h3 className="text-sm font-black text-night">
                    {dmModalTeacher.full_name} ile DM Başlat
                  </h3>
                  <p className="text-[0.68rem] font-bold text-slate-500">
                    Doğrulanmış Öğretmen Mesajlaşması
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDmModalTeacher(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                type="button"
              >
                ✕
              </button>
            </div>

            {dmStatus === "success" ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 text-center">
                ✓ Mesajınız öğretmene başarıyla iletildi!
              </div>
            ) : (
              <form onSubmit={handleStartDm} className="mt-4 space-y-3">
                {dmStatus && dmStatus !== "success" ? (
                  <div className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-600">
                    {dmStatus}
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Mesajınız *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDmModalTeacher(null)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingDm}
                    className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-black text-white shadow-md shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isSendingDm ? "Gönderiliyor..." : "Mesajı Gönder 🚀"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
