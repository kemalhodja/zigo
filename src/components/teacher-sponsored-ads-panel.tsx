"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TeacherSponsoredAdSummary } from "@/lib/domain/sponsored-ads";

type TeacherSponsoredAdsPanelProps = {
  canManage?: boolean;
};

export function TeacherSponsoredAdsPanel({ canManage = true }: TeacherSponsoredAdsPanelProps) {
  const [ads, setAds] = useState<TeacherSponsoredAdSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/teacher/sponsored-ads?limit=10");
        const payload = (await response.json().catch(() => null)) as {
          data?: TeacherSponsoredAdSummary[];
          error?: string;
        } | null;
        if (!response.ok) {
          setMessage(payload?.error ?? "Sponsorlu reklamlar yüklenemedi.");
          setLoading(false);
          return;
        }
        setAds(payload?.data ?? []);
        setLoading(false);
      } catch {
        setMessage("Bağlantı hatası.");
        setLoading(false);
      }
    })();
  }, [canManage]);

  if (!canManage) return null;

  return (
    <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sponsorlu reklamlar</p>
      <h2 className="mt-1 text-lg font-black text-night">Yayınladığınız sponsorlu içerikler</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Zigo Plus ile paylaştığınız reklamların durumu ve tıklama sayıları.
      </p>

      {loading ? <p className="mt-3 text-sm font-bold text-slate-500">Yükleniyor...</p> : null}
      {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}

      {!loading && ads.length === 0 ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-4">
          <p className="text-sm font-bold text-slate-600">Henüz sponsorlu reklam yok.</p>
          <Link className="mt-2 inline-flex text-sm font-black text-crystal" href="/create">
            Gönderi oluştururken sponsorlu reklam ekleyin
          </Link>
        </div>
      ) : null}

      {ads.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {ads.map((ad) => (
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3" key={ad.post_id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-night">{ad.sponsored_label}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{ad.caption}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">
                  {ad.sponsored_click_count} tık
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <span>{ad.sponsored_status ?? "active"}</span>
                {ad.sponsored_expires_at ? (
                  <span>Bitiş: {new Date(ad.sponsored_expires_at).toLocaleDateString("tr-TR")}</span>
                ) : null}
                <Link className="text-crystal" href={`/post/${ad.post_id}`}>
                  Gönderiyi gör
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
