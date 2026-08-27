import { redirect } from "next/navigation";

import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Enforces that the current user has one of the allowed roles.
 * Must be used in Server Components or API Routes.
 * If the user is unauthenticated, they will be redirected to the home page or login.
 * If the user is authenticated but does not have the required role, they will be redirected to the home page (or a 403 response in API contexts).
 */
export async function requireRole(allowedRoles: UserRole[], options?: { redirectTo?: string, apiContext?: boolean }) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    if (options?.apiContext) {
      throw new Error("unauthenticated");
    }
    redirect("/?reason=unauthenticated");
  }

  // Fetch role securely from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userData || !userData.role) {
    if (options?.apiContext) {
      throw new Error("role_not_found");
    }
    redirect(options?.redirectTo ?? "/?reason=forbidden");
  }

  const userRole = userData.role as UserRole;
  if (!allowedRoles.includes(userRole)) {
    if (options?.apiContext) {
      throw new Error("forbidden_role");
    }
    redirect(options?.redirectTo ?? "/?reason=forbidden");
  }

  return { user: authData.user, role: userRole };
}
