import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type ReputationEventKind = "lesson_completed" | "positive_feedback" | "prompt_answer";

const DEFAULT_DELTAS: Record<ReputationEventKind, number> = {
  lesson_completed: 15,
  positive_feedback: 10,
  prompt_answer: 5,
};

export async function recordReputationEvent(
  supabase: SupabaseClient<Database>,
  input: {
    targetUserId: string;
    kind: ReputationEventKind;
    actorId?: string;
    referenceId?: string;
    note?: string;
    delta?: number;
  },
) {
  const { data, error } = await supabase.rpc("record_reputation_event", {
    target_user_id: input.targetUserId,
    event_kind: input.kind,
    event_delta: input.delta ?? DEFAULT_DELTAS[input.kind],
    event_actor_id: input.actorId ?? undefined,
    event_reference_id: input.referenceId ?? undefined,
    event_note: input.note ?? undefined,
  });

  if (error) throw error;
  return data;
}

export async function listReputationEvents(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("reputation_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
