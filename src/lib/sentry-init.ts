import * as Sentry from "@sentry/nextjs";

export function initSentry(options: Sentry.NodeOptions | Sentry.BrowserOptions) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    ...options,
    dsn,
  });
}
