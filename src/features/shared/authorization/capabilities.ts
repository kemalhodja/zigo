import type { UserRole } from "@/lib/supabase/database.types";

import type { AuthContext, AuthzDecision, ZigoCapability } from "./types";

type CapabilityRule = {
  roles: UserRole[];
  requireVerifiedTeacher?: boolean;
  platformAdminOnly?: boolean;
};

export const ZIGO_CAPABILITY_RULES: Record<ZigoCapability, CapabilityRule> = {
  "feed:read_matched": { roles: ["student", "parent", "teacher", "platform"] },
  "post:create": { roles: ["teacher", "platform"], requireVerifiedTeacher: true },
  "question:create": { roles: ["student", "parent"] },
  "answer:create": { roles: ["teacher", "platform"], requireVerifiedTeacher: true },
  "learn:access": { roles: ["student", "parent"] },
  "quiz:author": { roles: ["teacher", "platform"], requireVerifiedTeacher: true },
  "lesson_request:create": { roles: ["parent"] },
  "lesson_request:respond": { roles: ["teacher", "platform"], requireVerifiedTeacher: true },
  "ecosystem:book": { roles: ["parent", "teacher", "platform"] },
  "ecosystem:availability": { roles: ["parent", "teacher", "platform"] },
  "parent:weekly_progress": { roles: ["parent"] },
  "child:manage": { roles: ["parent"] },
  "avatar:customize": { roles: ["student"] },
  "notifications:read": { roles: ["student", "parent", "teacher", "platform"] },
  "admin:platform": { roles: ["teacher", "parent", "student", "platform"], platformAdminOnly: true },
};

export function evaluateCapability(
  ctx: Pick<AuthContext, "role" | "isVerifiedTeacher" | "isPlatformAdmin">,
  capability: ZigoCapability,
): AuthzDecision {
  const rule = ZIGO_CAPABILITY_RULES[capability];

  if (rule.platformAdminOnly && !ctx.isPlatformAdmin) {
    return {
      allowed: false,
      message: "Platform admin access is required.",
      code: "FORBIDDEN",
    };
  }

  if (!rule.roles.includes(ctx.role)) {
    return {
      allowed: false,
      message: "This action is not allowed for your role.",
      code: "FORBIDDEN",
    };
  }

  if (rule.requireVerifiedTeacher && !ctx.isVerifiedTeacher) {
    return {
      allowed: false,
      message: "Verified teacher required.",
      code: "FORBIDDEN",
    };
  }

  return { allowed: true };
}

export function roleHasCapability(
  role: UserRole,
  capability: ZigoCapability,
  options: { isVerifiedTeacher?: boolean; isPlatformAdmin?: boolean } = {},
): boolean {
  return evaluateCapability(
    {
      role,
      isVerifiedTeacher: options.isVerifiedTeacher ?? false,
      isPlatformAdmin: options.isPlatformAdmin ?? false,
    },
    capability,
  ).allowed;
}
