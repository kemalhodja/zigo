import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { blockSchema } from "@/lib/domain/social/schemas";
import type { Database } from "@/lib/supabase/database.types";

function isMissingUserBlocksTable(error: PostgrestError | null) {
  if (!error) return false;
  return error.code === "42P01" || /user_blocks/i.test(error.message ?? "");
}

export async function getBlockedUserIds(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<string[]> {
  const [{ data: blockedByMe, error: blockedByMeError }, { data: blockedMe, error: blockedMeError }] =
    await Promise.all([
      supabase.from("user_blocks").select("blocked_id").eq("blocker_id", viewerId),
      supabase.from("user_blocks").select("blocker_id").eq("blocked_id", viewerId),
    ]);

  if (blockedByMeError) {
    if (isMissingUserBlocksTable(blockedByMeError)) return [];
    throw blockedByMeError;
  }
  if (blockedMeError) {
    if (isMissingUserBlocksTable(blockedMeError)) return [];
    throw blockedMeError;
  }

  const ids = new Set<string>();
  for (const row of blockedByMe ?? []) ids.add(row.blocked_id);
  for (const row of blockedMe ?? []) ids.add(row.blocker_id);
  return [...ids];
}

export async function isUserBlocked(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  targetUserId: string,
): Promise<boolean> {
  if (viewerId === targetUserId) return false;

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${viewerId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${viewerId})`,
    )
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function hasBlockedUser(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  targetUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", viewerId)
    .eq("blocked_id", targetUserId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function removeFollowsBothWays(
  supabase: SupabaseClient<Database>,
  userA: string,
  userB: string,
) {
  const { error: errorA } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userA)
    .eq("following_id", userB);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userB)
    .eq("following_id", userA);
  if (errorB) throw errorB;
}

export async function toggleBlock(
  supabase: SupabaseClient<Database>,
  input: { blockerId: string; blockedId: string },
) {
  const parsed = blockSchema.parse(input);
  if (input.blockerId === parsed.blockedId) {
    throw new Error("You cannot block your own profile.");
  }

  const blocked = await hasBlockedUser(supabase, input.blockerId, parsed.blockedId);

  if (blocked) {
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", input.blockerId)
      .eq("blocked_id", parsed.blockedId);
    if (error) throw error;
    return { is_blocked: false };
  }

  await removeFollowsBothWays(supabase, input.blockerId, parsed.blockedId);

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: input.blockerId,
    blocked_id: parsed.blockedId,
  });
  if (error) throw error;

  return { is_blocked: true };
}
