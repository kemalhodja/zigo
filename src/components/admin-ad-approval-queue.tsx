"use client";

import { useCallback, useEffect, useState } from "react";

import { SocialMediaFrame } from "@/components/social-media-frame";

type PendingAd = {
  id: string;
  author_name: string;
  title: string | null;
  caption: string;
  media_url: string | null;
  media_type: string;
  target_audience: string;
  city: string | null;
  district: string | null;
  created_at: string;
};

export function AdminAdApprovalQueue() {
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const loadPendingAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads/pending");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data) {
        setAds(json.data as PendingAd[]);
      } else {
        setAds([]);
      }
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingAds();
  }, [loadPendingAds]);

  async function handleAction(postId: string, action: "approve" | "reject") {
    setActioningId(postId);
    setMsg("");
    try {
      const res = await fetch("/api/admin/ads/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "İşlem başarısız");
      }
      setMsg(json.data?.message || "Durum güncellendi");
      setAds((prev) => prev.filter((a) => a.id !== postId));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "İşlem hatası");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <section className="-mx-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <div>
          <span className="text-[0.65rem] font-black uppercase tracking-wider text-amber-700">Moderasyon Paneli</span>
          <h3 className="text-lg font-black text-night">📢 Onay Bekleyen Reklamlar ({ads.length})</h3>
        </div>
        <button
          type="button"
          onClick={() => void loadPendingAds()}
          className="text-xs font-black text-amber-800 hover:underline"
        >
          Yenile 🔄
        </button>
      </div>

      {msg ? <p className="rounded-lg bg-white p-2.5 text-xs font-bold text-emerald-700 shadow-xs">{msg}</p> : null}

      {loading ? (
        <p className="py-4 text-center text-xs font-bold text-slate-500">Onay bekleyen reklamlar yükleniyor...</p>
      ) : ads.length === 0 ? (
        <div className="rounded-xl bg-white p-4 text-center text-xs font-bold text-slate-500 shadow-xs">
          ✅ Onay bekleyen sponsorlu reklam bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" key={ad.id}>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-night">👤 {ad.author_name}</span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.62rem] font-black text-amber-800">
                    Onay Bekliyor
                  </span>
                </div>

                <p className="text-sm font-black text-night">{ad.title || "Sponsorlu Paylaşım"}</p>
                <p className="text-xs text-slate-600 leading-4">{ad.caption}</p>

                {ad.media_url ? (
                  <div className="mt-2 h-36 overflow-hidden rounded-lg">
                    <SocialMediaFrame mediaType={ad.media_type} mediaUrl={ad.media_url} />
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] font-bold text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-1">
                    🎯 Kitle: {ad.target_audience === "parent_only" ? "Sadece Veliler" : ad.target_audience === "grade" ? "Sadece Öğrenciler" : "Herkes"}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1">
                    📍 Konum: {ad.city ? `${ad.city} ${ad.district ? `/ ${ad.district}` : ""}` : "Tüm Türkiye"}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => void handleAction(ad.id, "reject")}
                    disabled={actioningId === ad.id}
                    className="tap-scale flex-1 rounded-lg bg-rose-50 border border-rose-200 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    ❌ Reddet
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAction(ad.id, "approve")}
                    disabled={actioningId === ad.id}
                    className="tap-scale flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    ✅ Onayla ve Yayına Al
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
