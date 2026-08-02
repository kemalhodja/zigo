export type SetupFirstTenRole = "teacher" | "parent" | "student";

export type SetupFirstTenPath = {
  role: SetupFirstTenRole;
  href: string;
  steps: string[];
};

export function buildSetupFirstTenPaths(copy: {
  teacherSteps: readonly string[];
  parentSteps: readonly string[];
  studentSteps: readonly string[];
}): SetupFirstTenPath[] {
  return [
    {
      role: "teacher",
      href: "/teacher",
      steps: [...copy.teacherSteps],
    },
    {
      role: "parent",
      href: "/parent",
      steps: [...copy.parentSteps],
    },
    {
      role: "student",
      href: "/micro",
      steps: [...copy.studentSteps],
    },
  ];
}

export function resolveLiveGateFixHref(gateId: string): string | undefined {
  switch (gateId) {
    case "env":
      return "/setup#env";
    case "site_url":
    case "auth_callback":
      return "/setup#hosted-deploy";
    case "schema_areas":
    case "schema_social":
    case "schema_users":
    case "storage_bucket":
    case "moderation_audit":
    case "mvp_content":
      return "/setup#migrations";
    case "service_role":
      return "/setup#env";
    case "registration_matrix":
    case "platform_admin":
      return "/auth";
    case "api":
      return "/setup#env";
    default:
      return undefined;
  }
}
