"use client";

import { useEffect, useState } from "react";

import { CreateAdCampaignModal } from "@/components/create-ad-campaign-modal";

type AdCampaign = {
  id: string;
  title: string | null;
  caption: string | null;
  media_url: string | null;
  sponsored_label: string | null;
  sponsored_target_url: string | null;
  sponsored_status: "pending" | "approved" | "rejected";
  view_count: number;
  click_count: number;
  city: string | null;
  district: string | null;
  created_at: string;
};

export function AdCampaignsManager() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchCampaigns() {
    setLoading(true);
    fetch("/api/social/posts?limit=30")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          // Filter sponsored posts
          const sponsored = data.data.filter(
            (p: { sponsored_label?: string | null; sponsored_status?: string | null; sponsored_target_url?: string | null }) =>
              p.sponsored_label || p.sponsored_status || p.sponsored_target_url,
          );
          setCampaigns(sponsored);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <h3 className="text-sm font-black text-white">Sponsorlu Reklam & Kampanya Yöneticisi</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Reklamlarınızı oluşturun, hedef kitlenizi seçin ve canlı tıklama analitiğini takip edin.
          </p>
        </div>
        <CreateAdCampaignModal onSuccess={fetchCampaigns} />
      </div>

      {/* Campaign List / Analytics Cards */}
      {loading ? (
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
          Reklam kampanyalarınız yükleniyor...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center space-y-3">
          <span className="text-4xl">🎯</span>
          <h4 className="text-sm font-black text-white">Henüz Bir Reklam Kampanyanız Bulunmuyor</h4>
          <p className="mx-auto max-w-sm text-xs text-slate-400 leading-relaxed">
            Zigo'daki binlerce öğrenci ve veliye ulaşmak için hemen ilk sponsorlu reklamınızı oluşturun.
          </p>
          <div className="pt-2">
            <CreateAdCampaignModal onSuccess={fetchCampaigns} triggerLabel="🚀 İlk Reklamını Oluştur" />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((ad) => {
            const ctr = ad.view_count > 0 ? ((ad.click_count / ad.view_count) * 100).toFixed(1) : "0.0";
            const isApproved = ad.sponsored_status === "approved";
            const isPending = ad.sponsored_status === "pending";

            return (
              <div
                key={ad.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wider ${
                      isApproved
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : isPending
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {isApproved ? "🟢 Yayında (Aktif)" : isPending ? "⏳ Onay Bekliyor" : "🔴 Reddedildi / Pasif"}
                  </span>
                  <span className="text-[0.65rem] font-bold text-slate-400">
                    {ad.city ? `📍 ${ad.city}` : "🇹🇷 Tüm Türkiye"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  {ad.media_url ? (
                    <img src={ad.media_url} alt="" className="size-12 rounded-xl object-cover shrink-0 border border-slate-700" />
                  ) : (
                    <div className="size-12 flex items-center justify-center rounded-xl bg-slate-800 text-lg shrink-0">
                      📢
                    </div>
                  )}
                  <div className="flex-1 truncate">
                    <h4 className="text-xs font-black text-white truncate">{ad.title || ad.caption || "Sponsorlu İçerik"}</h4>
                    <p className="mt-0.5 text-[0.68rem] text-slate-400 truncate">
                      {ad.sponsored_label || "Sponsorlu Reklam"}
                    </p>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/80 p-2.5 text-center border border-slate-800">
                  <div>
                    <span className="text-[0.6rem] font-bold uppercase text-slate-400 block">Gösterim</span>
                    <span className="text-xs font-black text-white">👁️ {ad.view_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-[0.6rem] font-bold uppercase text-slate-400 block">Tıklama</span>
                    <span className="text-xs font-black text-amber-400">🖱️ {ad.click_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-[0.6rem] font-bold uppercase text-slate-400 block">CTR Oranı</span>
                    <span className="text-xs font-black text-emerald-400">📈 %{ctr}</span>
                  </div>
                </div>

                {ad.sponsored_target_url ? (
                  <a
                    href={ad.sponsored_target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-slate-800 py-2 text-[0.68rem] font-bold text-slate-300 hover:bg-slate-700 truncate px-2"
                  >
                    🔗 {ad.sponsored_target_url} ↗
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
