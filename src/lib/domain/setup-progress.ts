import { hasSupabaseEnv } from "@/lib/config";
import { hasSiteUrlConfigured, isProductionSiteUrl } from "@/lib/domain/deploy-config";
import type { LiveGatesReport } from "@/lib/domain/live-gates";
import { mapLiveGatesToChecklist } from "@/lib/domain/live-gates";
import type { Messages } from "@/lib/i18n/server";

export type SetupProgressStep = {
  id: string;
  title: string;
  detail: string;
  ready: boolean;
  href?: string;
  command?: string;
  ctaLabel?: string;
};

type SetupProgressLabels = Messages["ops"]["setupProgress"];

/**
 * Launch path is intentionally 4 gates only.
 * Service role, Android, full test matrix, and the 71-file migration list live under Advanced.
 */
export function buildSetupProgress(report: LiveGatesReport, sp: SetupProgressLabels): SetupProgressStep[] {
  const live = mapLiveGatesToChecklist(report);

  return [
    {
      id: "env",
      title: sp.envTitle,
      detail: sp.envDetail,
      ready: hasSupabaseEnv(),
      command: "npm run setup:env",
      href: "/setup#env",
      ctaLabel: sp.ctaEnv,
    },
    {
      id: "migrations",
      title: sp.migrationsTitle,
      detail: sp.migrationsDetail,
      ready: Boolean(live.coreSchema && live.rlsPolicies),
      command: "npm run migrations:bundle",
      href: "/setup#migrations",
      ctaLabel: sp.ctaMigrations,
    },
    {
      id: "auth_redirect",
      title: sp.authRedirectTitle,
      detail: hasSiteUrlConfigured()
        ? isProductionSiteUrl()
          ? sp.authRedirectDetail
          : `${sp.authRedirectDetail} ${sp.siteUrlLocal}`
        : sp.authRedirectDetail,
      ready: Boolean(live.authCallback && live.siteUrl),
      href: "/setup#hosted-deploy",
      ctaLabel: sp.ctaAuth,
    },
    {
      id: "try_now",
      title: sp.tryNowTitle,
      detail: sp.tryNowDetail,
      ready: Boolean(live.registrationMatrix || live.mvpSeed),
      href: "/auth",
      ctaLabel: sp.ctaTryNow,
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

export function getNextSetupStep(steps: SetupProgressStep[]) {
  return steps.find((step) => !step.ready) ?? null;
}
