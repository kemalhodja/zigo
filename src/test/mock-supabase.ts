import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

export type QueryResult = {
  data: unknown;
  error: unknown;
  count?: number | null;
};

type TableHandler = QueryResult | ((context: { table: string }) => QueryResult);

function createThenableBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "eq",
    "in",
    "order",
    "range",
    "limit",
    "or",
    "lt",
    "gt",
    "ilike",
    "upsert",
    "delete",
    "update",
    "insert",
  ] as const;

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }

  builder.single = vi.fn(async () => result);
  builder.maybeSingle = vi.fn(async () => result);

  builder.then = (
    onFulfilled?: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

export function createMockSupabase(options: {
  tables?: Record<string, TableHandler>;
  rpc?: Record<string, QueryResult | ((args: unknown) => QueryResult)>;
  authUser?: { id: string } | null;
}) {
  const tables = options.tables ?? {};
  const rpcHandlers = options.rpc ?? {};

  return {
    from: vi.fn((table: string) => {
      const handler = tables[table];
      if (!handler) {
        throw new Error(`Unexpected Supabase table access: ${table}`);
      }
      const result = typeof handler === "function" ? handler({ table }) : handler;
      return createThenableBuilder(result);
    }),
    rpc: vi.fn((name: string, args?: unknown) => {
      const handler = rpcHandlers[name];
      if (!handler) {
        throw new Error(`Unexpected Supabase RPC access: ${name}`);
      }
      const result = typeof handler === "function" ? handler(args) : handler;
      return Promise.resolve(result);
    }),
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options.authUser ?? null },
        error: null,
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  } as unknown as SupabaseClient<Database>;
}

export const samplePostRow = {
  id: "00000000-0000-4000-8000-000000000601",
  author_id: "00000000-0000-4000-8000-000000000101",
  area_id: 1,
  caption: "Kesirler dersi",
  media_url: null,
  media_type: "image" as const,
  is_reel: false,
  post_type: "normal" as const,
  title: null,
  content: null,
  quiz_id: null,
  legacy_post_id: null,
  premium_prep_label: null,
  premium_prep_url: null,
  sponsored_label: null,
  sponsored_target_url: null,
  sponsored_status: null,
  sponsored_expires_at: null,
  sponsored_disclosure: "Sponsorlu",
  sponsored_click_count: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  author: {
    id: "00000000-0000-4000-8000-000000000101",
    full_name: "Aylin",
    role: "teacher" as const,
    is_verified: true,
  },
  area: { area_name: "Matematik" },
};
