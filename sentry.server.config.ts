import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://f7d220b90b905f03745ba72e1d340b51@o4511096405753856.ingest.de.sentry.io/4511883729436752",
  tracesSampleRate: 0.1,
  debug: false,
});
