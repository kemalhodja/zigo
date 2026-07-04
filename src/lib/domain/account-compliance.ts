import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { assertModeratedOptionalText } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

export const deleteAccountRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export async function requestAccountDeletion(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof deleteAccountRequestSchema>,
) {
  const parsed = deleteAccountRequestSchema.parse(input);
  const safeReason = assertModeratedOptionalText(parsed.reason ?? null);
  const { data, error } = await supabase.rpc("request_account_deletion", {
    p_reason: safeReason,
  });
  if (error) throw error;
  return data;
}

export async function exportUserData(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("export_user_data");
  if (error) throw error;
  return data as Record<string, unknown>;
}
