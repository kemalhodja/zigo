import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const adminBillingGrantSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("plus"),
    userId: z.string().uuid(),
    periodDays: z.union([z.literal(30), z.literal(90), z.literal(365)]),
    note: z.string().trim().max(240).optional(),
  }),
  z.object({
    kind: z.literal("sponsor"),
    userId: z.string().uuid(),
    packageDays: z.union([z.literal(7), z.literal(30)]),
    note: z.string().trim().max(240).optional(),
  }),
]);

export type AdminBillingGrantInput = z.infer<typeof adminBillingGrantSchema>;

export type AdminBillingGrantLedgerRow = {
  id: string;
  adminId: string;
  userId: string;
  kind: "plus" | "sponsor";
  durationDays: number;
  note: string | null;
  periodEndsAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  adminName: string | null;
};

export function resolveAdminGrantPeriodEnd(periodDays: 30 | 90 | 365, from = new Date()) {
  const end = new Date(from);
  end.setUTCDate(end.getUTCDate() + periodDays);
  return end.toISOString();
}

export function resolveAdminGrantDurationDays(input: AdminBillingGrantInput) {
  return input.kind === "plus" ? input.periodDays : input.packageDays;
}

export function buildAdminBillingGrantInsert(input: {
  adminId: string;
  grant: AdminBillingGrantInput;
  periodEndsAt?: string | null;
}) {
  return {
    admin_id: input.adminId,
    user_id: input.grant.userId,
    kind: input.grant.kind,
    duration_days: resolveAdminGrantDurationDays(input.grant),
    note: input.grant.note?.trim() ? input.grant.note.trim() : null,
    period_ends_at: input.periodEndsAt ?? null,
  };
}

export function summarizeAdminBillingGrant(
  row: Pick<AdminBillingGrantLedgerRow, "kind" | "durationDays" | "userName">,
) {
  const target = row.userName?.trim() || "user";
  if (row.kind === "plus") return `Plus ${row.durationDays}d → ${target}`;
  return `Sponsor ${row.durationDays}d → ${target}`;
}

type AdminClient = SupabaseClient<Database>;

export async function recordAdminBillingGrant(
  admin: AdminClient,
  input: {
    adminId: string;
    grant: AdminBillingGrantInput;
    periodEndsAt?: string | null;
  },
) {
  const payload = buildAdminBillingGrantInsert(input);
  const { data, error } = await admin.from("admin_billing_grants").insert(payload).select("id").maybeSingle();
  if (error) throw error;
  return data;
}

export async function listRecentAdminBillingGrants(
  admin: AdminClient,
  limit = 12,
): Promise<AdminBillingGrantLedgerRow[]> {
  const { data, error } = await admin
    .from("admin_billing_grants")
    .select("id, admin_id, user_id, kind, duration_days, note, period_ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.flatMap((row) => [row.admin_id, row.user_id]))];
  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id, full_name, email")
    .in("id", userIds);
  if (usersError) throw usersError;

  const byId = new Map((users ?? []).map((user) => [user.id, user]));

  return rows.map((row) => {
    const user = byId.get(row.user_id);
    const adminUser = byId.get(row.admin_id);
    return {
      id: row.id,
      adminId: row.admin_id,
      userId: row.user_id,
      kind: row.kind,
      durationDays: row.duration_days,
      note: row.note,
      periodEndsAt: row.period_ends_at,
      createdAt: row.created_at,
      userName: user?.full_name ?? null,
      userEmail: user?.email ?? null,
      adminName: adminUser?.full_name ?? null,
    };
  });
}
