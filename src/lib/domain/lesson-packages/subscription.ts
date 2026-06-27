import type { SupabaseClient } from "@supabase/supabase-js";

import { canUseDevBillingBypass } from "@/lib/domain/billing";
import type { Database } from "@/lib/supabase/database.types";

import type { LessonPackagePlanId } from "./plans";

export type LessonPackageAccess = {
  hasAccess: boolean;
  planType: LessonPackagePlanId | "zigo_plus" | null;
  lessonsRemaining: number | null;
  endsAt: string | null;
  expired: boolean;
};

export type LessonPackageSubscriptionRow = {
  id: string;
  user_id: string;
  status: "pending" | "active" | "expired" | "canceled";
  plan_type: LessonPackagePlanId;
  starts_at: string;
  ends_at: string;
  lessons_included: number;
  lessons_used: number;
};

export async function getParentLessonPackageAccess(
  supabase: SupabaseClient<Database>,
  parentId: string,
): Promise<LessonPackageAccess> {
  const { data: zigoPlus, error: plusError } = await supabase
    .from("user_subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", parentId)
    .maybeSingle();

  if (plusError) throw plusError;

  const periodEnd = zigoPlus?.current_period_end ? new Date(zigoPlus.current_period_end) : null;
  const hasZigoPlus =
    zigoPlus?.tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

  if (hasZigoPlus) {
    return {
      hasAccess: true,
      planType: "zigo_plus",
      lessonsRemaining: null,
      endsAt: zigoPlus?.current_period_end ?? null,
      expired: false,
    };
  }

  const { data, error } = await supabase
    .from("lesson_package_subscriptions")
    .select("*")
    .eq("user_id", parentId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      hasAccess: false,
      planType: null,
      lessonsRemaining: 0,
      endsAt: null,
      expired: true,
    };
  }

  const row = data as LessonPackageSubscriptionRow;
  const lessonsRemaining = Math.max(0, row.lessons_included - row.lessons_used);

  return {
    hasAccess: lessonsRemaining > 0,
    planType: row.plan_type,
    lessonsRemaining,
    endsAt: row.ends_at,
    expired: lessonsRemaining <= 0 || new Date(row.ends_at).getTime() <= Date.now(),
  };
}

export async function parentHasActiveLessonPackage(
  supabase: SupabaseClient<Database>,
  parentId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("parent_has_active_lesson_package", {
    for_parent_id: parentId,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function activateLessonPackageSubscription(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    planType: LessonPackagePlanId;
    durationDays?: number;
    stripeCheckoutSessionId?: string;
  },
) {
  const { data, error } = await supabase.rpc("activate_lesson_package_subscription", {
    p_user_id: input.userId,
    p_plan_type: input.planType,
    p_duration_days: input.durationDays ?? 30,
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId ?? undefined,
  });

  if (error) throw error;
  return data as LessonPackageSubscriptionRow;
}

export function canUseDevLessonPackageBypass() {
  return canUseDevBillingBypass();
}
