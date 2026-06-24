import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isLocalDemoSupabase } from "@/lib/domain/demo-env";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export type AuthGate = "email" | "onboarding" | "student-document" | "ready";

export function isEmailConfirmationEnforced() {
  if (isLocalDemoSupabase()) return false;
  return process.env.ZIGO_REQUIRE_EMAIL_CONFIRM !== "false";
}

export function isStudentDocumentGateEnforced() {
  if (isLocalDemoSupabase()) return false;
  return process.env.ZIGO_REQUIRE_STUDENT_DOCUMENT !== "false";
}

export function isEmailConfirmed(user: Pick<User, "email_confirmed_at">) {
  return Boolean(user.email_confirmed_at);
}

export function requiresEmailConfirmation(user: Pick<User, "email_confirmed_at">) {
  return isEmailConfirmationEnforced() && !isEmailConfirmed(user);
}

export async function getOnboardingReadyState(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return false;
  if (profile.role === "teacher") return true;

  const { count, error: interestsError } = await supabase
    .from("user_interests")
    .select("area_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (interestsError) return false;
  return Boolean(count && count > 0);
}

export async function resolveAuthGate(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<AuthGate> {
  if (requiresEmailConfirmation(user)) {
    return "email";
  }

  const onboardingReady = await getOnboardingReadyState(supabase, user.id);
  if (!onboardingReady) {
    return "onboarding";
  }

  // Student document upload remains optional; it no longer blocks comments or questions.

  return "ready";
}

export function authGateRedirectPath(gate: AuthGate) {
  switch (gate) {
    case "email":
      return "/auth/verify-email";
    case "onboarding":
      return "/onboarding";
    case "student-document":
      return "/auth/verify-student";
    default:
      return "/";
  }
}

export function isAuthCheckpointPath(pathname: string) {
  return (
    pathname === "/auth/verify-email" ||
    pathname === "/auth/verify-student" ||
    pathname.startsWith("/auth/verify-email/") ||
    pathname.startsWith("/auth/verify-student/")
  );
}

export function roleRequiresStudentDocument(role: UserRole | null | undefined) {
  return role === "student";
}
