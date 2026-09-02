import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type GameType =
  | "memory_card"
  | "block_puzzle"
  | "pipe_connect"
  | "word_hunt"
  | "word_hunt_daily"
  | "zihin_avcisi"
  | "math_master"
  | "taboo"
  | "game_2048"
  | "sudoku";

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
  // NOT: from metodu objeden koparılırsa `this` kaybolur ve supabase-js
  // "Cannot read properties of undefined (reading 'rest')" ile patlar.
  // Bu yüzden .call(client, ...) ile receiver korunur.
  const fromFn = client.from as unknown as (rel: string) => UntypedTableBuilder;
  return fromFn.call(client, relation);
}

type DbError = { message: string; code?: string } | null;

type Exec<T> = PromiseLike<{ data: T; error: DbError }>;

/**
 * Chainable filter node: awaitable at any point and supports
 * eq / in / order / limit like the real Postgrest builder.
 */
export type LooseChain<T> = Exec<T> & {
  eq: (column: string, value: unknown) => LooseChain<T>;
  in: (column: string, values: readonly unknown[]) => LooseChain<T>;
  order: (column: string, options?: { ascending?: boolean }) => LooseChain<T>;
  limit: (count: number) => LooseChain<T>;
};

export type LooseSelect<T> = Exec<T[]> & {
  eq: (column: string, value: unknown) => LooseSelect<T>;
  in: (column: string, values: readonly unknown[]) => LooseSelect<T>;
  order: (column: string, options?: { ascending?: boolean }) => LooseSelect<T>;
  limit: (count: number) => LooseSelect<T>;
  single: () => Exec<T | null>;
  maybeSingle: () => Exec<T | null>;
};

/**
 * Full query-builder subset for tables missing from generated Database types
 * (e.g. private_lesson_posts, private_lesson_bids).
 */
export type LooseTableBuilder<T = Record<string, unknown>> = {
  select: (columns?: string) => LooseSelect<T>;
  insert: (
    values: Record<string, unknown> | Array<Record<string, unknown>>,
  ) => {
    select: (columns?: string) => {
      single: () => Exec<T | null>;
    };
    then: Exec<null>["then"];
  };
  update: (values: Record<string, unknown>) => LooseChain<null>;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string },
  ) => Exec<null>;
  delete: () => LooseChain<null>;
};

export function looseFrom<T = Record<string, unknown>>(
  client: SupabaseClient<Database>,
  relation: string,
): LooseTableBuilder<T> {
  // NOT: from metodu objeden koparılırsa `this` kaybolur ve supabase-js
  // "Cannot read properties of undefined (reading 'rest')" ile patlar.
  // Bu yüzden .call(client, ...) ile receiver korunur.
  const fromFn = client.from as unknown as (rel: string) => LooseTableBuilder<T>;
  return fromFn.call(client, relation);
}
