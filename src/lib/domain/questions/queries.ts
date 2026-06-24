import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export async function getMatchedQuestions(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: interests, error: interestsError } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (interestsError) throw interestsError;

  const areaIds = interests.map((interest) => interest.area_id);

  if (areaIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .in("area_id", areaIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
