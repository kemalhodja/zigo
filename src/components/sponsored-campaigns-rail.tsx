import Link from "next/link";

import { TeacherCampaignCard } from "@/components/teacher-campaign-card";
import type { SponsoredTeacherCampaignSummary } from "@/lib/supabase/database.types";

type SponsoredCampaignsRailProps = {
  campaigns: SponsoredTeacherCampaignSummary[];
  desc: string;
  policyHref?: string;
  policyLabel?: string;
  sponsoredLabel: string;
  title: string;
};

export function SponsoredCampaignsRail({
  campaigns,
  desc,
  policyHref,
  policyLabel,
  sponsoredLabel,
  title,
}: SponsoredCampaignsRailProps) {
  if (campaigns.length === 0) return null;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-gradient-to-b from-violet-50/80 to-white px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-700">{sponsoredLabel}</p>
          <h2 className="mt-1 text-base font-black text-night">{title}</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{desc}</p>
        </div>
        {policyHref && policyLabel ? (
          <Link className="shrink-0 text-xs font-black text-crystal" href={policyHref}>
            {policyLabel}
          </Link>
        ) : null}
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {campaigns.map((campaign) => (
          <TeacherCampaignCard
            campaign={campaign}
            key={campaign.teacher_id}
            sponsoredLabel={sponsoredLabel}
          />
        ))}
      </div>
    </section>
  );
}
