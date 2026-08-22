import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type GameType =
  | "memory_card"
  | "block_puzzle"
  | "pipe_connect"
  | "word_hunt"
  | "zihin_avcisi"
  | "math_master";

export type GameProgressRow = {
  user_id: string;
  game_type: string;
  high_score: number;
  last_level: number;
  total_plays: number;
  updated_at?: string;
};

type ResultLike<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

type Filterable<T> = T & {
  eq: (column: string, value: unknown) => Filterable<T>;
};

/**
 * Supabase query builder subset for tables that are not part of the
 * generated Database types yet (e.g. game_progress, parent_game_settings).
 */
export type UntypedTableBuilder = {
  select: (
    columns: string,
  ) => Filterable<{
    maybeSingle: () => ResultLike<Record<string, unknown> | null>;
    limit: (count: number) => ResultLike<Record<string, unknown>[]>;
    order: (
      column: string,
      options: { ascending: boolean },
    ) => { limit: (count: number) => ResultLike<Record<string, unknown>[]> };
  }>;
  update: (values: Record<string, unknown>) => Filterable<ResultLike<null>>;
  insert: (values: Record<string, unknown>) => ResultLike<null>;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict: string },
  ) => ResultLike<null>;
};

export function untypedFrom(
  client: SupabaseClient<Database>,
  relation: string,
): UntypedTableBuilder {
  const fromUntyped = client.from as unknown as (relation: string) => UntypedTableBuilder;
  return fromUntyped(relation);
}
