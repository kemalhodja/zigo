import { allowDemoContent } from "@/lib/domain/demo-env";

export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anon);
}

export async function withSupabaseFallback<T>(
  run: () => Promise<T>,
  fallback: T,
  productionFallback?: T,
): Promise<T> {
  const resolvedFallback = allowDemoContent() ? fallback : (productionFallback ?? fallback);
  if (!hasSupabaseEnv()) return resolvedFallback;
  try {
    return await run();
  } catch {
    return resolvedFallback;
  }
}
