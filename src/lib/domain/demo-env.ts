export function isLocalDemoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.includes("127.0.0.1") || url.includes("localhost:54321");
}

/** Seeded demo accounts used in docs, Playwright, and live scorecard probes. */
export function isDemoAuthEmail(email: string | null | undefined) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith("@zigo.test");
}

/** Sample/demo UI is allowed only against local Supabase — never on hosted production. */
export function allowDemoContent() {
  return isLocalDemoSupabase();
}
