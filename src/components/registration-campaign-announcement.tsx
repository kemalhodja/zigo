"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TeacherCampaignCard } from "@/components/teacher-campaign-card";
import {
  APP_INTRO_SEEN_KEY,
  markRegistrationCampaignAnnouncementSeen,
  shouldShowRegistrationCampaignAnnouncement,
} from "@/lib/client/registration-campaign-announcement";
import { useMessages } from "@/lib/i18n/locale-context";
import type { SponsoredTeacherCampaignSummary } from "@/lib/supabase/database.types";

export function RegistrationCampaignAnnouncement() {
  const pathname = usePathname();
  const tc = useMessages().teacherCampaign;
  const [visible, setVisible] = useState(false);
  const [campaigns, setCampaigns] = useState<SponsoredTeacherCampaignSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/auth")) return;

    function evaluate() {
      if (!shouldShowRegistrationCampaignAnnouncement()) {
        setVisible(false);
        return true;
      }

      setVisible(true);
      return false;
    }

    if (evaluate()) return;

    function onStorage(event: StorageEvent) {
      if (event.key === APP_INTRO_SEEN_KEY || event.key === null) {
        evaluate();
      }
    }

    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(() => {
      if (evaluate()) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [pathname]);

  useEffect(() => {
    if (!visible || loading || campaigns.length > 0) return;

    let cancelled = false;
    setLoading(true);

    fetch("/api/teacher/campaign/announcements?placement=explore")
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = (await response.json()) as { data?: SponsoredTeacherCampaignSummary[] };
        return payload.data ?? [];
      })
      .then((items) => {
        if (cancelled) return;
        setCampaigns(items);
        if (items.length === 0) {
          markRegistrationCampaignAnnouncementSeen();
          setVisible(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          markRegistrationCampaignAnnouncementSeen();
          setVisible(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, loading, campaigns.length]);

  function dismiss() {
    markRegistrationCampaignAnnouncementSeen();
    setVisible(false);
  }

  if (!visible || campaigns.length === 0) return null;

  return (
    <div
      aria-labelledby="zigo-registration-campaigns-title"
      aria-modal="true"
      className="fixed inset-0 z-[71] flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm md:items-center md:p-4"
      data-testid="registration-campaign-announcement"
      role="dialog"
    >
      <div className="safe-bottom flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:rounded-[2rem]">
        <div className="bg-gradient-to-br from-violet-700 via-crystal to-fuchsia-500 px-6 pb-7 pt-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">{tc.registrationAnnounceEyebrow}</p>
          <h2 className="zigo-display mt-2 text-white" id="zigo-registration-campaigns-title">
            {tc.registrationAnnounceTitle}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-white/90">{tc.registrationAnnounceDesc}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {campaigns.map((campaign) => (
              <TeacherCampaignCard campaign={campaign} key={campaign.teacher_id} sponsoredLabel={tc.sponsoredBadge} />
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 gap-2">
            <Link
              className="tap-scale zigo-cta rounded-xl px-4 py-3.5 text-center text-sm font-black text-white"
              href="/explore"
              onClick={dismiss}
            >
              {tc.registrationAnnounceExplore}
            </Link>
            <button
              className="tap-scale rounded-xl px-4 py-3 text-sm font-black text-slate-500"
              onClick={dismiss}
              type="button"
            >
              {tc.registrationAnnounceContinue}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
