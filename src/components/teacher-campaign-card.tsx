import Image from "next/image";
import Link from "next/link";

import { VerifiedBadge } from "@/components/social-primitives";
import { resolveTeacherCampaignHref } from "@/lib/domain/teacher-campaign";
import type { SponsoredTeacherCampaignSummary } from "@/lib/supabase/database.types";

type TeacherCampaignCardProps = {
  campaign: SponsoredTeacherCampaignSummary;
  sponsoredLabel: string;
};

export function TeacherCampaignCard({ campaign, sponsoredLabel }: TeacherCampaignCardProps) {
  const handle = campaign.teacher_name.toLowerCase().replaceAll(" ", "");

  return (
    <Link
      className="tap-scale block min-w-[16rem] overflow-hidden rounded-lg border border-violet-100 bg-white"
      href={resolveTeacherCampaignHref(campaign.teacher_id)}
    >
      {campaign.cover_image_url ? (
        <div className="relative h-24 w-full">
          <Image alt="" className="object-cover" fill src={campaign.cover_image_url} unoptimized />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-violet-100 to-pink-50" />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-lg bg-violet-100 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-violet-700">
            {sponsoredLabel}
          </span>
          <span className="text-[0.65rem] font-bold text-slate-500">
            {campaign.view_count} · {campaign.click_count}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h3 className="truncate text-sm font-black text-night">{campaign.teacher_name}</h3>
          {campaign.teacher_verified ? <VerifiedBadge className="size-3.5" /> : null}
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">@{handle}</p>
        <p className="mt-3 line-clamp-2 text-sm font-black leading-5 text-night">{campaign.headline}</p>
        {campaign.tagline ? (
          <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600">{campaign.tagline}</p>
        ) : null}
      </div>
    </Link>
  );
}
