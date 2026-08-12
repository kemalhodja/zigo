import { initSentry } from "@/lib/sentry-init";

initSentry({
  tracesSampleRate: 0.1,
  debug: false,
});
