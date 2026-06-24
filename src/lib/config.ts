export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anon);
}

export async function withSupabaseFallback<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv()) return fallback;
  try {
    return await run();
  } catch {
    return fallback;
  }
}
