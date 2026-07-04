import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { assertModeratedOptionalText } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

export const redeemProductSchema = z.object({
  productId: z.string().uuid(),
  note: z.string().trim().max(500).optional().default(""),
});

export const redeemChildProductSchema = redeemProductSchema.extend({
  childProfileId: z.string().uuid(),
});

export const parentRedemptionDecisionSchema = z.object({
  redemptionId: z.string().uuid(),
  status: z.enum(["approved", "cancelled"]),
});

export async function getStoreProducts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("store_products")
    .select("*")
    .eq("is_active", true)
    .order("price_points", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getUserStoreRedemptions(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("store_redemptions")
    .select(
      `
      *,
      product:product_id (
        name,
        category,
        price_points
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function redeemStoreProduct(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof redeemProductSchema>,
) {
  const parsed = redeemProductSchema.parse(input);
  const safeNote = assertModeratedOptionalText(parsed.note || null) ?? "";

  const { data, error } = await supabase.rpc("redeem_store_product", {
    target_product_id: parsed.productId,
    redemption_note: safeNote,
  });

  if (error) throw error;
  return data;
}

export async function redeemChildStoreProduct(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof redeemChildProductSchema>,
) {
  const parsed = redeemChildProductSchema.parse(input);
  const safeNote = assertModeratedOptionalText(parsed.note || null) ?? "";

  const { data, error } = await supabase.rpc("redeem_child_store_product", {
    target_child_profile_id: parsed.childProfileId,
    target_product_id: parsed.productId,
    redemption_note: safeNote,
  });

  if (error) throw error;
  return data;
}

export async function getPendingParentRedemptions(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("store_redemptions")
    .select(
      `
      id,
      status,
      created_at,
      points_spent,
      product:product_id (
        name,
        category
      ),
      child:child_profile_id (
        display_name
      )
    `,
    )
    .eq("status", "pending_parent_approval")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return data ?? [];
}

export async function updateParentStoreRedemption(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof parentRedemptionDecisionSchema>,
) {
  const parsed = parentRedemptionDecisionSchema.parse(input);

  const { data, error } = await supabase.rpc("parent_update_store_redemption_status", {
    target_redemption_id: parsed.redemptionId,
    next_status: parsed.status,
  });

  if (error) throw error;
  return data;
}
