import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeLeaderboardRows } from "@/lib/domain/student-leaderboard";
import type { Database } from "@/lib/supabase/database.types";

export async function getAreaLeaderboard(
  supabase: SupabaseClient<Database>,
  areaId: number,
  limit = 10,
) {
  const rpcCaller = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: Error | null }>;

  const { data, error } = await rpcCaller("get_area_leaderboard", {
    target_area_id: areaId,
    limit_count: Math.min(50, Math.max(1, limit)),
  });

  if (error) throw error;
  return normalizeLeaderboardRows((data ?? []) as unknown as Array<{
    user_id: string;
    full_name: string;
    total_points: number;
    rank: number;
  }>);
}

export async function getPrimaryInterestAreaId(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.area_id ?? null;
}
