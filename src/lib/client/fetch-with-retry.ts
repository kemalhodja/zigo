/**
 * fetch-with-retry.ts
 *
 * Exponential-backoff fetch wrapper shared across the upload pipeline.
 * Retries on network failures and transient 5xx server errors.
 *
 * Backoff schedule (default maxRetries = 2):
 *   attempt 0 → immediate
 *   attempt 1 → 500 ms delay
 *   attempt 2 → 1 000 ms delay
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500 * attempt));
    }

    try {
      const response = await fetch(input, init);

      // Only retry on transient server errors (5xx). Client errors (4xx) are final.
      if (response.status >= 500 && attempt < maxRetries) {
        lastError = new Error(`Server error ${response.status}`);
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
    }
  }

  throw lastError;
}
