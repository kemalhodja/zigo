import { hasSupabaseEnv } from "@/lib/config";
import { hasSiteUrlConfigured, isProductionSiteUrl } from "@/lib/domain/deploy-config";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";

export type LiveGate = {
  id: string;
  title: string;
  detail: string;
  ready: boolean;
  hint?: string;
};

export type LiveGatesReport = {
  envConfigured: boolean;
  serviceRoleConfigured: boolean;
  gates: LiveGate[];
  readyCount: number;
  totalCount: number;
};

export async function getLiveGates(): Promise<LiveGatesReport> {
  const gates: LiveGate[] = [];

  if (!hasSupabaseEnv()) {
    gates.push({
      id: "env",
      title: "Supabase env",
      detail: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local.",
      ready: false,
      hint: "Copy .env.example to .env.local and paste your project keys.",
    });

    return summarize(gates);
  }

  gates.push({
    id: "env",
    title: "Supabase env",
    detail: "Public Supabase URL and anon key are configured.",
    ready: true,
  });

  gates.push({
    id: "site_url",
    title: "Site URL",
    detail: hasSiteUrlConfigured()
      ? isProductionSiteUrl()
        ? "Production NEXT_PUBLIC_SITE_URL is configured for hosted auth redirects."
        : "Local NEXT_PUBLIC_SITE_URL is configured. Update it before public deploy."
      : "NEXT_PUBLIC_SITE_URL is missing from the environment.",
    ready: hasSiteUrlConfigured(),
    hint: hasSiteUrlConfigured()
      ? isProductionSiteUrl()
        ? undefined
        : "Set NEXT_PUBLIC_SITE_URL to your hosted domain and add /auth/callback in Supabase Auth."
      : "Copy NEXT_PUBLIC_SITE_URL from .env.example into .env.local.",
  });

  gates.push({
    id: "auth_callback",
    title: "Auth callback route",
    detail: "Next.js route at /auth/callback exchanges Supabase codes and returns users to Zigo.",
    ready: true,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    gates.push({
      id: "api",
      title: "Supabase API reachable",
      detail: "Auth health endpoint responded from the configured project.",
      ready: response.ok,
      hint: response.ok ? undefined : `Auth health returned HTTP ${response.status}.`,
    });
  } catch {
    gates.push({
      id: "api",
      title: "Supabase API reachable",
      detail: "Could not reach the configured Supabase project.",
      ready: false,
      hint: "Check the project URL, network access and that the Supabase project is not paused.",
    });
  }

  const admin = createAdminClient();
  if (!admin) {
    gates.push({
      id: "service_role",
      title: "Service role key",
      detail: "Add SUPABASE_SERVICE_ROLE_KEY to run automated schema and storage checks.",
      ready: false,
      hint: "Use the service role key only in server env or CI. Never expose it to the browser.",
    });

    return summarize(gates);
  }

  gates.push({
    id: "service_role",
    title: "Service role key",
    detail: "Server-side service role is configured for live gate probes.",
    ready: true,
  });

  const [
    areasResult,
    postsResult,
    usersResult,
    adminsResult,
    auditResult,
    bucketsResult,
  ] = await Promise.all([
    admin.from("education_areas").select("id", { count: "exact", head: true }),
    admin.from("social_posts").select("id", { count: "exact", head: true }),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin.from("platform_admins").select("user_id", { count: "exact", head: true }),
    admin.from("moderation_audit_log").select("id", { count: "exact", head: true }),
    admin.storage.listBuckets(),
  ]);

  const areaCount = areasResult.count ?? 0;
  gates.push({
    id: "schema_areas",
    title: "Education areas seeded",
    detail: `${areaCount} education areas are available for onboarding and Match-Feed.`,
    ready: !areasResult.error && areaCount > 0,
    hint: areasResult.error?.message ?? (areaCount > 0 ? undefined : "Run migrations 001-002 or seed education areas manually."),
  });

  gates.push({
    id: "schema_social",
    title: "Social schema",
    detail: "social_posts table is reachable for feed, reels and explore.",
    ready: !postsResult.error,
    hint: postsResult.error?.message ?? "Apply migrations 008-015 if this table is missing.",
  });

  const userCount = usersResult.count ?? 0;
  gates.push({
    id: "schema_users",
    title: "User profiles",
    detail: `${userCount} profiles exist in public.users.`,
    ready: !usersResult.error,
    hint: usersResult.error?.message,
  });

  gates.push({
    id: "registration_matrix",
    title: "Registration matrix",
    detail: userCount >= 3
      ? `${userCount} accounts ready for student, parent and teacher QA.`
      : "Seed or register at least student, parent and teacher demo accounts.",
    ready: !usersResult.error && userCount >= 3,
    hint: usersResult.error?.message ?? "Run demo seed migrations or register accounts from /auth.",
  });

  const bucketNames = (bucketsResult.data ?? []).map((bucket) => bucket.name);
  gates.push({
    id: "storage_bucket",
    title: "social-media bucket",
    detail: "Storage bucket for post, story and reel media uploads.",
    ready: !bucketsResult.error && bucketNames.includes("social-media"),
    hint: bucketsResult.error?.message ?? "Apply migration 009_social_storage.sql.",
  });

  const adminCount = adminsResult.count ?? 0;
  gates.push({
    id: "platform_admin",
    title: "First platform admin",
    detail: adminCount > 0 ? `${adminCount} platform admin record(s) found.` : "No platform admin exists yet.",
    ready: !adminsResult.error && adminCount > 0,
    hint: adminsResult.error?.message ?? "Insert the first admin into platform_admins from /setup.",
  });

  gates.push({
    id: "moderation_audit",
    title: "Moderation audit log",
    detail: "Audit table for approve/reject moderation actions.",
    ready: !auditResult.error,
    hint: auditResult.error?.message ?? "Apply migration 023_moderation_audit_log.sql.",
  });

  const postCount = postsResult.count ?? 0;
  gates.push({
    id: "mvp_content",
    title: "Starter social content",
    detail: `${postCount} social posts are available for feed, reels and explore demos.`,
    ready: !postsResult.error && postCount > 0,
    hint: postsResult.error?.message ?? "Apply 017_mvp_seed_content.sql or publish as a verified teacher.",
  });

  return summarize(gates);
}

function summarize(gates: LiveGate[]): LiveGatesReport {
  const readyCount = gates.filter((gate) => gate.ready).length;

  return {
    envConfigured: hasSupabaseEnv(),
    serviceRoleConfigured: hasServiceRoleEnv(),
    gates,
    readyCount,
    totalCount: gates.length,
  };
}

export function mapLiveGatesToChecklist(gates: LiveGatesReport) {
  const byId = new Map(gates.gates.map((gate) => [gate.id, gate]));

  return {
    coreSchema: byId.get("schema_areas")?.ready && byId.get("schema_social")?.ready,
    rlsPolicies: byId.get("schema_social")?.ready && byId.get("schema_users")?.ready,
    storageBucket: byId.get("storage_bucket")?.ready ?? false,
    platformAdmin: byId.get("platform_admin")?.ready ?? false,
    moderationAudit: byId.get("moderation_audit")?.ready ?? false,
    mvpSeed: byId.get("mvp_content")?.ready ?? false,
    siteUrl: byId.get("site_url")?.ready ?? false,
    authCallback: byId.get("auth_callback")?.ready ?? false,
    registrationMatrix: byId.get("registration_matrix")?.ready ?? false,
    liveApiReady: byId.get("api")?.ready ?? false,
  };
}
