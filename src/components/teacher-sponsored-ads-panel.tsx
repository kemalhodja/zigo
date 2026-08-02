"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProfileAdvertiseModal } from "@/components/profile-advertise-modal";
import {
  formatSponsoredCtr,
  type SponsoredAdStatus,
  type TeacherSponsoredAdSummary,
} from "@/lib/domain/sponsored-ads";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

type TeacherSponsoredAdsPanelProps = {
  profile: {
    id?: string;
    role?: string | null;
    organization_type?: string | null;
    full_name?: string | null;
  };
};

export function TeacherSponsoredAdsPanel({ profile }: TeacherSponsoredAdsPanelProps) {
  const b = useMessages().billingUi;
  const locale = useLocale();
  const [ads, setAds] = useState<TeacherSponsoredAdSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);
    try {
      const response = await fetch("/api/teacher/sponsored-ads?limit=10");
      const payload = (await response.json().catch(() => null)) as {
        data?: TeacherSponsoredAdSummary[];
        error?: string;
        code?: string;
      } | null;
      if (!response.ok) {
        setAds([]);
        // Normalise to a known code so the i18n error message is always shown
        // (never expose raw English server error strings in the UI).
        setErrorCode(payload?.code ?? "LOAD_FAILED");
        return;
      }
      setAds(payload?.data ?? []);
    } catch {
      setAds([]);
      setErrorCode("LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAds();
  }, [loadAds]);

  const errorMessage =
    errorCode === "UNAUTHORIZED"
      ? b.sponsoredPanelErrorAuth
      : errorCode === "TEACHER_ONLY"
        ? b.sponsoredPanelErrorTeacher
        : errorCode
          ? b.sponsoredPanelErrorLoad
          : null;

  return (
    <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {b.sponsoredPanelEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black text-night">{b.sponsoredPanelTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{b.sponsoredPanelDesc}</p>
        </div>
        <ProfileAdvertiseModal isOwner profile={profile} />
      </div>

      {loading ? <p className="mt-3 text-sm font-bold text-slate-500">{b.sponsoredPanelLoading}</p> : null}

      {!loading && errorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-4">
          <p className="text-sm font-bold text-rose-700">{errorMessage}</p>
          <button
            className="mt-3 text-sm font-black text-crystal"
            onClick={() => void loadAds()}
            type="button"
          >
            {b.sponsoredPanelRetry}
          </button>
        </div>
      ) : null}

      {!loading && !errorMessage && ads.length === 0 ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-4">
          <p className="text-sm font-bold text-slate-600">{b.sponsoredPanelEmpty}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{b.sponsoredPanelEmptyHint}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="text-sm font-black text-crystal" href="/create">
              {b.sponsoredPanelCreateHint}
            </Link>
            <Link className="text-sm font-black text-slate-500" href="/billing">
              {b.sponsoredPanelPlansHint}
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !errorMessage && ads.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {ads.map((ad) => (
            <li className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3" key={ad.post_id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-night">
                    {ad.sponsored_label || b.sponsoredPanelUntitled}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{ad.caption}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">
                    {b.sponsoredPanelClicks.replace("{count}", String(ad.sponsored_click_count))}
                  </span>
                  {typeof ad.sponsored_view_count === "number" ? (
                    <>
                      <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-500">
                        {b.sponsoredPanelViews.replace("{count}", String(ad.sponsored_view_count))}
                      </span>
                      <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-black text-crystal">
                        {b.sponsoredPanelCtr.replace(
                          "{rate}",
                          formatSponsoredCtr(ad.sponsored_click_count, ad.sponsored_view_count, locale === "en" ? "en-GB" : "tr-TR"),
                        )}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <span>{statusLabel(ad.sponsored_status, b)}</span>
                {ad.sponsored_expires_at ? (
                  <span>
                    {b.sponsoredPanelExpires.replace(
                      "{date}",
                      new Date(ad.sponsored_expires_at).toLocaleDateString(
                        locale === "en" ? "en-GB" : "tr-TR",
                      ),
                    )}
                  </span>
                ) : null}
                <Link className="text-crystal" href={`/post/${ad.post_id}`}>
                  {b.sponsoredPanelViewPost}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function statusLabel(
  status: SponsoredAdStatus | string | null,
  b: ReturnType<typeof useMessages>["billingUi"],
) {
  if (status === "paused") return b.sponsoredPanelStatusPaused;
  if (status === "expired") return b.sponsoredPanelStatusExpired;
  return b.sponsoredPanelStatusActive;
}
