/* global process, fetch */

/**
 * Server-side product analytics capture (PostHog /capture endpoint).
 * Env-gated and fire-and-forget: never throws, never blocks responses.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: properties ?? {},
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // analytics must never break the request path
  }
}
