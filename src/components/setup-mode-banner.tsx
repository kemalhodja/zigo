import Link from "next/link";

import { isProductionSiteUrl } from "@/lib/domain/deploy-config";
import type { Messages } from "@/lib/i18n/server";

type SetupModeBannerProps = {
  labels: Messages["ops"]["setupPage"]["mode"];
};

export function SetupModeBanner({ labels }: SetupModeBannerProps) {
  const production = isProductionSiteUrl();

  return (
    <section
      className={`-mx-4 border-b px-4 py-3 ${
        production ? "border-amber-100 bg-amber-50" : "border-mint/30 bg-mint/15"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">
            {production ? labels.prodEyebrow : labels.localEyebrow}
          </p>
          <p className="mt-1 text-sm font-black text-night">{production ? labels.prodTitle : labels.localTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{production ? labels.prodDesc : labels.localDesc}</p>
        </div>
        <Link
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-night"
          href={production ? "/setup#hosted-deploy" : "/setup#demo-accounts"}
        >
          {production ? labels.prodCta : labels.localCta}
        </Link>
      </div>
    </section>
  );
}
