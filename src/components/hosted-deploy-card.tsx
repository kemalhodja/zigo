import Link from "next/link";

import {
  getBillingSuccessUrl,
  getSiteUrl,
  getStripeWebhookUrl,
  getSupabaseRedirectUrls,
  hasSiteUrlConfigured,
  isProductionSiteUrl,
  usesVercelFallbackUrl,
} from "@/lib/domain/deploy-config";
import { getServerMessages } from "@/lib/i18n/server";

export async function HostedDeployCard() {
  const { ops: { deploy: d, common: c } } = await getServerMessages();
  const siteUrl = getSiteUrl();
  const redirects = getSupabaseRedirectUrls(siteUrl);
  const productionReady = isProductionSiteUrl();
  const vercelFallback = usesVercelFallbackUrl();

  return (
    <section className="-mx-4 bg-white px-4 py-4" id="hosted-deploy">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.eyebrow}</p>
      <h2 className="mt-2 text-xl font-black text-night">{d.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Set <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_SITE_URL</code> to your hosted domain, then paste the callback URLs into Supabase Auth.
      </p>

      <div className={`mt-4 rounded-lg p-4 ${productionReady ? "bg-mint/20" : "bg-slate-50"}`}>
        <p className="text-sm font-black text-night">
          {productionReady
            ? d.prodConfigured
            : vercelFallback
              ? d.vercelFallback
              : hasSiteUrlConfigured()
                ? d.localConfigured
                : d.notSet}
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-slate-600">{siteUrl}</p>
        {vercelFallback ? (
          <p className="mt-2 text-xs font-bold leading-5 text-amber-800">{d.vercelHint}</p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <DeployCopyRow label={d.redirectUrl} value={redirects.callback} />
        <DeployCopyRow label={d.emailConfirmRedirect} value={redirects.onboarding} />
        <DeployCopyRow label={d.stripeWebhook} value={getStripeWebhookUrl(siteUrl)} />
        <DeployCopyRow label={d.billingSuccess} value={getBillingSuccessUrl(siteUrl)} />
      </div>

      <div className="mt-4 grid gap-2">
        <DeployEnvRow name="NEXT_PUBLIC_SUPABASE_URL" publicLabel={c.publicEnv} serverLabel={c.serverOnly} />
        <DeployEnvRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" publicLabel={c.publicEnv} serverLabel={c.serverOnly} />
        <DeployEnvRow name="NEXT_PUBLIC_SITE_URL" publicLabel={c.publicEnv} serverLabel={c.serverOnly} />
        <DeployEnvRow name="SUPABASE_SERVICE_ROLE_KEY" publicLabel={c.publicEnv} serverLabel={c.serverOnly} serverOnly />
        <DeployEnvRow name="STRIPE_SECRET_KEY" publicLabel={c.publicEnv} serverLabel={c.serverOnly} serverOnly />
        <DeployEnvRow name="STRIPE_WEBHOOK_SECRET" publicLabel={c.publicEnv} serverLabel={c.serverOnly} serverOnly />
        <DeployEnvRow name="STRIPE_PRICE_ID_ZIGO_PLUS" publicLabel={c.publicEnv} serverLabel={c.serverOnly} serverOnly />
        <DeployEnvRow name="NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED" publicLabel={c.publicEnv} serverLabel={c.serverOnly} />
      </div>

      <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{d.migrationsHint}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          className="rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white"
          href="/vercel-deploy.md"
        >
          {d.vercelDeploy}
        </a>
        <a
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night"
          href="/staging-deploy.md"
        >
          {d.stagingGuide}
        </a>
        <a
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night"
          href="/hosted-deploy-checklist.md"
        >
          {d.deployChecklist}
        </a>
        <Link
          className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night"
          href="/auth/callback"
        >
          {d.callbackRoute}
        </Link>
      </div>
    </section>
  );
}

function DeployCopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950 px-3 py-2.5">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-all text-xs font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

function DeployEnvRow({
  name,
  publicLabel,
  serverLabel,
  serverOnly = false,
}: {
  name: string;
  publicLabel: string;
  serverLabel: string;
  serverOnly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <code className="text-xs font-black text-night">{name}</code>
      {serverOnly ? (
        <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[0.62rem] font-black uppercase text-amber-800">
          {serverLabel}
        </span>
      ) : (
        <span className="shrink-0 rounded-md bg-slate-200 px-2 py-0.5 text-[0.62rem] font-black uppercase text-slate-700">
          {publicLabel}
        </span>
      )}
    </div>
  );
}
