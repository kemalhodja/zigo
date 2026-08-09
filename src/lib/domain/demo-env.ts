export function isLocalDemoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (
    url.includes("127.0.0.1") ||
    url.includes("localhost") ||
    process.env.NODE_ENV !== "production"
  );
}

/** Sample/demo UI is allowed only against local Supabase — never on hosted production. */
export function allowDemoContent() {
  return isLocalDemoSupabase();
}
