import { hasSupabaseEnv } from "@/lib/config";
import { hasSiteUrlConfigured, isProductionSiteUrl } from "@/lib/domain/deploy-config";
import type { LiveGatesReport } from "@/lib/domain/live-gates";
import { mapLiveGatesToChecklist } from "@/lib/domain/live-gates";
import type { Messages } from "@/lib/i18n/server";
import { hasServiceRoleEnv } from "@/lib/supabase/admin";

export type SetupProgressStep = {
  id: string;
  title: string;
  detail: string;
  ready: boolean;
  href?: string;
  command?: string;
};

type SetupProgressLabels = Messages["ops"]["setupProgress"];

export function buildSetupProgress(report: LiveGatesReport, sp: SetupProgressLabels): SetupProgressStep[] {
  const live = mapLiveGatesToChecklist(report);
  const gate = (id: string) => report.gates.find((item) => item.id === id)?.ready ?? false;

  return [
    {
      id: "env",
      title: sp.envTitle,
      detail: sp.envDetail,
      ready: hasSupabaseEnv(),
      command: "npm run env:check",
      href: "/setup",
    },
    {
      id: "site_url",
      title: sp.siteUrlTitle,
      detail: isProductionSiteUrl() ? sp.siteUrlProd : sp.siteUrlLocal,
      ready: hasSiteUrlConfigured(),
      href: "/setup",
    },
    {
      id: "migrations",
      title: sp.migrationsTitle,
      detail: sp.migrationsDetail,
      ready: Boolean(live.coreSchema && live.rlsPolicies),
      href: "/setup#migrations",
    },
    {
      id: "service_role",
      title: sp.serviceRoleTitle,
      detail: sp.serviceRoleDetail,
      ready: hasServiceRoleEnv(),
      command: "npm run test:live",
    },
    {
      id: "auth_redirect",
      title: sp.authRedirectTitle,
      detail: sp.authRedirectDetail,
      ready: gate("auth_callback") && hasSiteUrlConfigured(),
      href: "/setup#hosted-deploy",
    },
    {
      id: "mvp_content",
      title: sp.mvpTitle,
      detail: sp.mvpDetail,
      ready: live.mvpSeed ?? false,
      href: "/create",
    },
    {
      id: "verify",
      title: sp.verifyTitle,
      detail: sp.verifyDetail,
      ready:
        hasSupabaseEnv() &&
        hasSiteUrlConfigured() &&
        report.readyCount === report.totalCount &&
        report.totalCount > 0,
      command: "npm run setup:verify",
      href: "/readiness",
    },
  ];
}

export function summarizeSetupProgress(steps: SetupProgressStep[]) {
  const readyCount = steps.filter((step) => step.ready).length;
  return {
    readyCount,
    totalCount: steps.length,
    percent: steps.length > 0 ? Math.round((readyCount / steps.length) * 100) : 0,
  };
}
