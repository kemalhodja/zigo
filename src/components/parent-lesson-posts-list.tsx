"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";
import type {
  PrivateLessonBidWithTeacher,
  PrivateLessonPostWithDetails,
} from "@/lib/domain/private-lessons";

type DmModalTeacher = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
};

export function ParentLessonPostsList({
  posts = [],
}: {
  posts: PrivateLessonPostWithDetails[];
}) {
  const [postList, setPostList] = useState<PrivateLessonPostWithDetails[]>(posts);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [bids, setBids] = useState<PrivateLessonBidWithTeacher[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [dmModalTeacher, setDmModalTeacher] = useState<DmModalTeacher | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [dmStatus, setDmStatus] = useState<string | null>(null);
  const [closingPostId, setClosingPostId] = useState<string | null>(null);

  // Gelen prop değiştiğinde listeyi senkronize et
  useEffect(() => {
    setPostList(posts);
  }, [posts]);

  // Yeni ilan verildiğinde listeyi dinamik yenile
  useEffect(() => {
    const handleCreated = async () => {
      try {
        const res = await fetch("/api/private-lessons/posts");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            setPostList(json.data);
          }
        }
      } catch {
        // sessizce geç
      }
    };

    window.addEventListener("zigo:lesson-post-created", handleCreated);
    return () => window.removeEventListener("zigo:lesson-post-created", handleCreated);
  }, []);

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

  const handleClosePost = async (postId: string) => {
    if (!window.confirm("Bu özel ders ilanını kapatmak istediğinize emin misiniz? Kapatılan ilanlara yeni öğretmen teklifi gelmez.")) {
      return;
    }

    setClosingPostId(postId);
    try {
      const res = await fetch(`/api/private-lessons/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "İlan kapatılamadı.");
      }

      // Yerel listede durumu güncelle
      setPostList((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "closed" } : p)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "İlan kapatılırken hata oluştu.");
    } finally {
      setClosingPostId(null);
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
    } catch (err) {
      setDmStatus(err instanceof Error ? err.message : "Mesaj gönderilemedi.");
    } finally {
      setIsSendingDm(false);
    }
  };

  if (postList.length === 0) {
    return (
      <section className="-mx-4 bg-slate-50/70 p-4 border-b border-slate-200/80 sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🎯</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Özel Ders Taleplerim
          </h3>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
          <p className="text-xs font-bold text-slate-600">
            Henüz aktif bir özel ders talebiniz bulunmuyor.
          </p>
          <p className="mt-1 text-[0.68rem] text-slate-400">
            İhtiyacınız olan ders için ilan vererek branş öğretmenlerinden doğrudan teklif toplayabilirsiniz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="-mx-4 bg-slate-50/80 p-4 border-b border-slate-200/80 sm:mx-0 sm:rounded-2xl sm:border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <span>🎯</span>
          <span>Özel Ders Taleplerim ({postList.length})</span>
        </h3>
      </div>

      <div className="space-y-3">
        {postList.map((post) => {
          const isExpanded = selectedPostId === post.id;
          const isClosed = post.status === "closed";

          return (
            <div
              key={post.id}
              className={`rounded-2xl border bg-white p-4 shadow-xs transition-all ${
                isClosed ? "border-slate-200/60 opacity-80" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-lg bg-teal-50 px-2.5 py-0.5 text-[0.7rem] font-black text-teal-700">
                      {post.area?.area_name}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-600">
                      {post.grade_level}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.7rem] font-bold text-slate-600">
                      {post.mode === "online"
                        ? "💻 Online"
                        : post.mode === "in_person"
                        ? "🏫 Yüz Yüze"
                        : "🔄 Her İkisi"}
                    </span>
                    {post.city ? (
                      <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[0.68rem] font-bold text-indigo-700">
                        📍 {post.city} {post.district ? `/ ${post.district}` : ""}
                      </span>
                    ) : null}
                    {post.budget_try ? (
                      <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[0.68rem] font-black text-amber-800">
                        💰 ~{post.budget_try} ₺/saat
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {post.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[0.65rem] font-bold text-slate-400">
                    <span>
                      {isClosed ? "⚪ İlan Kapatıldı" : "🟢 Açık (Teklif Alıyor)"}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchBids(post.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                      post.bids_count > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {post.bids_count > 0 ? `📨 ${post.bids_count} Teklif Geldi` : "0 Teklif"}
                  </button>

                  {!isClosed ? (
                    <button
                      type="button"
                      disabled={closingPostId === post.id}
                      onClick={() => handleClosePost(post.id)}
                      className="text-[0.65rem] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                      title="İlanı Kapat"
                    >
                      {closingPostId === post.id ? "Kapatılıyor..." : "İlanı Kapat"}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Teklifler Listesi */}
              {isExpanded ? (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.68rem] font-black text-slate-500 uppercase tracking-wider">
                      Öğretmen Teklifleri ({bids.length} / 5)
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Maksimum 5 öğretmen teklifi
                    </span>
                  </div>

                  {loadingBids ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Teklifler yükleniyor...</p>
                  ) : bids.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 bg-slate-50 p-3 rounded-2xl text-center">
                      Henüz bir öğretmen teklifte bulunmadı. İlanınıza uygun öğretmenler teklif verdiğinde burada listelenecektir.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/profile/${bid.teacher?.id}`}
                              className="flex items-center gap-2 hover:opacity-80 transition"
                            >
                              <SocialAvatar
                                label={bid.teacher?.full_name || "Öğretmen"}
                                imageUrl={bid.teacher?.avatar_url}
                                className="size-9 text-xs"
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

                            <span className="rounded-xl bg-emerald-100/80 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-xs">
                              {bid.price_per_hour_try} ₺ / saat
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100/80 leading-relaxed font-medium">
                            "{bid.message}"
                          </p>

                          <div className="mt-3 flex items-center justify-end gap-2">
                            <Link
                              href={`/profile/${bid.teacher?.id}`}
                              className="rounded-xl bg-slate-200/80 px-3 py-1.5 text-[0.68rem] font-bold text-slate-700 hover:bg-slate-300 transition"
                            >
                              Profili İncele
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setDmModalTeacher(bid.teacher ?? null);
                                setDmMessage(
                                  `Merhaba Sayın ${bid.teacher?.full_name}, ${post.area?.area_name} özel ders talebimize verdiğiniz ${bid.price_per_hour_try} ₺/saat teklifiniz için görüşmek isteriz.`,
                                );
                                setDmStatus(null);
                              }}
                              className="tap-scale rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-1.5 text-[0.68rem] font-black text-white shadow-xs hover:brightness-105 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDmModalTeacher(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl text-night animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <SocialAvatar
                  label={dmModalTeacher.full_name || "Öğretmen"}
                  imageUrl={dmModalTeacher.avatar_url}
                  className="size-10 text-xs"
                />
                <div>
                  <h3 className="text-sm font-black text-night">
                    {dmModalTeacher.full_name} ile İletişim
                  </h3>
                  <p className="text-[0.68rem] font-bold text-slate-500">
                    Özel Ders Talebi Mesajlaşması
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDmModalTeacher(null)}
                className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
                type="button"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            {dmStatus === "success" ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-xs font-black text-emerald-800 text-center border border-emerald-200">
                ✓ Mesajınız öğretmene başarıyla iletildi!
              </div>
            ) : (
              <form onSubmit={handleStartDm} className="mt-4 space-y-3.5">
                {dmStatus && dmStatus !== "success" ? (
                  <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-200">
                    {dmStatus}
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Öğretmene İletilecek Mesajınız *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDmModalTeacher(null)}
                    className="tap-scale flex-1 rounded-2xl bg-slate-100 py-3 text-xs font-black text-slate-600 hover:bg-slate-200 transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingDm}
                    className="tap-scale flex-1 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-xs font-black text-white shadow-md shadow-teal-600/25 hover:brightness-105 transition disabled:opacity-50"
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
