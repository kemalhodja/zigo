import type { LiveGate, LiveGatesReport } from "@/lib/domain/live-gates";
import type { Messages } from "@/lib/i18n/server";

type LiveGateLabels = Messages["ops"]["liveGates"];

function replaceCount(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function replaceStatus(template: string, status: number) {
  return template.replace("{status}", String(status));
}

export function localizeLiveGates(report: LiveGatesReport, labels: LiveGateLabels): LiveGatesReport {
  return {
    ...report,
    gates: report.gates.map((gate) => localizeGate(gate, labels)),
  };
}

function localizeGate(gate: LiveGate, labels: LiveGateLabels): LiveGate {
  switch (gate.id) {
    case "env":
      return {
        ...gate,
        title: labels.envTitle,
        detail: gate.ready ? labels.envOk : labels.envMissing,
        hint: gate.ready ? undefined : labels.envHint,
      };
    case "site_url":
      return {
        ...gate,
        title: labels.siteUrlTitle,
        detail: gate.ready
          ? gate.detail.includes("Production") || gate.detail.includes("production")
            ? labels.siteUrlProd
            : labels.siteUrlLocal
          : labels.siteUrlMissing,
        hint: gate.ready
          ? gate.detail.includes("Local") || gate.detail.includes("local") || gate.detail.includes("Yerel")
            ? labels.siteUrlHintLocal
            : undefined
          : labels.siteUrlHintMissing,
      };
    case "auth_callback":
      return { ...gate, title: labels.authCallbackTitle, detail: labels.authCallbackDetail };
    case "api":
      return {
        ...gate,
        title: labels.apiOkTitle,
        detail: gate.ready ? labels.apiOkDetail : labels.apiFailDetail,
        hint: gate.ready
          ? gate.hint?.startsWith("Auth health")
            ? replaceStatus(labels.httpHint, Number(gate.hint.match(/\d+/)?.[0] ?? 0))
            : undefined
          : labels.apiHint,
      };
    case "service_role":
      return {
        ...gate,
        title: labels.serviceRoleMissingTitle,
        detail: gate.ready ? labels.serviceRoleOkDetail : labels.serviceRoleMissingDetail,
        hint: gate.ready ? undefined : labels.serviceRoleMissingHint,
      };
    case "schema_areas": {
      const count = Number(gate.detail.match(/\d+/)?.[0] ?? 0);
      return {
        ...gate,
        title: labels.areasTitle,
        detail: replaceCount(labels.areasDetail, count),
        hint: gate.ready ? undefined : labels.areasHint,
      };
    }
    case "schema_social":
      return { ...gate, title: labels.socialTitle, detail: labels.socialDetail, hint: gate.hint ?? labels.socialHint };
    case "schema_users": {
      const count = Number(gate.detail.match(/\d+/)?.[0] ?? 0);
      return { ...gate, title: labels.usersTitle, detail: replaceCount(labels.usersDetail, count) };
    }
    case "registration_matrix": {
      const count = Number(gate.detail.match(/\d+/)?.[0] ?? 0);
      return {
        ...gate,
        title: labels.registrationTitle,
        detail: gate.ready ? replaceCount(labels.registrationOk, count) : labels.registrationNeed,
        hint: gate.hint ?? labels.registrationHint,
      };
    }
    case "storage_bucket":
      return { ...gate, title: labels.storageTitle, detail: labels.storageDetail, hint: gate.hint ?? labels.storageHint };
    case "platform_admin": {
      const count = Number(gate.detail.match(/\d+/)?.[0] ?? 0);
      return {
        ...gate,
        title: labels.adminTitle,
        detail: gate.ready ? replaceCount(labels.adminOk, count) : labels.adminMissing,
        hint: gate.hint ?? labels.adminHint,
      };
    }
    case "moderation_audit":
      return { ...gate, title: labels.auditTitle, detail: labels.auditDetail, hint: gate.hint ?? labels.auditHint };
    case "mvp_content": {
      const count = Number(gate.detail.match(/\d+/)?.[0] ?? 0);
      return {
        ...gate,
        title: labels.mvpTitle,
        detail: replaceCount(labels.mvpDetail, count),
        hint: gate.hint ?? labels.mvpHint,
      };
    }
    default:
      return gate;
  }
}
